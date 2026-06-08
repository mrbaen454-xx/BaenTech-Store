package com.baentech.order_service.payload.client;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProductStockItemClientRequest {
    
    private Long productId;
    private Integer quantity;
}
