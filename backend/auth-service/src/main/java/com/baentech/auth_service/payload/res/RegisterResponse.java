package com.baentech.auth_service.payload.res;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RegisterResponse {

    private String message;
    private UserResponse user;
}