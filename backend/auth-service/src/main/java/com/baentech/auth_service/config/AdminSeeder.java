package com.baentech.auth_service.config;

import com.baentech.auth_service.entity.Role;
import com.baentech.auth_service.entity.User;
import com.baentech.auth_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

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