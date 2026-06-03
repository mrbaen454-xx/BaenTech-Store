package com.baentech.auth_service.payload.res;

import com.baentech.auth_service.entity.Role;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserResponse {

    private Long id;
    private String fullName;
    private String email;
    private Role role;
    private Boolean enabled;
}