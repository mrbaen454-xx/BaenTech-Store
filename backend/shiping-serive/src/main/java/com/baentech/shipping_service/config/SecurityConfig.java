package com.baentech.shipping_service.config;

import com.baentech.shipping_service.security.JwtFilter;

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

                            // ADMIN
                            .requestMatchers(HttpMethod.POST, "/api/shippings/create").hasRole("ADMIN")
                            .requestMatchers(HttpMethod.GET, "/api/shippings/admin").hasRole("ADMIN")
                            .requestMatchers(HttpMethod.PUT, "/api/shippings/{id}/ship").hasRole("ADMIN")
                            .requestMatchers(HttpMethod.PUT, "/api/shippings/{id}/cancel").hasRole("ADMIN")

                            // USER dan ADMIN
                            .requestMatchers(HttpMethod.GET, "/api/shippings/my-shippings").hasAnyRole("USER", "ADMIN")
                            .requestMatchers(HttpMethod.GET, "/api/shippings/{id}").hasAnyRole("USER", "ADMIN")
                            .requestMatchers(HttpMethod.GET, "/api/shippings/order/{orderId}")
                            .hasAnyRole("USER", "ADMIN")
                            .requestMatchers(HttpMethod.PUT, "/api/shippings/{id}/confirm-received")
                            .hasAnyRole("USER", "ADMIN")

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