package com.baentech.auth_service.service;

import com.baentech.auth_service.payload.req.LoginRequest;
import com.baentech.auth_service.payload.req.RegisterRequest;
import com.baentech.auth_service.payload.res.LoginResponse;
import com.baentech.auth_service.payload.res.RegisterResponse;
import com.baentech.auth_service.payload.res.UserResponse;

public interface AuthService {

    LoginResponse login(LoginRequest request);

    RegisterResponse register(RegisterRequest request);

    UserResponse getCurrentUser(String email);
}