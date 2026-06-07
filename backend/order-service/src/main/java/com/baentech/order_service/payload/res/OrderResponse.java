package com.baentech.order_service.payload.res;

import com.baentech.order_service.entity.OrderStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class OrderResponse {

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

    private OrderStatus status;

    private List<OrderItemResponse> items;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}