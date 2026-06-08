package com.baentech.product_service.payload.req;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StockItemRequest {
    
    @NotNull(message = "Product ID tidak boleh kosong")
    private Long productId;

    @NotNull(message = "Stock tidak boleh kosong")
    @Min(value = 1, message = "Quantity minimal 1")
    private Integer quantity;
}
