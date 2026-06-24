package com.baentech.payment_service.config;

import com.baentech.payment_service.security.JwtFilter;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.http.HttpMethod;

import org.springframework.security.config.Customizer;
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
                    .cors(Customizer.withDefaults())
                    .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                    .authorizeHttpRequests(auth -> auth
                            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                            .requestMatchers("/actuator/**").permitAll()

                            // ADMIN
                            .requestMatchers(HttpMethod.GET, "/api/payments/admin").hasRole("ADMIN")
                            .requestMatchers(HttpMethod.PUT, "/api/payments/{id}/success").hasRole("ADMIN")
                            .requestMatchers(HttpMethod.PUT, "/api/payments/{id}/failed").hasRole("ADMIN")

                            // USER
                            .requestMatchers(HttpMethod.POST, "/api/payments/create").hasRole("USER")
                            .requestMatchers(HttpMethod.GET, "/api/payments/my-payments").hasRole("USER")
                            .requestMatchers(HttpMethod.GET, "/api/payments/order/{orderId}").hasRole("USER")
                            .requestMatchers(HttpMethod.PUT, "/api/payments/{id}/cancel").hasRole("USER")
                            .requestMatchers(HttpMethod.POST, "/api/payments/xendit/create").hasRole("USER")
                            .requestMatchers(HttpMethod.POST, "/api/payments/xendit/callback").permitAll()

                            // Detail payment
                            .requestMatchers(HttpMethod.GET, "/api/payments/{id}").hasAnyRole("USER", "ADMIN")

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