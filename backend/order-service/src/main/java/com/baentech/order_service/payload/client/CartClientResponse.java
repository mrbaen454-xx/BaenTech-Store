package com.baentech.order_service.payload.client;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class CartClientResponse {

    private Long id;

    private String email;

    private BigDecimal totalPrice;

    private Integer totalItems;

    private List<CartItemClientResponse> items;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}