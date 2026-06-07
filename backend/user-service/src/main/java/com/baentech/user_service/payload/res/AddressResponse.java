package com.baentech.user_service.payload.res;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AddressResponse {

    private Long id;

    private String email;

    private String recipientName;

    private String phoneNumber;

    private String fullAddress;

    private String city;

    private String province;

    private String postalCode;

    private Boolean mainAddress;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
