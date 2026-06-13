package com.baentech.report_service.payload.res;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class OrderReportResponse {

    private Long orderId;

    private String orderNumber;

    private String email;

    private String recipientName;

    private String city;

    private String province;

    private BigDecimal totalPrice;

    private String status;

    private LocalDateTime createdAt;
}