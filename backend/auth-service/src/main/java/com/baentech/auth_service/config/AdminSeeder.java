package com.baentech.auth_service.config;

import com.baentech.auth_service.entity.Role;
import com.baentech.auth_service.entity.User;
import com.baentech.auth_service.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByEmail("admin@baentech.com")) {
            User admin = User.builder()
                    .fullName("Admin BaenTech")
                    .email("admin@baentech.com")
                    .password(passwordEncoder.encode("admin123"))
                    .enabled(true)
                    .role(Role.ADMIN)
                    .build();

            userRepository.save(admin);
        }
    }
}