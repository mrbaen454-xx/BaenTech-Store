package com.baentech.order_service.service.serviceImpl;

import com.baentech.order_service.entity.Order;
import com.baentech.order_service.entity.OrderItem;
import com.baentech.order_service.entity.OrderStatus;
import com.baentech.order_service.payload.client.CartClientResponse;
import com.baentech.order_service.payload.client.CartItemClientResponse;
import com.baentech.order_service.payload.client.EmailClientRequest;
import com.baentech.order_service.payload.client.ProductStockItemClientRequest;
import com.baentech.order_service.payload.client.ReduceStockClientRequest;
import com.baentech.order_service.payload.req.CheckoutRequest;
import com.baentech.order_service.payload.req.UpdateOrderStatusRequest;
import com.baentech.order_service.payload.res.MessageResponse;
import com.baentech.order_service.payload.res.OrderItemResponse;
import com.baentech.order_service.payload.res.OrderResponse;
import com.baentech.order_service.repository.OrderRepository;
import com.baentech.order_service.service.OrderService;

import lombok.RequiredArgsConstructor;

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

    @Override
    public OrderResponse checkout(String email, String token, CheckoutRequest request) {
        try {
            CartClientResponse cart = getCartFromCartService(token);

            if (cart == null || cart.getItems() == null || cart.getItems().isEmpty()) {
                throw new RuntimeException("Cart masih kosong, tidak bisa checkout");
            }

            String orderNumber = generateOrderNumber();

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
                BigDecimal price = cartItem.getPrice() != null
                        ? cartItem.getPrice()
                        : BigDecimal.ZERO;

                Integer quantity = cartItem.getQuantity() != null
                        ? cartItem.getQuantity()
                        : 1;

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

    @Override
    public OrderResponse updateOrderStatus(Long id, String token,UpdateOrderStatusRequest request) {
        try {
            Order order = orderRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Order tidak ditemukan"));

            OrderStatus oldStatus = order.getStatus();
            OrderStatus newStatus = request.getStatus();

            order.setStatus(newStatus);

            Order updatedOrder = orderRepository.save(order);

            if (newStatus == OrderStatus.PAID && oldStatus != OrderStatus.PAID) {
                reduceProductStock(updatedOrder, token);
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

            if (order.getStatus() != OrderStatus.PAID) {
                throw new RuntimeException("Order hanya bisa diselesaikan jika status PAID");
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
    
    private boolean isAdmin()
    {
        return SecurityContextHolder.getContext()
            .getAuthentication()
            .getAuthorities()
            .stream()
            .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));
    }

    private void reduceProductStock(Order order,String token) {
        try {
            List<ProductStockItemClientRequest> stockItems = order.getItems().stream()
            .map(item -> new ProductStockItemClientRequest(item.getProductId(), item.getQuantity())).toList();

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

    private String generateOrderNumber() {
        try {
            String date = LocalDate.now().toString().replace("-", "");
            int randomNumber = new Random().nextInt(9000) + 1000;

            String orderNumber = "ORD-" + date + "-" + randomNumber;

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
}