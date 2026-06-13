package com.baentech.shipping_service.scheduler;

import com.baentech.shipping_service.entity.Shipping;
import com.baentech.shipping_service.entity.ShippingStatus;
import com.baentech.shipping_service.payload.client.EmailClientRequest;
import com.baentech.shipping_service.repository.ShippingRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ShippingScheduler {

    
    private final ShippingRepository shippingRepository;

    private final WebClient.Builder webClientBuilder;

    // Untuk testing boleh 10 detik, kalau sudah aman balikin 60000
    @Scheduled(fixedRate = 10000)
    public void updateDeliveredShipping() {
        try {
            LocalDateTime now = LocalDateTime.now();

            List<Shipping> shippings = shippingRepository
                    .findByStatusAndEstimatedDeliveryAtLessThanEqual(
                            ShippingStatus.SHIPPED,
                            now);

            if (shippings.isEmpty()) {
                return;
            }

            for (Shipping shipping : shippings) {
                shipping.setStatus(ShippingStatus.DELIVERED);
                shipping.setDeliveredAt(now);
            }

            List<Shipping> savedShippings = shippingRepository.saveAll(shippings);

            for (Shipping shipping : savedShippings) {
                sendShippingDeliveredEmail(shipping);
            }

            System.out.println("Scheduler shipping: " + savedShippings.size() + " shipping berubah menjadi DELIVERED");

        } catch (Exception e) {
            System.out.println("Scheduler shipping error: " + e.getMessage());
        }
    }

    private void sendShippingDeliveredEmail(Shipping shipping) {
        try {
            EmailClientRequest emailRequest = new EmailClientRequest(
                    shipping.getEmail(),
                    "Pesanan Sudah Sampai - BaenTech Store",
                    "Halo " + shipping.getRecipientName() + ",\n\n" +
                            "Pesanan kamu sudah sampai di alamat tujuan.\n\n" +
                            "Nomor Order: " + shipping.getOrderNumber() + "\n" +
                            "Kurir: " + shipping.getCourier() + "\n" +
                            "Nomor Resi: " + shipping.getTrackingNumber() + "\n\n" +
                            "Silakan cek barang kamu. Jika sudah diterima dengan baik, silakan konfirmasi pesanan diterima.\n\n"
                            +
                            "Terima kasih sudah berbelanja di BaenTech Store.\n\n" +
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
            System.out.println("Gagal mengirim email shipping delivered: " + e.getMessage());
        }
    }
}