package com.baentech.auth_service.config;

import com.baentech.auth_service.entity.Role;
import com.baentech.auth_service.entity.User;
import com.baentech.auth_service.repository.UserRepository;
import com.baentech.auth_service.security.JwtUtil;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {

        try {
            OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

            String email = oAuth2User.getAttribute("email");
            String fullName = oAuth2User.getAttribute("name");

            if (email == null || email.isBlank()) {
                throw new RuntimeException("Email dari Google tidak ditemukan");
            }

            User user = userRepository.findByEmail(email)
                    .orElseGet(() -> createGoogleUser(email, fullName));

            if (user.getEnabled() == null || !user.getEnabled()) {
                user.setEnabled(true);
                user = userRepository.save(user);
            }

            String token = jwtUtil.generateToken(
                    user.getEmail(),
                    user.getRole().name());

            String redirectUrl = frontendUrl
                    + "/oauth2/success?token="
                    + URLEncoder.encode(token, StandardCharsets.UTF_8);

            response.sendRedirect(redirectUrl);

        } catch (Exception e) {
            String errorUrl = frontendUrl
                    + "/login?oauthError="
                    + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8);

            response.sendRedirect(errorUrl);
        }
    }

    private User createGoogleUser(String email, String fullName) {
        String name = fullName;

        if (name == null || name.isBlank()) {
            name = email.split("@")[0];
        }

        String randomPassword = UUID.randomUUID().toString();
        String encodedPassword = new BCryptPasswordEncoder().encode(randomPassword);

        User user = User.builder()
                .fullName(name)
                .email(email)
                .password(encodedPassword)
                .enabled(true)
                .role(Role.USER)
                .build();

        return userRepository.save(user);
    }
}