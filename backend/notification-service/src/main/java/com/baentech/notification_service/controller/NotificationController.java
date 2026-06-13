package com.baentech.notification_service.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.baentech.notification_service.payload.req.EmailRequest;
import com.baentech.notification_service.payload.res.MessageResponse;
import com.baentech.notification_service.service.EmailService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final EmailService emailService;
    
    @PostMapping("send-email")
    public ResponseEntity<?> sendEmail( @Valid @RequestBody EmailRequest request) {
        try {
            MessageResponse response = emailService.sendEmail(request);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());

            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    
        } catch(Exception e)
        {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Terjadi kesalahan pada server");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);

        }
    }
    
    

}
