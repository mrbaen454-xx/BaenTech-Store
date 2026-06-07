package com.baentech.cart_service.payload.client;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ProductClientResponse {

    private Long id;

    private String name;

    private String description;

    private String brand;

    private String imageUrl;

    private BigDecimal price;

    private Integer stock;

    private String warranty;

    private String status;

    private Long categoryId;

    private String categoryName;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}