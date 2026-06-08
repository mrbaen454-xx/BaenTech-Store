package com.baentech.order_service.payload.client;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReduceStockClientRequest {
    private List<ProductStockItemClientRequest> items;
}
