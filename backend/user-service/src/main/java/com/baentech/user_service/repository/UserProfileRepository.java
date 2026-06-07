package com.baentech.user_service.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.baentech.user_service.entity.UserProfile;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long>
{
    Optional<UserProfile> findByEmail(String email);

    boolean existsByEmail(String email);

}