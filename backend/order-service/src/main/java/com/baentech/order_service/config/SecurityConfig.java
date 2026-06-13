package com.baentech.order_service.config;

import com.baentech.order_service.security.JwtFilter;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.http.HttpMethod;

import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        try {
            http
                    .csrf(csrf -> csrf.disable())
                    .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                    .authorizeHttpRequests(auth -> auth
                            .requestMatchers("/actuator/**").permitAll()

                            // USER dan ADMIN boleh checkout, lihat order pribadi, detail, dan cancel
                            .requestMatchers(HttpMethod.POST, "/api/orders/checkout").hasAnyRole("USER", "ADMIN")
                            .requestMatchers(HttpMethod.GET, "/api/orders/my-orders").hasAnyRole("USER", "ADMIN")
                            .requestMatchers(HttpMethod.GET, "/api/orders/{id}").hasAnyRole("USER", "ADMIN")
                            .requestMatchers(HttpMethod.PUT, "/api/orders/{id}/cancel").hasAnyRole("USER", "ADMIN")
                            .requestMatchers(HttpMethod.PUT, "/api/orders/{id}/complete").hasAnyRole("USER", "ADMIN")

                            // Khusus ADMIN
                            .requestMatchers(HttpMethod.GET, "/api/orders/admin").hasRole("ADMIN")
                            .requestMatchers(HttpMethod.PUT, "/api/orders/{id}/status").hasRole("ADMIN")

                            .anyRequest().authenticated())
                    .exceptionHandling(exception -> exception
                            .authenticationEntryPoint((request, response, authException) -> {
                                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                                response.setContentType("application/json");
                                response.setCharacterEncoding("UTF-8");

                                response.getWriter().write("""
                                        {
                                            "success": false,
                                            "status": 401,
                                            "message": "Anda belum login atau token tidak valid"
                                        }
                                        """);
                            })

                            .accessDeniedHandler((request, response, accessDeniedException) -> {
                                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                                response.setContentType("application/json");
                                response.setCharacterEncoding("UTF-8");

                                response.getWriter().write("""
                                        {
                                            "success": false,
                                            "status": 403,
                                            "message": "Anda tidak memiliki akses ke endpoint ini"
                                        }
                                        """);
                            }))
                    .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

            return http.build();

        } catch (Exception e) {
            throw new RuntimeException("Gagal konfigurasi security: " + e.getMessage());
        }
    }
}