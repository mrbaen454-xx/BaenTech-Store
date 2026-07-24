package com.baentech.order_service.payload.client;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProductClientResponse {
    private Long id;
    private String name;
    private String brand;
    private String imageUrl;
    private BigDecimal price;
    private Integer stock;
    private String status;
}
