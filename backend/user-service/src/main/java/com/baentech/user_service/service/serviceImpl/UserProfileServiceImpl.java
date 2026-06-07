package com.baentech.user_service.service.serviceImpl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.baentech.user_service.entity.UserProfile;
import com.baentech.user_service.payload.req.UserProfileRequest;
import com.baentech.user_service.payload.res.UserProfileResponse;
import com.baentech.user_service.repository.UserProfileRepository;
import com.baentech.user_service.service.UserProfileService;


@Service
public class UserProfileServiceImpl implements UserProfileService
{
    @Autowired
    private UserProfileRepository userProfileRepository;


    @Override
    public UserProfileResponse createOrUpdateProfile (String email,UserProfileRequest request)
    {
        try {
            
            UserProfile profile = userProfileRepository.findByEmail(email).orElse(UserProfile.builder().email(email).build());

            profile.setFullName(request.getFullName());
            profile.setPhoneNumber(request.getPhoneNumber());
            profile.setProfileImageUrl(request.getProfileImageUrl());

            UserProfile savedProfile = userProfileRepository.save(profile);

            return mapToUserProfileResponse(savedProfile);


        } catch (Exception e) {
            throw new RuntimeException("Gagal menyimpan profile user : " + e.getMessage());
        }
    }

    @Override
    public UserProfileResponse getMyProfile(String email) {
        try {
            UserProfile profile = userProfileRepository.findByEmail(email).orElseThrow(()-> new RuntimeException("Profile user belum dibuat"));

            return mapToUserProfileResponse(profile);
        } catch (Exception e) {
            throw new RuntimeException("Gagal mengambil profile user : " + e.getMessage());
        }
    }

    private UserProfileResponse mapToUserProfileResponse(UserProfile userProfile) {
        try {
            return UserProfileResponse.builder()
                    .id(userProfile.getId())
                    .email(userProfile.getEmail())
                    .fullName(userProfile.getFullName())
                    .phoneNumber(userProfile.getPhoneNumber())
                    .profileImageUrl(userProfile.getProfileImageUrl())
                    .createdAt(userProfile.getCreatedAt())
                    .updatedAt(userProfile.getUpdatedAt())
                    .build();
        } catch (Exception e) {
            throw new RuntimeException("Gagal Mapping profile user : " + e.getMessage());
        }
    }

}