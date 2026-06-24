package com.baentech.shipping_service.service.serviceImpl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

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

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ShippingServiceImpl implements ShippingService {
    private final ShippingRepository shippingRepository;

    private final WebClient.Builder webClientBuilder;

    @Override
    @Transactional
    public ShippingResponse createShipping(String token, CreateShippingRequest request) {
        try {
            if (shippingRepository.existsByOrderId(request.getOrderId())) {
                throw new RuntimeException("Shipping order id " + request.getOrderId() + " sudah ada");
            }

            OrderClientResponse order = getOrderFromOrderService(request.getOrderId(), token);

            if (order == null) {
                throw new RuntimeException("Order tidak ditemukan");
            }

            if (!"PAID".equalsIgnoreCase(order.getStatus())) {
                throw new RuntimeException("Shipping hanya bisa dibuat untuk order yang sudah PAID");
            }

            String courier = resolveRequiredText(
                    "Kurir tidak boleh kosong",
                    request.getCourier(),
                    request.getCourierName()
            );

            String trackingNumber = resolveRequiredText(
                    "Nomor resi tidak boleh kosong",
                    request.getTrackingNumber(),
                    request.getResiNumber(),
                    request.getReceiptNumber()
            );

            LocalDateTime now = LocalDateTime.now();
            Integer deliveryDays = resolveDeliveryDays(request);

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
                    .courier(courier)
                    .trackingNumber(trackingNumber)
                    .status(ShippingStatus.SHIPPED)
                    .shippedAt(now)
                    .estimatedDeliveryAt(now.plusDays(deliveryDays))
                    .build();

            Shipping shippingSaved = shippingRepository.save(shipping);

            updateOrderStatusToShipped(shippingSaved.getOrderId(), token);
            sendShippingShippedEmail(shippingSaved);

            return mapToShippingResponse(shippingSaved);

        } catch (Exception e) {
            throw new RuntimeException("Gagal membuat shipping : " + e.getMessage());
        }
    }

    @Override
    public List<ShippingResponse> getMyShippings(String email) {
        try {
            List<Shipping> shippings = shippingRepository.findByEmailOrderByCreatedAtDesc(email);

            return shippings.stream().map(this::mapToShippingResponse).toList();
        } catch (Exception e) {
            throw new RuntimeException("Gagal mengambil shipping user : " + e.getMessage());
        }
    }

    @Override
    public ShippingResponse getShippingById(String email, Long id) {
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
    public ShippingResponse getShippingByOrderId(String email, Long orderId) {
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
    public List<ShippingResponse> getAllShippings() {
        try {
            List<Shipping> shippings = shippingRepository.findAll();

            return shippings.stream().map(this::mapToShippingResponse).toList();
        } catch (Exception e) {
            throw new RuntimeException("Gagal mengambil semua shipping : " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public ShippingResponse shipOrder(String token, Long id, ShipOrderRequest request) {
        try {
            Shipping shipping = shippingRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Shipping tidak ditemukan"));

            if (shipping.getStatus() == ShippingStatus.CANCELLED) {
                throw new RuntimeException("Shipping sudah dibatalkan");
            }

            if (shipping.getStatus() == ShippingStatus.RECEIVED || shipping.getStatus() == ShippingStatus.DELIVERED) {
                throw new RuntimeException("Shipping sudah selesai dan tidak bisa dikirim ulang");
            }

            LocalDateTime now = LocalDateTime.now();
            Integer deliveryDays = request.getDeliveryDays() != null ? request.getDeliveryDays() : 1;

            shipping.setCourier(request.getCourier());
            shipping.setTrackingNumber(request.getTrackingNumber());
            shipping.setEstimatedDeliveryAt(now.plusDays(deliveryDays));
            shipping.setShippedAt(now);
            shipping.setStatus(ShippingStatus.SHIPPED);

            Shipping shippingSaved = shippingRepository.save(shipping);

            updateOrderStatusToShipped(shippingSaved.getOrderId(), token);
            sendShippingShippedEmail(shippingSaved);

            return mapToShippingResponse(shippingSaved);
        } catch (Exception e) {
            throw new RuntimeException("Gagal mengirim shipping : " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public ShippingResponse markShippingShipped(String token, Long id) {
        try {
            Shipping shipping = shippingRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Shipping tidak ditemukan"));

            if (shipping.getStatus() == ShippingStatus.CANCELLED) {
                throw new RuntimeException("Shipping sudah dibatalkan");
            }

            if (shipping.getStatus() == ShippingStatus.RECEIVED || shipping.getStatus() == ShippingStatus.DELIVERED) {
                throw new RuntimeException("Shipping sudah selesai dan tidak bisa dikirim ulang");
            }

            boolean alreadyShipped = shipping.getStatus() == ShippingStatus.SHIPPED;

            if (!alreadyShipped) {
                LocalDateTime now = LocalDateTime.now();

                shipping.setStatus(ShippingStatus.SHIPPED);
                shipping.setShippedAt(now);

                if (shipping.getEstimatedDeliveryAt() == null) {
                    shipping.setEstimatedDeliveryAt(now.plusDays(1));
                }
            }

            Shipping shippingSaved = shippingRepository.save(shipping);

            updateOrderStatusToShipped(shippingSaved.getOrderId(), token);

            if (!alreadyShipped) {
                sendShippingShippedEmail(shippingSaved);
            }

            return mapToShippingResponse(shippingSaved);
        } catch (Exception e) {
            throw new RuntimeException("Gagal mengubah shipping menjadi SHIPPED : " + e.getMessage());
        }
    }

    @Override
    public ShippingResponse markShippingDelivered(Long id) {
        try {
            Shipping shipping = shippingRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Shipping tidak ditemukan"));

            if (shipping.getStatus() != ShippingStatus.SHIPPED && shipping.getStatus() != ShippingStatus.DELIVERED) {
                throw new RuntimeException("Shipping hanya bisa DELIVERED jika statusnya SHIPPED");
            }

            if (shipping.getStatus() != ShippingStatus.DELIVERED) {
                shipping.setStatus(ShippingStatus.DELIVERED);
                shipping.setDeliveredAt(LocalDateTime.now());
            }

            Shipping shippingSaved = shippingRepository.save(shipping);

            return mapToShippingResponse(shippingSaved);
        } catch (Exception e) {
            throw new RuntimeException("Gagal mengubah shipping menjadi DELIVERED : " + e.getMessage());
        }
    }

    @Override
    public ShippingResponse updateShippingStatus(String token, Long id, ShippingStatus status) {
        if (status == null) {
            throw new RuntimeException("Status shipping tidak boleh kosong");
        }

        return switch (status) {
            case SHIPPED -> markShippingShipped(token, id);
            case DELIVERED -> markShippingDelivered(id);
            case CANCELLED -> {
                cancelShipping(id);
                Shipping shipping = shippingRepository.findById(id)
                        .orElseThrow(() -> new RuntimeException("Shipping tidak ditemukan"));
                yield mapToShippingResponse(shipping);
            }
            case PENDING -> throw new RuntimeException("Alur baru tidak memakai status PENDING. Shipping langsung SHIPPED saat dibuat.");
            case RECEIVED -> throw new RuntimeException("Status RECEIVED hanya boleh dari konfirmasi user.");
        };
    }

    @Override
    public ShippingResponse confirmReceived(String email, String token, Long id) {
        try {
            Shipping shipping = shippingRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Shipping tidak ditemukan"));

            if (!shipping.getEmail().equals(email)) {
                throw new RuntimeException("Anda tidak memiliki akses ke shipping ini");
            }

            if (shipping.getStatus() != ShippingStatus.SHIPPED && shipping.getStatus() != ShippingStatus.DELIVERED) {
                throw new RuntimeException("Barang hanya bisa dikonfirmasi jika shipping sudah SHIPPED");
            }

            updateOrderStatusToCompleted(shipping.getOrderId(), token);

            shipping.setStatus(ShippingStatus.RECEIVED);
            shipping.setReceivedAt(LocalDateTime.now());

            Shipping savedShipping = shippingRepository.save(shipping);

            sendOrderCompletedEmail(savedShipping);

            return mapToShippingResponse(savedShipping);
        } catch (Exception e) {
            throw new RuntimeException("Gagal mengkonfirmasi barang diterima : " + e.getMessage());
        }
    }

    @Override
    public MessageResponse cancelShipping(Long id) {
        try {
            Shipping shipping = shippingRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Shipping tidak ditemukan"));

            if (shipping.getStatus() == ShippingStatus.DELIVERED || shipping.getStatus() == ShippingStatus.RECEIVED) {
                throw new RuntimeException("Shipping sudah diterima, tidak bisa dibatalkan");
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

    private OrderClientResponse getOrderFromOrderService(Long orderId, String token) {
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

    private void updateOrderStatusToShipped(Long orderId, String token) {
        try {
            if (token == null || token.isBlank()) {
                throw new RuntimeException("Token admin tidak ditemukan");
            }

            webClientBuilder.build()
                    .put()
                    .uri("http://ORDER-SERVICE/api/orders/" + orderId + "/status")
                    .header("Authorization", token)
                    .bodyValue(Map.of("status", "SHIPPED"))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

        } catch (Exception e) {
            throw new RuntimeException("Gagal update status order menjadi SHIPPED: " + e.getMessage());
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

    private ShippingResponse mapToShippingResponse(Shipping shipping) {
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

    private Integer resolveDeliveryDays(CreateShippingRequest request) {
        if (request.getEstimatedDays() != null) {
            return request.getEstimatedDays();
        }

        if (request.getEstimatedDeliveryDays() != null) {
            return request.getEstimatedDeliveryDays();
        }

        return 1;
    }

    private String resolveRequiredText(String message, String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }

        throw new RuntimeException(message);
    }
}
