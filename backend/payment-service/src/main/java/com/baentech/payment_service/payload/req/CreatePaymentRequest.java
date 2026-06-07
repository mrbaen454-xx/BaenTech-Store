package com.baentech.payment_service.payload.req;

import com.baentech.payment_service.entity.PaymentMethod;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreatePaymentRequest {

    @NotNull(message = "Order ID tidak boleh kosong")
    private Long orderId;

    @NotNull(message = "Metode pembayaran tidak boleh kosong")
    private PaymentMethod paymentMethod;
}