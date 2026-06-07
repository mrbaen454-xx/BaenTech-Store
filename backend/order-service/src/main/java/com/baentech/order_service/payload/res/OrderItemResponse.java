package com.baentech.order_service.payload.res;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class OrderItemResponse {

    private Long id;

    private Long productId;

    private String productName;

    private String productBrand;

    private String productImageUrl;

    private BigDecimal price;

    private Integer quantity;

    private BigDecimal subTotal;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}