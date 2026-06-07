package com.baentech.user_service.service;

import com.baentech.user_service.payload.req.UserProfileRequest;
import com.baentech.user_service.payload.res.UserProfileResponse;

public interface UserProfileService {
    
    UserProfileResponse createOrUpdateProfile (String email,UserProfileRequest request);
 
    UserProfileResponse getMyProfile(String email);
}
