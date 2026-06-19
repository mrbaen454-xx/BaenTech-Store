package com.baentech.payment_service.payload.res;

import com.baentech.payment_service.entity.PaymentMethod;
import com.baentech.payment_service.entity.PaymentStatus;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class PaymentResponse {

    private Long id;

    private Long orderId;

    private String orderNumber;

    private String email;

    private String paymentNumber;

    private BigDecimal amount;

    private PaymentMethod paymentMethod;

    private PaymentStatus status;


    private String gateway;
    private String gatewayOrderId;
    private String gatewayInvoiceId;
    private String redirectUrl;
    private String transactionStatus;
    private String paymentType;
    private String paymentChannel;
    private String paymentDestination;



    private LocalDateTime paidAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}