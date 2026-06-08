package com.baentech.product_service.payload.req;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Data
public class ReduceStockRequest {
    
    @Valid
    @NotEmpty(message = "Item stok tidak boleh kosong")
    private List<StockItemRequest> items;
}
