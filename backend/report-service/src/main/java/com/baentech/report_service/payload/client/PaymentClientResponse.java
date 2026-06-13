package com.baentech.report_service.payload.client;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class PaymentClientResponse {

    private Long id;

    private Long orderId;

    private String paymentNumber;

    private String email;

    private BigDecimal amount;

    private String paymentMethod;

    private String status;

    private LocalDateTime paidAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}