package com.baentech.shipping_service.payload.req;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateShippingRequest {

    @NotNull(message = "Order ID tidak boleh kosong")
    private Long orderId;

    private String courier;

    private String courierName;

    private String trackingNumber;

    private String resiNumber;

    private String receiptNumber;

    @Min(value = 0, message = "Lama pengiriman minimal 0 hari")
    private Integer estimatedDays;

    @Min(value = 0, message = "Lama pengiriman minimal 0 hari")
    private Integer estimatedDeliveryDays;
}
