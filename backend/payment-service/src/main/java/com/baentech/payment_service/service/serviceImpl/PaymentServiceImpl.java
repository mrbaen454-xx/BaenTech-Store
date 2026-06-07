package com.baentech.payment_service.service.serviceImpl;

import com.baentech.payment_service.entity.Payment;
import com.baentech.payment_service.entity.PaymentStatus;
import com.baentech.payment_service.payload.client.OrderClientResponse;
import com.baentech.payment_service.payload.req.CreatePaymentRequest;
import com.baentech.payment_service.payload.req.UpdateOrderStatusClientRequest;
import com.baentech.payment_service.payload.res.MessageResponse;
import com.baentech.payment_service.payload.res.PaymentResponse;
import com.baentech.payment_service.repository.PaymentRepository;
import com.baentech.payment_service.service.PaymentService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Service
public class PaymentServiceImpl implements PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private WebClient.Builder webClientBuilder;

    @Override
    public PaymentResponse createPayment(String email, String token, CreatePaymentRequest request) {
        try {
            if (paymentRepository.existsByOrderId(request.getOrderId())) {
                throw new RuntimeException("Payment untuk order ini sudah dibuat");
            }

            OrderClientResponse order = getOrderFromOrderService(request.getOrderId(), token);

            if (order == null) {
                throw new RuntimeException("Order tidak ditemukan");
            }

            if (!order.getEmail().equals(email)) {
                throw new RuntimeException("Anda tidak memiliki akses ke order ini");
            }

            if (!"PENDING_PAYMENT".equalsIgnoreCase(order.getStatus())) {
                throw new RuntimeException("Order tidak dalam status PENDING_PAYMENT");
            }

            Payment payment = Payment.builder()
                    .orderId(order.getId())
                    .orderNumber(order.getOrderNumber())
                    .email(email)
                    .paymentNumber(generatePaymentNumber())
                    .amount(order.getTotalPrice())
                    .paymentMethod(request.getPaymentMethod())
                    .status(PaymentStatus.PENDING)
                    .build();

            Payment savedPayment = paymentRepository.save(payment);

            return mapToPaymentResponse(savedPayment);

        } catch (Exception e) {
            throw new RuntimeException("Gagal membuat payment: " + e.getMessage());
        }
    }

    @Override
    public List<PaymentResponse> getMyPayments(String email) {
        try {
            List<Payment> payments = paymentRepository.findByEmailOrderByCreatedAtDesc(email);

            return payments.stream()
                    .map(this::mapToPaymentResponse)
                    .toList();

        } catch (Exception e) {
            throw new RuntimeException("Gagal mengambil payment user: " + e.getMessage());
        }
    }

    @Override
    public PaymentResponse getPaymentById(String email, Long id) {
        try {
            Payment payment = paymentRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Payment tidak ditemukan"));

            if (!payment.getEmail().equals(email)) {
                throw new RuntimeException("Anda tidak memiliki akses ke payment ini");
            }

            return mapToPaymentResponse(payment);

        } catch (Exception e) {
            throw new RuntimeException("Gagal mengambil detail payment: " + e.getMessage());
        }
    }

    @Override
    public PaymentResponse getPaymentByOrderId(String email, Long orderId) {
        try {
            Payment payment = paymentRepository.findByOrderId(orderId)
                    .orElseThrow(() -> new RuntimeException("Payment untuk order ini tidak ditemukan"));

            if (!payment.getEmail().equals(email)) {
                throw new RuntimeException("Anda tidak memiliki akses ke payment ini");
            }

            return mapToPaymentResponse(payment);

        } catch (Exception e) {
            throw new RuntimeException("Gagal mengambil payment berdasarkan order: " + e.getMessage());
        }
    }

    @Override
    public List<PaymentResponse> getAllPayments() {
        try {
            List<Payment> payments = paymentRepository.findAll();

            return payments.stream()
                    .map(this::mapToPaymentResponse)
                    .toList();

        } catch (Exception e) {
            throw new RuntimeException("Gagal mengambil semua payment: " + e.getMessage());
        }
    }

    @Override
    public PaymentResponse paymentSuccess(String token, Long id) {
        try {
            Payment payment = paymentRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Payment tidak ditemukan"));

            if (payment.getStatus() == PaymentStatus.SUCCESS) {
                throw new RuntimeException("Payment sudah berhasil sebelumnya");
            }

            if (payment.getStatus() == PaymentStatus.CANCELLED
                    || payment.getStatus() == PaymentStatus.EXPIRED) {
                throw new RuntimeException("Payment sudah tidak bisa diproses");
            }

            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setPaidAt(LocalDateTime.now());

            Payment savedPayment = paymentRepository.save(payment);

            updateOrderStatusToPaid(payment.getOrderId(), token);

            return mapToPaymentResponse(savedPayment);

        } catch (Exception e) {
            throw new RuntimeException("Gagal memproses payment success: " + e.getMessage());
        }
    }

    @Override
    public PaymentResponse paymentFailed(String email, Long id) {
        try {
            Payment payment = paymentRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Payment tidak ditemukan"));

            if (!payment.getEmail().equals(email)) {
                throw new RuntimeException("Anda tidak memiliki akses ke payment ini");
            }

            if (payment.getStatus() == PaymentStatus.SUCCESS) {
                throw new RuntimeException("Payment sudah berhasil, tidak bisa digagalkan");
            }

            payment.setStatus(PaymentStatus.FAILED);

            Payment savedPayment = paymentRepository.save(payment);

            return mapToPaymentResponse(savedPayment);

        } catch (Exception e) {
            throw new RuntimeException("Gagal memproses payment failed: " + e.getMessage());
        }
    }

    @Override
    public MessageResponse cancelPayment(String email, Long id) {
        try {
            Payment payment = paymentRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Payment tidak ditemukan"));

            if (!payment.getEmail().equals(email)) {
                throw new RuntimeException("Anda tidak memiliki akses ke payment ini");
            }

            if (payment.getStatus() == PaymentStatus.SUCCESS) {
                throw new RuntimeException("Payment sudah berhasil, tidak bisa dibatalkan");
            }

            payment.setStatus(PaymentStatus.CANCELLED);

            paymentRepository.save(payment);

            return MessageResponse.builder()
                    .success(true)
                    .message("Payment berhasil dibatalkan")
                    .build();

        } catch (Exception e) {
            throw new RuntimeException("Gagal membatalkan payment: " + e.getMessage());
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
            throw new RuntimeException("Gagal mengambil order dari order-service: " + e.getMessage());
        }
    }

    private void updateOrderStatusToPaid(Long orderId, String token) {
        try {
            UpdateOrderStatusClientRequest request = new UpdateOrderStatusClientRequest("PAID");

            webClientBuilder.build()
                    .put()
                    .uri("http://ORDER-SERVICE/api/orders/" + orderId + "/status")
                    .header("Authorization", token)
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

        } catch (Exception e) {
            throw new RuntimeException("Gagal update status order menjadi PAID: " + e.getMessage());
        }
    }

    private String generatePaymentNumber() {
        try {
            String date = LocalDate.now().toString().replace("-", "");
            int randomNumber = new Random().nextInt(9000) + 1000;

            String paymentNumber = "PAY-" + date + "-" + randomNumber;

            while (paymentRepository.existsByPaymentNumber(paymentNumber)) {
                randomNumber = new Random().nextInt(9000) + 1000;
                paymentNumber = "PAY-" + date + "-" + randomNumber;
            }

            return paymentNumber;

        } catch (Exception e) {
            throw new RuntimeException("Gagal membuat nomor payment: " + e.getMessage());
        }
    }

    private PaymentResponse mapToPaymentResponse(Payment payment) {
        try {
            return PaymentResponse.builder()
                    .id(payment.getId())
                    .orderId(payment.getOrderId())
                    .orderNumber(payment.getOrderNumber())
                    .email(payment.getEmail())
                    .paymentNumber(payment.getPaymentNumber())
                    .amount(payment.getAmount())
                    .paymentMethod(payment.getPaymentMethod())
                    .status(payment.getStatus())
                    .paidAt(payment.getPaidAt())
                    .createdAt(payment.getCreatedAt())
                    .updatedAt(payment.getUpdatedAt())
                    .build();

        } catch (Exception e) {
            throw new RuntimeException("Gagal mapping payment: " + e.getMessage());
        }
    }
}