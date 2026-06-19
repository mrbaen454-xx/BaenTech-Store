package com.baentech.payment_service.service.serviceImpl;

import com.baentech.payment_service.entity.Payment;
import com.baentech.payment_service.payload.client.OrderClientResponse;
import com.baentech.payment_service.payload.res.XenditInvoiceResponse;
import com.baentech.payment_service.service.XenditService;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class XenditServiceImpl implements XenditService {

    private final WebClient.Builder webClientBuilder;

    @Value("${xendit.secret-key}")
    private String secretKey;

    @Value("${xendit.invoice-url}")
    private String invoiceUrl;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public XenditInvoiceResponse createInvoice(Payment payment, OrderClientResponse order) {
        try {
            String cleanSecretKey = secretKey == null ? "" : secretKey.trim();

            if (cleanSecretKey.isBlank()) {
                throw new RuntimeException("Xendit secret key belum diisi di environment variable XENDIT_SECRET_KEY");
            }

            if (cleanSecretKey.startsWith("xnd_public")) {
                throw new RuntimeException("Xendit yang dipakai masih PUBLIC KEY. Untuk backend harus memakai SECRET KEY dari dashboard Xendit.");
            }

            String basicAuth = Base64.getEncoder()
                    .encodeToString((cleanSecretKey + ":").getBytes(StandardCharsets.UTF_8));

            Map<String, Object> body = buildInvoiceRequestBody(payment, order);

            XenditInvoiceResponse response = webClientBuilder.build()
                    .post()
                    .uri(invoiceUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Basic " + basicAuth)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(XenditInvoiceResponse.class)
                    .block();

            if (response == null || response.getInvoiceUrl() == null || response.getInvoiceUrl().isBlank()) {
                throw new RuntimeException("Response invoice Xendit tidak membawa invoice_url");
            }

            return response;

        } catch (WebClientResponseException e) {
            throw new RuntimeException("Gagal membuat invoice Xendit: " + e.getStatusCode() + " - " + e.getResponseBodyAsString());
        } catch (Exception e) {
            throw new RuntimeException("Gagal membuat invoice Xendit: " + e.getMessage());
        }
    }

    private Map<String, Object> buildInvoiceRequestBody(Payment payment, OrderClientResponse order) {
        long amount = payment.getAmount()
                .setScale(0, RoundingMode.HALF_UP)
                .longValue();

        Map<String, Object> customer = new LinkedHashMap<>();
        customer.put("given_names", order.getRecipientName());
        customer.put("email", order.getEmail());
        customer.put("mobile_number", normalizePhoneNumber(order.getPhoneNumber()));

        Map<String, Object> address = new LinkedHashMap<>();
        address.put("city", order.getCity());
        address.put("country", "Indonesia");
        address.put("postal_code", order.getPostalCode());
        address.put("state", order.getProvince());
        address.put("street_line1", order.getShippingAddress());

        customer.put("addresses", List.of(address));

        Map<String, Object> item = new LinkedHashMap<>();
        item.put("name", "Order " + order.getOrderNumber());
        item.put("quantity", 1);
        item.put("price", amount);
        item.put("category", "BaenTech Store");

        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("order_id", order.getId());
        metadata.put("order_number", order.getOrderNumber());
        metadata.put("payment_id", payment.getId());
        metadata.put("payment_number", payment.getPaymentNumber());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("external_id", payment.getGatewayOrderId());
        body.put("amount", amount);
        body.put("description", "Pembayaran BaenTech Store - " + order.getOrderNumber());
        body.put("invoice_duration", 86400);
        body.put("currency", "IDR");
        body.put("customer", customer);
        body.put("items", List.of(item));
        body.put("success_redirect_url", frontendUrl + "/payment/finish");
        body.put("failure_redirect_url", frontendUrl + "/payment/error");
        body.put("metadata", metadata);

        return body;
    }

    private String normalizePhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.isBlank()) {
            return "+6280000000000";
        }

        String phone = phoneNumber.trim();

        if (phone.startsWith("+")) {
            return phone;
        }

        if (phone.startsWith("0")) {
            return "+62" + phone.substring(1);
        }

        if (phone.startsWith("62")) {
            return "+" + phone;
        }

        return phone;
    }
}
