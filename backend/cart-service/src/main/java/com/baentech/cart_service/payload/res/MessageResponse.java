package com.baentech.cart_service.payload.res;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MessageResponse {

    private Boolean success;

    private String message;
}