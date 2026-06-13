package com.baentech.auth_service.service.serviceImpl;

import com.baentech.auth_service.entity.Role;
import com.baentech.auth_service.entity.User;
import com.baentech.auth_service.payload.client.EmailClientRequest;
import com.baentech.auth_service.payload.req.LoginRequest;
import com.baentech.auth_service.payload.req.RegisterRequest;
import com.baentech.auth_service.payload.res.LoginResponse;
import com.baentech.auth_service.payload.res.RegisterResponse;
import com.baentech.auth_service.payload.res.UserResponse;
import com.baentech.auth_service.repository.UserRepository;
import com.baentech.auth_service.security.JwtUtil;
import com.baentech.auth_service.service.AuthService;

import lombok.RequiredArgsConstructor;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final WebClient.Builder webClientBuilder;
  

    @Override
    public LoginResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()));

            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("User tidak ditemukan"));

            String token = jwtUtil.generateToken(
                    user.getEmail(),
                    user.getRole().name());

            return LoginResponse.builder()
                    .token(token)
                    .tokenType("Bearer")
                    .user(maptoUserResponse(user))
                    .build();

        } catch (Exception e) {
            throw new RuntimeException("Gagal login : " + e.getMessage());
        }
    }

    @Override
    public RegisterResponse register(RegisterRequest request) {
        try {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Email sudah terdaftar");
            }

            User user = User.builder()
                    .fullName(request.getFullName())
                    .email(request.getEmail())
                    .password(passwordEncoder.encode(request.getPassword()))
                    .role(Role.USER)
                    .enabled(true)
                    .build();

            User savedUser = userRepository.save(user);

            sendWelcomeEmail(request.getEmail(), request.getFullName());

            return RegisterResponse.builder()
                    .message("Berhasil membuat akun")
                    .user(maptoUserResponse(savedUser))
                    .build();

        } catch (Exception e) {
            throw new RuntimeException("Gagal membuat akun : " + e.getMessage());
        }
    }

    @Override
    public UserResponse getCurrentUser(String email) {
        try {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User tidak ditemukan"));

            return maptoUserResponse(user);

        } catch (Exception e) {
            throw new RuntimeException("Gagal mengambil data user : " + e.getMessage());
        }
    }

    private void sendWelcomeEmail(String email, String fullName) 
    {
        try {
            EmailClientRequest emailRequest = new EmailClientRequest(
                email,
                "Selamat Datang di BaenTech Store",
                "Halo " + fullName + ",\n\n" +
                        "Akun kamu berhasil dibuat di BaenTech Store.\n" +
                        "Sekarang kamu sudah bisa login dan mulai berbelanja produk elektronik pilihan.\n\n" +
                        "Terima kasih sudah bergabung bersama BaenTech Store.\n\n" +
                        "Salam,\n" +
                        "BaenTech Store"
            );

            webClientBuilder.build()
                .post()
                .uri("http://NOTIFICATION-SERVICE/api/notifications/send-email")
                .bodyValue(emailRequest)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        } catch (Exception e) {
            System.out.println("Gagal mengirim welcome email: " + e.getMessage());
        }
    }



    private UserResponse maptoUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .enabled(user.getEnabled())
                .build();
    }
}