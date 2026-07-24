package com.baentech.auth_service.security;

import java.io.IOException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor

public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    private final CustomUserDetailsService customUserDetailsService;



    //Method ini menetukan request mana yang tidak perlu di filter
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getServletPath();

        return path.startsWith("/api/auth/")
                || path.startsWith("/oauth2/")
                || path.startsWith("/login/oauth2/")
                || path.equals("/error")
                || path.startsWith("/actuator");
    }


    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        try {
            String authHeader = request.getHeader("Authorization");

            String token = null;
            String email = null;

            System.out.println("JWT FILTER HIT");
            System.out.println("PATH: " + request.getServletPath());
            System.out.println("AUTH HEADER: " + authHeader);

            //Mengecek apakah Header Authorization tidak null dan di awali dengan "Bearer "
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
                email = jwtUtil.extractEmail(token);

                System.out.println("EMAIL FROM TOKEN: " + email);
            }

            // Mengecek apakah email tidak null dan authentication masih null
            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = customUserDetailsService.loadUserByUsername(email);

                if (jwtUtil.validationToken(token)) {
                    UsernamePasswordAuthenticationToken authenticationToken =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities()
                            );

                    // menambahkan detaik request ke authentication token
                    // detail ini bisa berisi informasi seperti IP address atau sesion id        
                    authenticationToken.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request)
                    );

                    //menyimpan authentication ke securityContext
                    //setelah baris ini, spring security menggap user sudah login untuk request tersebut
                    SecurityContextHolder.getContext().setAuthentication(authenticationToken);

                    System.out.println("JWT AUTHENTICATION SUCCESS");
                } else {
                    System.out.println("JWT TOKEN TIDAK VALID");
                }
            }

        } catch (Exception e) {
            System.out.println("JWT FILTER ERROR: " + e.getMessage());
        }

        //untuk melanjutkan request ke filter berikutnya atau ke controller
        filterChain.doFilter(request, response);
    }
}