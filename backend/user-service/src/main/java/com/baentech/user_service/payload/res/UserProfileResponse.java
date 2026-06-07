package com.baentech.user_service.payload.res;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserProfileResponse {
    
    private Long id;

    private String email;

    private String fullName;

    private String phoneNumber;

    private String profileImageUrl;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
