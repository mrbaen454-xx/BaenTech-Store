package com.baentech.report_service.payload.client;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ShippingClientResponse {

    private Long id;

    private Long orderId;

    private String orderNumber;

    private String email;

    private String recipientName;

    private String phoneNumber;

    private String shippingAddress;

    private String city;

    private String province;

    private String postalCode;

    private String courier;

    private String trackingNumber;

    private String status;

    private LocalDateTime shippedAt;

    private LocalDateTime estimatedDeliveryAt;

    private LocalDateTime deliveredAt;

    private LocalDateTime receivedAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}