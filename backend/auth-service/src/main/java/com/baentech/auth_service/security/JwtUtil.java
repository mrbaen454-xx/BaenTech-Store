package com.baentech.auth_service.security;

import java.security.Key;
import java.util.Date;

import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtil {

    private String secret = "BaenTechStoreSecretKey2026YangSangatPanjangDanAmanMinimal32Character";

    private Long expiration = 86400000L;

    private Key getSigningKey() {
        try {
            return Keys.hmacShaKeyFor(secret.getBytes());
        } catch (Exception e) {
            throw new RuntimeException("Gagal membuat signing key JWT: " + e.getMessage());
        }
    }

    public String generateToken(String email, String role) {
        try {
            Date now = new Date();
            Date expireDate = new Date(now.getTime() + expiration);

            return Jwts.builder()
                    .subject(email)
                    .claim("role", role)
                    .issuedAt(now)
                    .expiration(expireDate)
                    .signWith(getSigningKey())
                    .compact();

        } catch (Exception e) {
            throw new RuntimeException("Gagal membuat token: " + e.getMessage());
        }
    }

    public Claims extractAllClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith((javax.crypto.SecretKey) getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

        } catch (Exception e) {
            throw new RuntimeException("Token tidak valid: " + e.getMessage());
        }
    }

    public String extractEmail(String token) {
        try {
            return extractAllClaims(token).getSubject();

        } catch (Exception e) {
            throw new RuntimeException("Gagal mengambil email dari token: " + e.getMessage());
        }
    }

    public String extractRole(String token) {
        try {
            return extractAllClaims(token).get("role", String.class);

        } catch (Exception e) {
            throw new RuntimeException("Gagal mengambil role dari token: " + e.getMessage());
        }
    }

    public boolean isTokenExpired(String token) {
        try {
            return extractAllClaims(token).getExpiration().before(new Date());

        } catch (Exception e) {
            return true;
        }
    }

    public boolean validationToken(String token) {
        try {
            extractAllClaims(token);
            return !isTokenExpired(token);

        } catch (Exception e) {
            return false;
        }
    }
}