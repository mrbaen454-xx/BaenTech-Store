package com.baentech.report_service.payload.client;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class OrderClientResponse {

    private Long id;

    private String orderNumber;

    private String email;

    private String recipientName;

    private String phoneNumber;

    private String shippingAddress;

    private String city;

    private String province;

    private String postalCode;

    private BigDecimal totalPrice;

    private String status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}