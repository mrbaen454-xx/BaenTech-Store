package com.baentech.product_service.payload.req;

import com.baentech.product_service.entity.ProductStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductRequest {

    @NotBlank(message = "Nama produk tidak boleh kosong")
    private String name;

    private String description;

    @NotBlank(message = "Brand tidak boleh kosong")
    private String brand;

    @NotNull(message = "Harga tidak boleh kosong")
    private BigDecimal price;

    @NotNull(message = "Stok tidak boleh kosong")
    private Integer stock;

    private String warranty;

    private ProductStatus status;

    @NotNull(message = "Kategori tidak boleh kosong")
    private Long categoryId;
}