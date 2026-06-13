package com.baentech.shipping_service.service.serviceImpl;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.baentech.shipping_service.entity.Shipping;
import com.baentech.shipping_service.entity.ShippingStatus;
import com.baentech.shipping_service.payload.client.EmailClientRequest;
import com.baentech.shipping_service.payload.client.OrderClientResponse;
import com.baentech.shipping_service.payload.req.CreateShippingRequest;
import com.baentech.shipping_service.payload.req.ShipOrderRequest;
import com.baentech.shipping_service.payload.res.MessageResponse;
import com.baentech.shipping_service.payload.res.ShippingResponse;
import com.baentech.shipping_service.repository.ShippingRepository;
import com.baentech.shipping_service.service.ShippingService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ShippingServiceImpl implements ShippingService
{
    private final ShippingRepository shippingRepository;

    private final WebClient.Builder webClientBuilder;

    @Override
    public ShippingResponse createShipping(String token, CreateShippingRequest request)
    {
        try {
            if (shippingRepository.existsByOrderId(request.getOrderId())) {
                throw new RuntimeException("Shipping order id " + request.getOrderId() + " sudah ada");
            }

            OrderClientResponse order = getOrderFromOrderService(request.getOrderId(),token);

            if (order == null) {
                throw new RuntimeException("Order tidak ditemukan");
            }
            if (!"PAID".equalsIgnoreCase(order.getStatus())) {
                throw new RuntimeException("Shipping hanya bisa dibuat untuk order yang sudah PAID");
            }

            Shipping shipping = Shipping.builder()
                .orderId(order.getId())
                .orderNumber(order.getOrderNumber())
                .email(order.getEmail())
                .recipientName(order.getRecipientName())
                .phoneNumber(order.getPhoneNumber())
                .shippingAddress(order.getShippingAddress())
                .city(order.getCity())
                .province(order.getProvince())
                .postalCode(order.getPostalCode())
                .status(ShippingStatus.PENDING)
                .build();

            Shipping shippingSaved = shippingRepository.save(shipping);

            return mapToShippingResponse(shippingSaved);
        
        } catch (Exception e) {
            throw new RuntimeException("Gagal membuat shipping : " + e.getMessage());
        }
        
    }

    @Override
    public List<ShippingResponse> getMyShippings(String email) 
    {
        try {
            List<Shipping> shippings = shippingRepository.findByEmailOrderByCreatedAtDesc(email);

            return shippings.stream().map(this::mapToShippingResponse).toList();
        } catch (Exception e) {
            throw new RuntimeException("Gagal mengambil shipping user : " + e.getMessage());
        }
        
    }

    @Override
    public ShippingResponse getShippingById(String email,Long id)
    {
        try {
            Shipping shipping = shippingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Shipping tidak ditemukan"));

            if (!shipping.getEmail().equals(email)) {
                throw new RuntimeException("Anda tidak memiliki akses ke shipping ini");
            }

            return mapToShippingResponse(shipping);
        } catch (Exception e) {
            throw new RuntimeException("Gagal mengambil detail shipping : " + e.getMessage());
        }
    }
    @Override
    public ShippingResponse getShippingByOrderId(String email,Long orderId)
    {
        try {
            Shipping shipping = shippingRepository.findByOrderId(orderId)
            .orElseThrow(() -> new RuntimeException("Shipping untuk order ini tidak ditemukan"));

            if (!shipping.getEmail().equals(email)) {
                throw new RuntimeException("Anda tidak memiliki akses ke shipping ini");
            }

            return mapToShippingResponse(shipping);
        } catch (Exception e) {
            throw new RuntimeException("Gagal mengambil shipping berdasarkan order : " + e.getMessage());
        }
    }

    @Override
    public List<ShippingResponse> getAllShippings()
    {
        try {
            List<Shipping> shippings = shippingRepository.findAll();

            return shippings.stream().map(this::mapToShippingResponse).toList();
        } catch (Exception e) {
            throw new RuntimeException("Gagal mengambil semua shipping : " + e.getMessage());
        }
    }

    @Override
    public ShippingResponse shipOrder(Long id,ShipOrderRequest request)
    {
        try {
            Shipping shipping = shippingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Shipping tidak ditemukan"));

            if (shipping.getStatus() != ShippingStatus.PENDING) {
                throw new RuntimeException("Shipping bisa dikirim hanya jika statusnya PENDING");
            }

            LocalDateTime now = LocalDateTime.now();

            LocalDateTime estimatedDeliveryAt = now.plusDays(request.getDeliveryDays());
                    

                    
            shipping.setCourier(request.getCourier());
            shipping.setTrackingNumber(request.getTrackingNumber());
            shipping.setEstimatedDeliveryAt(estimatedDeliveryAt);
            shipping.setShippedAt(now);
            shipping.setStatus(ShippingStatus.SHIPPED);

            Shipping shippingSaved = shippingRepository.save(shipping);

            sendShippingShippedEmail(shippingSaved);

            return mapToShippingResponse(shippingSaved);
        } catch (Exception e) {
            throw new RuntimeException("Gagal mengirim shipping : " + e.getMessage());
        }
    }

    @Override
    public ShippingResponse confirmReceived(String email, String token, Long id)
    {
        try {
            Shipping shipping = shippingRepository.findById(id)
            .orElseThrow(()-> new RuntimeException("Shipping tidak ditemukan"));

            if (!shipping.getEmail().equals(email)) {
                throw new RuntimeException("Anda tidak memiliki akses ke shipping ini");
            }
            if (shipping.getStatus() != ShippingStatus.DELIVERED) {
                throw new RuntimeException("Barang hanya bisa dikonfirmasi jika sudah status DELIVERED");
            }

            updateOrderStatusToCompleted(shipping.getOrderId(), token);

            shipping.setStatus(ShippingStatus.RECEIVED);
            shipping.setReceivedAt(LocalDateTime.now());

            Shipping  savedShipping = shippingRepository.save(shipping);

            sendOrderCompletedEmail(savedShipping);

            return mapToShippingResponse(savedShipping);
        } catch (Exception e) {
            throw new RuntimeException("Gagal mengkonfirmasi barang diterima : " + e.getMessage());
        }
    }

    @Override
    public MessageResponse cancelShipping(Long id)
    {
        try {
            Shipping shipping = shippingRepository.findById(id)
            .orElseThrow(()-> new RuntimeException("Shipping tidak ditemukan"));

            if (shipping.getStatus() == ShippingStatus.DELIVERED) {
                throw new RuntimeException("Shipping sudah di terima, tidak bisa dibatalkan");
            }

            shipping.setStatus(ShippingStatus.CANCELLED);

            shippingRepository.save(shipping);

            return MessageResponse.builder().success(true).message("Shipping berhasil dibatalkan").build();
        } catch (Exception e) {
            throw new RuntimeException("Gagal membatalkan shipping : " + e.getMessage());
        }
    }

    private void sendShippingShippedEmail(Shipping shipping) {
        try {
            EmailClientRequest emailRequest = new EmailClientRequest(
                shipping.getEmail(),
                "Pesanan Sedang Dikirim - BaenTech Store",
                "Halo " + shipping.getRecipientName() + ",\n\n" +
                        "Pesanan kamu sedang dikirim.\n\n" +
                        "Nomor Order: " + shipping.getOrderNumber() + "\n" +
                        "Kurir: " + shipping.getCourier() + "\n" +
                        "Nomor Resi: " + shipping.getTrackingNumber() + "\n" +
                        "Estimasi Sampai: " + shipping.getEstimatedDeliveryAt() + "\n\n" +
                        "Silakan tunggu pesanan kamu sampai di alamat tujuan.\n\n" +
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
            System.out.println("Gagal mengirim email shipping shipped: " + e.getMessage());
        }
    }

    private void sendOrderCompletedEmail(Shipping shipping) {
        try {
            EmailClientRequest emailRequest = new EmailClientRequest(
                    shipping.getEmail(),
                    "Pesanan Selesai - BaenTech Store",
                    "Halo " + shipping.getRecipientName() + ",\n\n" +
                            "Terima kasih sudah melakukan konfirmasi penerimaan barang.\n\n" +
                            "Pesanan kamu telah selesai.\n\n" +
                            "Nomor Order: " + shipping.getOrderNumber() + "\n" +
                            "Kurir: " + shipping.getCourier() + "\n" +
                            "Nomor Resi: " + shipping.getTrackingNumber() + "\n\n" +
                            "Semoga produk yang kamu beli bermanfaat.\n" +
                            "Kami tunggu pesanan kamu berikutnya di BaenTech Store.\n\n" +
                            "Salam,\n" +
                            "BaenTech Store");

            webClientBuilder.build()
                    .post()
                    .uri("http://NOTIFICATION-SERVICE/api/notifications/send-email")
                    .bodyValue(emailRequest)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

        } catch (Exception e) {
            System.out.println("Gagal mengirim email order completed: " + e.getMessage());
        }
    }


    private OrderClientResponse getOrderFromOrderService(Long orderId,String token)
    {
        try {
            return webClientBuilder.build()
                  .get()
                  .uri("http://ORDER-SERVICE/api/orders/" + orderId)
                  .header("Authorization", token)
                  .retrieve()
                  .bodyToMono(OrderClientResponse.class)
                  .block();
        } catch (Exception e) {
            throw new RuntimeException("Gagal mengambil data order dari ORDER-SERVICE : " + e.getMessage());
        }
    }
    
    private void updateOrderStatusToCompleted(Long orderId, String token) {
        try {
            webClientBuilder.build()
                    .put()
                    .uri("http://ORDER-SERVICE/api/orders/" + orderId + "/complete")
                    .header("Authorization", token)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

        } catch (Exception e) {
            throw new RuntimeException("Gagal update status order menjadi COMPLETED: " + e.getMessage());
        }
    }
    private ShippingResponse mapToShippingResponse(Shipping shipping)
    {
        try {
            return ShippingResponse.builder()
                .id(shipping.getId())
                .orderId(shipping.getOrderId())
                .orderNumber(shipping.getOrderNumber())
                .email(shipping.getEmail())
                .recipientName(shipping.getRecipientName())
                .phoneNumber(shipping.getPhoneNumber())
                .shippingAddress(shipping.getShippingAddress())
                .city(shipping.getCity())
                .province(shipping.getProvince())
                .postalCode(shipping.getPostalCode())
                .courier(shipping.getCourier())
                .trackingNumber(shipping.getTrackingNumber())
                .status(shipping.getStatus())
                .shippedAt(shipping.getShippedAt())
                .estimatedDeliveryAt(shipping.getEstimatedDeliveryAt())
                .deliveredAt(shipping.getDeliveredAt())
                .receivedAt(shipping.getReceivedAt())
                .createdAt(shipping.getCreatedAt())
                .updatedAt(shipping.getUpdatedAt())
                .build();
        } catch (Exception e) {
            throw new RuntimeException("Gagal mapping Shipping : " + e.getMessage());
        }
    }
    
}
