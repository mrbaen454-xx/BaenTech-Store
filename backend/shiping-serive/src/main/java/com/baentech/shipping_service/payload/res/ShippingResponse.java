package com.baentech.shipping_service.payload.res;

import com.baentech.shipping_service.entity.ShippingStatus;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ShippingResponse {

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

    private ShippingStatus status;

    private LocalDateTime shippedAt;

    private LocalDateTime estimatedDeliveryAt;

    private LocalDateTime deliveredAt;

    private LocalDateTime receivedAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}