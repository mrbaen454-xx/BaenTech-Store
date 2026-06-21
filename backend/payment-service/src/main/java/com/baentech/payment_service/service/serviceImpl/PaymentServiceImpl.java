package com.baentech.payment_service.service.serviceImpl;

import com.baentech.payment_service.entity.Payment;
import com.baentech.payment_service.entity.PaymentStatus;
import com.baentech.payment_service.payload.client.EmailClientRequest;
import com.baentech.payment_service.payload.client.OrderClientResponse;
import com.baentech.payment_service.payload.req.CreatePaymentRequest;
import com.baentech.payment_service.payload.req.UpdateOrderStatusClientRequest;
import com.baentech.payment_service.payload.req.XenditInvoiceCallbackRequest;
import com.baentech.payment_service.payload.res.MessageResponse;
import com.baentech.payment_service.payload.res.PaymentResponse;
import com.baentech.payment_service.payload.res.XenditInvoiceResponse;
import com.baentech.payment_service.repository.PaymentRepository;
import com.baentech.payment_service.service.PaymentService;
import com.baentech.payment_service.service.XenditService;

import jakarta.transaction.Transactional;
import tools.jackson.databind.ObjectMapper;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Service
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final XenditService xenditService;
    private final WebClient.Builder loadBalancedWebClientBuilder;

    public PaymentServiceImpl(
            PaymentRepository paymentRepository,
            @Qualifier("loadBalancedWebClientBuilder") WebClient.Builder loadBalancedWebClientBuilder,
            XenditService xenditService
    ) {
        this.paymentRepository = paymentRepository;
        this.loadBalancedWebClientBuilder = loadBalancedWebClientBuilder;
        this.xenditService = xenditService;
    }

    @Value("${xendit.callback-token}")
    private String xenditCallbackToken;

    @Value("${order.service.url:http://localhost:8085}")
    private String orderServiceUrl;

    @Value("${internal.api-key}")
    private String internalApiKey;

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
                    .map(this::syncPaymentWithXenditIfPossible)
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

            payment = syncPaymentWithXenditIfPossible(payment);

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

            payment = syncPaymentWithXenditIfPossible(payment);

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

            sendPaymentSuccessEmail(payment);

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

            if (payment.getStatus() == PaymentStatus.SUCCESS) {
                throw new RuntimeException("Payment sudah berhasil, tidak bisa digagalkan");
            }
            if (payment.getStatus() == PaymentStatus.CANCELLED
                    || payment.getStatus() == PaymentStatus.EXPIRED) {
                throw new RuntimeException("Payment sudah tidak bisa diproses");
            }

            payment.setStatus(PaymentStatus.FAILED);

            Payment savedPayment = paymentRepository.save(payment);

            sendPaymentFailedEmail(payment);

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

    @Override
    @Transactional
    public PaymentResponse createXenditPayment(
            String email,
            String token,
            CreatePaymentRequest request
    ) {
        try {
            if (paymentRepository.existsByOrderId(request.getOrderId())) {
                Payment existingPayment = paymentRepository.findByOrderId(request.getOrderId())
                        .orElseThrow(() -> new RuntimeException("Payment tidak ditemukan"));

                existingPayment = syncPaymentWithXenditIfPossible(existingPayment);

                if (existingPayment.getRedirectUrl() != null) {
                    return mapToPaymentResponse(existingPayment);
                }
            }

            OrderClientResponse order = getOrderFromOrderService(token, request.getOrderId());

            if (!String.valueOf(order.getEmail()).equalsIgnoreCase(email)) {
                throw new RuntimeException("Order ini bukan milik user yang sedang login");
            }

            Payment payment = Payment.builder()
                    .orderId(order.getId())
                    .orderNumber(order.getOrderNumber())
                    .email(email)
                    .paymentNumber(generatePaymentNumber())
                    .amount(order.getTotalPrice())
                    .paymentMethod(request.getPaymentMethod())
                    .status(PaymentStatus.PENDING)
                    .gateway("XENDIT")
                    .gatewayOrderId("BT-" + order.getOrderNumber() + "-" + System.currentTimeMillis())
                    .transactionStatus("PENDING")
                    .build();

            Payment savedPayment = paymentRepository.save(payment);

            XenditInvoiceResponse invoice = xenditService.createInvoice(savedPayment, order);

            savedPayment.setGatewayInvoiceId(invoice.getId());
            savedPayment.setRedirectUrl(invoice.getInvoiceUrl());
            savedPayment.setTransactionStatus(invoice.getStatus());

            Payment finalPayment = paymentRepository.save(savedPayment);

            return mapToPaymentResponse(finalPayment);

        } catch (Exception e) {
            throw new RuntimeException("Gagal membuat payment Xendit: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public PaymentResponse handleXenditCallback(
            String callbackToken,
            XenditInvoiceCallbackRequest request
    ) {
        try {
            if (callbackToken == null || !callbackToken.equals(xenditCallbackToken)) {
                throw new RuntimeException("Callback token Xendit tidak valid");
            }

            Payment payment = paymentRepository.findByGatewayOrderId(request.getExternalId())
                    .orElseThrow(() -> new RuntimeException("Payment Xendit tidak ditemukan"));

            payment.setGatewayInvoiceId(request.getId());
            payment.setTransactionStatus(request.getStatus());
            payment.setPaymentType(request.getPaymentMethod());
            payment.setPaymentChannel(request.getPaymentChannel());
            payment.setPaymentDestination(request.getPaymentDestination());
            payment.setRawNotification(new ObjectMapper().writeValueAsString(request));

            applyXenditStatus(payment, request.getStatus(), request.getPaidAt());

            Payment savedPayment = paymentRepository.save(payment);

            return mapToPaymentResponse(savedPayment);

        } catch (Exception e) {
            throw new RuntimeException("Gagal memproses callback Xendit: " + e.getMessage());
        }
    }

    private Payment syncPaymentWithXenditIfPossible(Payment payment) {
        try {
            if (payment == null) {
                return null;
            }

            if (!"XENDIT".equalsIgnoreCase(String.valueOf(payment.getGateway()))) {
                return payment;
            }

            if (payment.getGatewayInvoiceId() == null || payment.getGatewayInvoiceId().isBlank()) {
                return payment;
            }

            if (payment.getStatus() == PaymentStatus.SUCCESS
                    || payment.getStatus() == PaymentStatus.CANCELLED
                    || payment.getStatus() == PaymentStatus.EXPIRED) {
                return payment;
            }

            XenditInvoiceResponse invoice = xenditService.getInvoice(payment.getGatewayInvoiceId());

            payment.setTransactionStatus(invoice.getStatus());
            payment.setPaymentType(invoice.getPaymentMethod());
            payment.setPaymentChannel(invoice.getPaymentChannel());
            payment.setPaymentDestination(invoice.getPaymentDestination());

            applyXenditStatus(payment, invoice.getStatus(), invoice.getPaidAt());

            return paymentRepository.save(payment);

        } catch (Exception e) {
            System.out.println("Gagal sync status payment dari Xendit: " + e.getMessage());
            return payment;
        }
    }

    private void applyXenditStatus(Payment payment, String rawStatus, String paidAt) {
        String status = String.valueOf(rawStatus).toUpperCase();

        if ("PAID".equals(status) || "SETTLED".equals(status)) {
            boolean wasNotSuccess = payment.getStatus() != PaymentStatus.SUCCESS;

            payment.setStatus(PaymentStatus.SUCCESS);
            if (payment.getPaidAt() == null) {
                payment.setPaidAt(LocalDateTime.now());
            }

            if (wasNotSuccess) {
                updateOrderToPaid(payment.getOrderId());
                sendPaymentSuccessEmail(payment);
            }

        } else if ("PENDING".equals(status)) {
            payment.setStatus(PaymentStatus.PENDING);

        } else if ("EXPIRED".equals(status)) {
            payment.setStatus(PaymentStatus.EXPIRED);

        } else {
            payment.setStatus(PaymentStatus.FAILED);
        }
    }

    private OrderClientResponse getOrderFromOrderService(String token, Long orderId) {
        try {
            return loadBalancedWebClientBuilder.build()
                    .get()
                    .uri(orderServiceUrl + "/api/orders/" + orderId)
                    .header("Authorization", token)
                    .retrieve()
                    .bodyToMono(OrderClientResponse.class)
                    .block();

        } catch (Exception e) {
            throw new RuntimeException("Gagal mengambil data order-service: " + e.getMessage());
        }
    }

    private void updateOrderToPaid(Long orderId) {
        try {
            loadBalancedWebClientBuilder.build()
                    .put()
                    .uri(orderServiceUrl + "/api/orders/internal/" + orderId + "/paid")
                    .header("X-Internal-Token", internalApiKey)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

        } catch (Exception e) {
            throw new RuntimeException("Gagal update order menjadi PAID: " + e.getMessage());
        }
    }

    private void sendPaymentSuccessEmail(Payment payment) {
        try {
            EmailClientRequest emailRequest = new EmailClientRequest(
                    payment.getEmail(),
                    "Pembayaran Berhasil - BaenTech Store",
                    "Halo,\n\n" +
                            "Pembayaran kamu berhasil diproses.\n\n" +
                            "Nomor Payment: " + payment.getPaymentNumber() + "\n" +
                            "Order ID: " + payment.getOrderId() + "\n" +
                            "Metode Pembayaran: " + payment.getPaymentMethod() + "\n" +
                            "Total Pembayaran: Rp " + payment.getAmount() + "\n\n" +
                            "Pesanan kamu akan segera diproses.\n\n" +
                            "Salam,\n" +
                            "BaenTech Store"
            );

            loadBalancedWebClientBuilder.build()
                    .post()
                    .uri("http://NOTIFICATION-SERVICE/api/notifications/send-email")
                    .bodyValue(emailRequest)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

        } catch (Exception e) {
            System.out.println("Gagal mengirim email payment success: " + e.getMessage());
        }
    }

    private void sendPaymentFailedEmail(Payment payment) {
        try {
            EmailClientRequest emailRequest = new EmailClientRequest(
                    payment.getEmail(),
                    "Pembayaran Gagal - BaenTech Store",
                    "Halo,\n\n" +
                            "Pembayaran kamu gagal diproses.\n\n" +
                            "Nomor Payment: " + payment.getPaymentNumber() + "\n" +
                            "Order ID: " + payment.getOrderId() + "\n" +
                            "Metode Pembayaran: " + payment.getPaymentMethod() + "\n" +
                            "Total Pembayaran: Rp " + payment.getAmount() + "\n\n" +
                            "Silakan coba lakukan pembayaran kembali.\n\n" +
                            "Salam,\n" +
                            "BaenTech Store"
            );

            loadBalancedWebClientBuilder.build()
                    .post()
                    .uri("http://NOTIFICATION-SERVICE/api/notifications/send-email")
                    .bodyValue(emailRequest)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

        } catch (Exception e) {
            System.out.println("Gagal mengirim email payment failed: " + e.getMessage());
        }
    }

    private OrderClientResponse getOrderFromOrderService(Long orderId, String token) {
        try {
            return loadBalancedWebClientBuilder.build()
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

            loadBalancedWebClientBuilder.build()
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
                    .gateway(payment.getGateway())
                    .gatewayOrderId(payment.getGatewayOrderId())
                    .gatewayInvoiceId(payment.getGatewayInvoiceId())
                    .redirectUrl(payment.getRedirectUrl())
                    .transactionStatus(payment.getTransactionStatus())
                    .paymentType(payment.getPaymentType())
                    .paymentChannel(payment.getPaymentChannel())
                    .paymentDestination(payment.getPaymentDestination())
                    .paidAt(payment.getPaidAt())
                    .createdAt(payment.getCreatedAt())
                    .updatedAt(payment.getUpdatedAt())
                    .build();

        } catch (Exception e) {
            throw new RuntimeException("Gagal mapping payment: " + e.getMessage());
        }
    }
}
