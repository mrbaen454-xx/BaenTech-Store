package com.baentech.order_service.payload.req;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CheckoutRequest {

    @NotBlank(message = "Nama penerima tidak boleh kosong")
    private String recipientName;

    @NotBlank(message = "Nomor HP tidak boleh kosong")
    private String phoneNumber;

    @NotBlank(message = "Alamat pengiriman tidak boleh kosong")
    private String shippingAddress;

    @NotBlank(message = "Kota tidak boleh kosong")
    private String city;

    @NotBlank(message = "Provinsi tidak boleh kosong")
    private String province;

    @NotBlank(message = "Kode pos tidak boleh kosong")
    private String postalCode;
}