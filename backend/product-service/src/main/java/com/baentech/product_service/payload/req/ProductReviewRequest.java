package com.baentech.product_service.payload.req;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProductReviewRequest {

    private String userName;

    @NotNull(message = "Rating tidak boleh kosong")
    @Min(value = 1, message = "Rating minimal 1")
    @Max(value = 5, message = "Rating maksimal 5")
    private Integer rating;

    @NotBlank(message = "Ulasan tidak boleh kosong")
    @Size(min = 5, max = 1000, message = "Ulasan minimal 5 karakter dan maksimal 1000 karakter")
    private String comment;
}
