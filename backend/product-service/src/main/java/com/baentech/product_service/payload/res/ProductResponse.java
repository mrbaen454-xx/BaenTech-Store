package com.baentech.product_service.payload.res;

import com.baentech.product_service.entity.ProductStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class ProductResponse {

    private Long id;
    private String name;
    private String description;
    private String brand;
    private String imageUrl;
    private BigDecimal price;
    private Integer stock;
    private String warranty;
    private ProductStatus status;

    private Long categoryId;
    private String categoryName;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}