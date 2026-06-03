package com.baentech.product_service.payload.req;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CategoryRequest {

    @NotBlank(message = "Nama kategori tidak boleh kosong")
    private String name;

    private String description;
}