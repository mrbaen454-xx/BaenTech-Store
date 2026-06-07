package com.baentech.order_service.payload.req;

import com.baentech.order_service.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateOrderStatusRequest {

    @NotNull(message = "Status order tidak boleh kosong")
    private OrderStatus status;
}