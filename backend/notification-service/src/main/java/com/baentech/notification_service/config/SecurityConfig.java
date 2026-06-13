package com.baentech.notification_service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        try {
            http
                    .csrf(csrf -> csrf.disable())
                    .authorizeHttpRequests(auth -> auth
                            .requestMatchers("/api/notifications/**").permitAll()
                            .anyRequest().permitAll()
                    );

            return http.build();

        } catch (Exception e) {
            throw new RuntimeException("Gagal konfigurasi security: " + e.getMessage());
        }
    }
}
