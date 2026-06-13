package com.baentech.shipping_service.payload.req;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateShippingRequest {

    @NotNull(message = "Order ID tidak boleh kosong")
    private Long orderId;
}