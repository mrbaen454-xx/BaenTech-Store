package com.baentech.cart_service.payload.res;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class CartResponse {

    private Long id;

    private String email;

    private BigDecimal totalPrice;

    private Integer totalItems;

    private List<CartItemResponse> items;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}