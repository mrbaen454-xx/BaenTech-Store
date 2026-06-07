package com.baentech.user_service.payload.req;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UserProfileRequest {
    
    @NotBlank
    private String fullName;

    private String phoneNumber;
    
    private String profileImageUrl;
}
