package com.baentech.order_service.service.serviceImpl;

import com.baentech.order_service.entity.Order;
import com.baentech.order_service.entity.OrderItem;
import com.baentech.order_service.entity.OrderStatus;
import com.baentech.order_service.payload.client.CartClientResponse;
import com.baentech.order_service.payload.client.CartItemClientResponse;
import com.baentech.order_service.payload.client.EmailClientRequest;
import com.baentech.order_service.payload.client.ProductStockItemClientRequest;
import com.baentech.order_service.payload.client.ReduceStockClientRequest;
import com.baentech.order_service.payload.client.ProductClientResponse;
import com.baentech.order_service.payload.req.CheckoutRequest;
import com.baentech.order_service.payload.req.UpdateOrderStatusRequest;
import com.baentech.order_service.payload.res.MessageResponse;
import com.baentech.order_service.payload.res.OrderItemResponse;
import com.baentech.order_service.payload.res.OrderResponse;
import com.baentech.order_service.repository.OrderRepository;
import com.baentech.order_service.service.OrderService;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;

    private final WebClient.Builder webClientBuilder;

    @Value("${internal.api-key}")
    private String internalApiKey;

    @Value("${product.service.url:http://PRODUCT-SERVICE}")
    private String productServiceUrl;

    @Override
    @Transactional
    public OrderResponse checkout(String email, String token, CheckoutRequest request) {
        try {
            //Mengambil cart user dari cart-service
            //token dikirim ke cart-service agar tahu user mana yang sedang login
            CartClientResponse cart = getCartFromCartService(token);

            if (cart == null || cart.getItems() == null || cart.getItems().isEmpty()) {
                throw new RuntimeException("Cart masih kosong, tidak bisa checkout");
            }

            String orderNumber = generateOrderNumber();//membuat nomor order otomatis

            Order order = Order.builder()
                    .orderNumber(orderNumber)
                    .email(email)
                    .recipientName(request.getRecipientName())
                    .phoneNumber(request.getPhoneNumber())
                    .shippingAddress(request.getShippingAddress())
                    .city(request.getCity())
                    .province(request.getProvince())
                    .postalCode(request.getPostalCode())
                    .status(OrderStatus.PENDING_PAYMENT)
                    .totalPrice(BigDecimal.ZERO)
                    .build();

            BigDecimal totalPrice = BigDecimal.ZERO;

            for (CartItemClientResponse cartItem : cart.getItems()) {
                // Verifikasi stok produk dari product-service
                ProductClientResponse product = getProductFromProductService(cartItem.getProductId());
                if (product == null) {
                    throw new RuntimeException("Produk tidak ditemukan: " + cartItem.getProductName());
                }
                
                int stock = product.getStock() != null ? product.getStock() : 0;
                int reqQuantity = cartItem.getQuantity() != null ? cartItem.getQuantity() : 1;
                
                if (stock < reqQuantity) {
                    throw new RuntimeException("Stok produk tidak mencukupi untuk: " + product.getName() + " (Stok tersisa: " + stock + ")");
                }

                //mengambil harga item dari cart,jika harga null, dianggap 0
                BigDecimal price = cartItem.getPrice() != null
                        ? cartItem.getPrice()
                        : BigDecimal.ZERO;

                //mengambil quentity itm jika quentity null, dianggap 1
                Integer quantity = cartItem.getQuantity() != null
                        ? cartItem.getQuantity()
                        : 1;

                //menghitung subtotal
                BigDecimal subTotal = price.multiply(BigDecimal.valueOf(quantity));

                OrderItem orderItem = OrderItem.builder()
                        .order(order)
                        .productId(cartItem.getProductId())
                        .productName(cartItem.getProductName())
                        .productBrand(cartItem.getProductBrand())
                        .productImageUrl(cartItem.getProductImageUrl())
                        .price(price)
                        .quantity(quantity)
                        .subTotal(subTotal)
                        .build();

                order.getItems().add(orderItem);

                totalPrice = totalPrice.add(subTotal);
            }

            
            order.setTotalPrice(totalPrice);

            Order savedOrder = orderRepository.save(order);

            // mengkosongkan cart user setelah order berhasil di buat
            clearCartFromCartService(token);

            sendOrderCreatedEmail(savedOrder);

            return mapToOrderResponse(savedOrder);

        } catch (Exception e) {
            throw new RuntimeException("Gagal checkout order: " + e.getMessage());
        }
    }

    @Override
    public List<OrderResponse> getMyOrders(String email) {
        try {
            List<Order> orders = orderRepository.findByEmailOrderByCreatedAtDesc(email);

            return orders.stream()
                    .map(this::mapToOrderResponse)
                    .toList();

        } catch (Exception e) {
            throw new RuntimeException("Gagal mengambil order user: " + e.getMessage());
        }
    }

    @Override
    public OrderResponse getOrderById(String email, Long id) {
        try {
            Order order = orderRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Order tidak ditemukan"));

            // jika bukan admin dan order tidak sama dengan email user login maka akses ditolak
            if (!isAdmin() && !order.getEmail().equals(email)) {
                throw new RuntimeException("Anda tidak memiliki akses ke order ini");
            }

            return mapToOrderResponse(order);

        } catch (Exception e) {
            throw new RuntimeException("Gagal mengambil detail order: " + e.getMessage());
        }
    }

    @Override
    public List<OrderResponse> getAllOrders() {
        try {
            List<Order> orders = orderRepository.findAll();

            return orders.stream()
                    .map(this::mapToOrderResponse)
                    .toList();

        } catch (Exception e) {
            throw new RuntimeException("Gagal mengambil semua order: " + e.getMessage());
        }
    }

    //method ini di pakai untuk mengubah status order,
    //digunakan admin
    //method ini juga bisa mengurangi stok produk jika status berubah menjadi PAID
    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Long id, String token, UpdateOrderStatusRequest request) {
        try {
            Order order = orderRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Order tidak ditemukan"));

            OrderStatus oldStatus = order.getStatus();
            OrderStatus newStatus = request.getStatus();

            //cek apakah perpindahan status diperbolehkan
            validateStatusTransition(oldStatus, newStatus);

            order.setStatus(newStatus);

            Order updatedOrder = orderRepository.save(order);

            // Jika status baru menjadi PAID dan sebelumnya belum PAID, maka stok produk harus dikurangi
            if (newStatus == OrderStatus.PAID && oldStatus != OrderStatus.PAID) {
                //Mengambil product-service untuk mengurangi stok produk
                // token dikirim ke product-service lewat header authorization
                reduceProductStock(updatedOrder, token);
            }

            // Jika dibatalkan dan status sebelumnya memotong stok, kembalikan stoknya
            if (newStatus == OrderStatus.CANCELLED && 
                (oldStatus == OrderStatus.PAID || oldStatus == OrderStatus.PROCESSING || oldStatus == OrderStatus.SHIPPED)) {
                restoreProductStockInternal(updatedOrder);
            }

            return mapToOrderResponse(updatedOrder);

        } catch (Exception e) {
            throw new RuntimeException("Gagal mengubah status order: " + e.getMessage());
        }
    }

    @Override
    public MessageResponse cancelOrder(String email, Long id) {
        try {
            Order order = orderRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Order tidak ditemukan"));

            if (!order.getEmail().equals(email)) {
                throw new RuntimeException("Anda tidak memiliki akses ke order ini");
            }

            //mengece apakah order sudah diproses,jika status nya seperti di bawah ini maka order tidak bsia dibatalkan
            if (order.getStatus() == OrderStatus.PAID
                    || order.getStatus() == OrderStatus.PROCESSING
                    || order.getStatus() == OrderStatus.SHIPPED
                    || order.getStatus() == OrderStatus.COMPLETED) {
                throw new RuntimeException("Order tidak bisa dibatalkan karena sudah diproses");
            }

            order.setStatus(OrderStatus.CANCELLED);

            orderRepository.save(order);

            return MessageResponse.builder()
                    .success(true)
                    .message("Order berhasil dibatalkan")
                    .build();

        } catch (Exception e) {
            throw new RuntimeException("Gagal membatalkan order: " + e.getMessage());
        }
    }

    @Override
    public OrderResponse completeOrder(String email, Long id) {
        try {
            Order order = orderRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Order tidak ditemukan"));

            if (!order.getEmail().equals(email)) {
                throw new RuntimeException("Anda tidak memiliki akses ke order ini");
            }

            if (order.getStatus() != OrderStatus.SHIPPED) {
                throw new RuntimeException("Order hanya bisa diselesaikan jika status SHIPPED");
            }

            order.setStatus(OrderStatus.COMPLETED);

            Order savedOrder = orderRepository.save(order);

            return mapToOrderResponse(savedOrder);

        } catch (Exception e) {
            throw new RuntimeException("Gagal menyelesaikan order: " + e.getMessage());
        }
    }

    private void sendOrderCreatedEmail(Order order) {
        try {
            EmailClientRequest emailRequest = new EmailClientRequest(
                    order.getEmail(),
                    "Pesanan Berhasil Dibuat - BaenTech Store",
                    "Halo " + order.getRecipientName() + ",\n\n" +
                            "Pesanan kamu berhasil dibuat di BaenTech Store.\n\n" +
                            "Nomor Order: " + order.getOrderNumber() + "\n" +
                            "Total Pembayaran: Rp " + order.getTotalPrice() + "\n\n" +
                            "Silakan lanjutkan pembayaran agar pesanan kamu dapat segera diproses.\n\n" +
                            "Terima kasih sudah berbelanja di BaenTech Store.\n\n" +
                            "Salam,\n" +
                            "BaenTech Store"
            );

            webClientBuilder.build()
                    .post()
                    .uri("http://NOTIFICATION-SERVICE/api/notifications/send-email")
                    .bodyValue(emailRequest)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

        } catch (Exception e) {
            System.out.println("Gagal mengirim email order created: " + e.getMessage());
        }
    }

    //untuk mengecek apakah user login adalah admin
    private boolean isAdmin() {
        return SecurityContextHolder.getContext().getAuthentication()//mengambil data authentication user login dari spring security
                .getAuthorities()
                .stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));
    }

    //untuk mengecek perpindahan status order
    private void validateStatusTransition(OrderStatus oldStatus, OrderStatus newStatus) {
        //status baru tidak boleh kosong
        if (newStatus == null) {
            throw new RuntimeException("Status order tidak boleh kosong");
        }

        //jika status baru sama dengan status lama,tidak perlu validasi lanjuttan
        if (oldStatus == newStatus) {
            return;
        }

        //order yang sudah cancelled tidak boleh diubah lagi
        if (oldStatus == OrderStatus.COMPLETED) {
            throw new RuntimeException("Order yang sudah COMPLETED tidak bisa diubah statusnya");
        }


        //order yang sudah cancelled tidak boleh diubah lagi
        if (oldStatus == OrderStatus.CANCELLED) {
            throw new RuntimeException("Order yang sudah CANCELLED tidak bisa diubah statusnya");
        }

        switch (newStatus) {
            //order hanya bisa menjadi PAID dari PENDING_PAYMENT
            case PAID -> {
                if (oldStatus != OrderStatus.PENDING_PAYMENT) {
                    throw new RuntimeException("Order hanya bisa menjadi PAID dari status PENDING_PAYMENT");
                }
            }
            //Order hanay bisa menjadi SHIPPED jika status PAID atau PROCESSING
            case SHIPPED -> {
                if (oldStatus != OrderStatus.PAID && oldStatus != OrderStatus.PROCESSING) {
                    throw new RuntimeException("Order hanya bisa menjadi SHIPPED jika status PAID");
                }
            }
            //Order hanya bisa menjadi COMPLETED jika status SHIPPED
            case COMPLETED -> {
                if (oldStatus != OrderStatus.SHIPPED) {
                    throw new RuntimeException("Order hanya bisa menjadi COMPLETED jika status SHIPPED");
                }
            }
            //Order hanya bisa CANCELLED jika status PENDING_PAYMENT, PAID, atau PROCESSING
            case CANCELLED -> {
                if (oldStatus != OrderStatus.PENDING_PAYMENT && oldStatus != OrderStatus.PAID && oldStatus != OrderStatus.PROCESSING) {
                    throw new RuntimeException("Order hanya bisa dibatalkan sebelum dikirim atau selesai");
                }
            }
            //Order hanya bisa menjadi PROCESSING jika status PAID
            case PROCESSING -> {
                if (oldStatus != OrderStatus.PAID) {
                    throw new RuntimeException("Order hanya bisa menjadi PROCESSING jika status PAID");
                }
            }
            //Order tidak bisa dikembalikan ke PENDING_PAYMENT
            case PENDING_PAYMENT -> throw new RuntimeException("Order tidak bisa dikembalikan ke PENDING_PAYMENT");
        }
    }

    private void reduceProductStock(Order order, String token) {
        try {
            //mengubah order items menjadi list request pengurangan stok
            //setiap item berisi , productId dan quantity
            List<ProductStockItemClientRequest> stockItems = order.getItems().stream()
                    .map(item -> new ProductStockItemClientRequest(item.getProductId(), item.getQuantity())).toList();

            //membuat request pengurangan stok
            ReduceStockClientRequest request = new ReduceStockClientRequest(stockItems);

            webClientBuilder.build()
                    .put()
                    .uri("http://PRODUCT-SERVICE/api/products/stock/reduce")
                    .header("Authorization", token)
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
        } catch (Exception e) {

            throw new RuntimeException("Gagal mengurangi stok produk: " + e.getMessage());
        }
    }

    //method ini juga dipakai untuk mengurangi stok produk
    //bedanya method ini menggunakan internal token
    private void reduceProductStockInternal(Order order) {
    try {
        List<ProductStockItemClientRequest> stockItems = order.getItems().stream()
                .map(item -> new ProductStockItemClientRequest(item.getProductId(), item.getQuantity()))
                .toList();

        //membuat request pengurangan stok
        ReduceStockClientRequest request = new ReduceStockClientRequest(stockItems);

        webClientBuilder.build()
                .put()
                .uri(productServiceUrl + "/api/products/internal/stock/reduce")
                .header("X-Internal-Token", internalApiKey)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(String.class)
                .block();

    } catch (Exception e) {
        throw new RuntimeException("Gagal mengurangi stok produk internal: " + e.getMessage());
    }
}

    //dipakai untuk mengambil cart user dari cart-service
    private CartClientResponse getCartFromCartService(String token) {
        try {
            return webClientBuilder.build()
                    .get()
                    .uri("http://CART-SERVICE/api/carts")
                    .header("Authorization", token)
                    .retrieve()
                    .bodyToMono(CartClientResponse.class)
                    .block();

        } catch (Exception e) {
            throw new RuntimeException("Gagal mengambil cart dari cart-service: " + e.getMessage());
        }
    }

    private ProductClientResponse getProductFromProductService(Long productId) {
        try {
            return webClientBuilder.build()
                    .get()
                    .uri("http://PRODUCT-SERVICE/api/products/" + productId)
                    .retrieve()
                    .bodyToMono(ProductClientResponse.class)
                    .block();
        } catch (Exception e) {
            throw new RuntimeException("Gagal mengambil data produk dari product-service: " + e.getMessage());
        }
    }

    private void restoreProductStockInternal(Order order) {
        try {
            List<ProductStockItemClientRequest> stockItems = order.getItems().stream()
                    .map(item -> new ProductStockItemClientRequest(item.getProductId(), item.getQuantity()))
                    .toList();

            ReduceStockClientRequest request = new ReduceStockClientRequest(stockItems);

            webClientBuilder.build()
                    .put()
                    .uri(productServiceUrl + "/api/products/internal/stock/restore")
                    .header("X-Internal-Token", internalApiKey)
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

        } catch (Exception e) {
            throw new RuntimeException("Gagal mengembalikan stok produk internal: " + e.getMessage());
        }
    }

    //dipakai untuk mengosongkan cart user di cart-service
    private void clearCartFromCartService(String token) {
        try {
            webClientBuilder.build()
                    .delete()
                    .uri("http://CART-SERVICE/api/carts/clear")
                    .header("Authorization", token)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

        } catch (Exception e) {
            throw new RuntimeException("Gagal mengosongkan cart dari cart-service: " + e.getMessage());
        }
    }

    //dipakai untuk membuat nomor order secara otomatis
    private String generateOrderNumber() {
        try {
            //mengambil tanggal saat ini lalu mengganti tanda " - " dengan string kosong
            String date = LocalDate.now().toString().replace("-", "");
            //membuat angka random 4 digit, Hasilnya antara 1000 sampai 9999
            int randomNumber = new Random().nextInt(9000) + 1000;

            //membuat nomor order
            String orderNumber = "ORD-" + date + "-" + randomNumber;

            //mengecek apakah nomor order sudah ada di database, Jika sudah ada, generate angka random baru
            while (orderRepository.existsByOrderNumber(orderNumber)) {
                randomNumber = new Random().nextInt(9000) + 1000;
                orderNumber = "ORD-" + date + "-" + randomNumber;
            }

            return orderNumber;

        } catch (Exception e) {
            throw new RuntimeException("Gagal membuat nomor order: " + e.getMessage());
        }
    }

    private OrderResponse mapToOrderResponse(Order order) {
        try {
            List<OrderItemResponse> itemResponses = order.getItems().stream()
                    .map(this::mapToOrderItemResponse)
                    .toList();

            return OrderResponse.builder()
                    .id(order.getId())
                    .orderNumber(order.getOrderNumber())
                    .email(order.getEmail())
                    .recipientName(order.getRecipientName())
                    .phoneNumber(order.getPhoneNumber())
                    .shippingAddress(order.getShippingAddress())
                    .city(order.getCity())
                    .province(order.getProvince())
                    .postalCode(order.getPostalCode())
                    .totalPrice(order.getTotalPrice())
                    .status(order.getStatus())
                    .items(itemResponses)
                    .createdAt(order.getCreatedAt())
                    .updatedAt(order.getUpdatedAt())
                    .build();

        } catch (Exception e) {
            throw new RuntimeException("Gagal mapping order: " + e.getMessage());
        }
    }

    private OrderItemResponse mapToOrderItemResponse(OrderItem item) {
        try {
            return OrderItemResponse.builder()
                    .id(item.getId())
                    .productId(item.getProductId())
                    .productName(item.getProductName())
                    .productBrand(item.getProductBrand())
                    .productImageUrl(item.getProductImageUrl())
                    .price(item.getPrice())
                    .quantity(item.getQuantity())
                    .subTotal(item.getSubTotal())
                    .createdAt(item.getCreatedAt())
                    .updatedAt(item.getUpdatedAt())
                    .build();

        } catch (Exception e) {
            throw new RuntimeException("Gagal mapping order item: " + e.getMessage());
        }
    }

    //dipakai untuk menandai order sebagai sudah di bayar
    //biasanya method ini dipanggil oleh payment-service setelah pembayarn sukses
    @Override
    @Transactional
    public OrderResponse markOrderAsPaid(String internalToken, Long id) {
        //mengecek internal token , jika token kosong atau salah, request ditolak
        if (internalToken == null || !internalToken.equals(internalApiKey)) {
            throw new RuntimeException("Internal token tidak valid");
        }

        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order tidak ditemukan"));

        //order yang sudah cancelled tidak bisa ditandai PAID
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new RuntimeException("Order sudah CANCELLED dan tidak bisa ditandai PAID");
        }
        //order yang sudah dikirim atau selesai tidak bisa ditandai PAID ulang
        if (order.getStatus() == OrderStatus.COMPLETED || order.getStatus() == OrderStatus.SHIPPED) {
            throw new RuntimeException("Order sudah diproses dan tidak bisa ditandai PAID ulang");
        }
        //jika order sudah paid,langsung return response tanpa mengubah lagi
        if (order.getStatus() == OrderStatus.PAID) {
            return mapToOrderResponse(order);
        }

        //order hanya bisa ditandai PAID dari status PENDING_PAYMENT
        if (order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new RuntimeException("Order hanya bisa ditandai PAID dari status PENDING_PAYMENT");
        }

        order.setStatus(OrderStatus.PAID);

        Order savedOrder = orderRepository.save(order);

        reduceProductStockInternal(savedOrder);

        return mapToOrderResponse(savedOrder);
    }
    
    @Override
    public boolean hasUserPurchasedProduct(String email, Long productId) {
        try {
            List<Order> orders = orderRepository.findByEmailOrderByCreatedAtDesc(email);
            for (Order order : orders) {
                if (order.getStatus() == OrderStatus.COMPLETED) {
                    boolean hasProduct = order.getItems().stream()
                        .anyMatch(item -> item.getProductId().equals(productId));
                    if (hasProduct) return true;
                }
            }
            return false;
        } catch (Exception e) {
            throw new RuntimeException("Gagal verifikasi pembelian produk: " + e.getMessage());
        }
    }
}
