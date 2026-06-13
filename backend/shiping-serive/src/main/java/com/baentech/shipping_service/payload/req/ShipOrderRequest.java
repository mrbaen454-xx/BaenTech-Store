package com.baentech.shipping_service.payload.req;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ShipOrderRequest {

    @NotBlank(message = "Kurir tidak boleh kosong")
    private String courier;

    @NotBlank(message = "Nomor resi tidak boleh kosong")
    private String trackingNumber;

    @NotNull(message = "Lama pengiriman tidak boleh kosong")
    @Min(value = 0, message = "Lama pengiriman minimal 1 hari")
    private Integer deliveryDays;
}