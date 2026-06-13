package com.baentech.report_service.payload.res;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class PaymentReportResponse {

    private Long paymentId;

    private Long orderId;

    private String paymentNumber;

    private String email;

    private BigDecimal amount;

    private String paymentMethod;

    private String status;

    private LocalDateTime paidAt;

    private LocalDateTime createdAt;
}