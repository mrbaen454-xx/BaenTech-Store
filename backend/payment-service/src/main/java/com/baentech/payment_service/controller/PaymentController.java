package com.baentech.payment_service.controller;

import com.baentech.payment_service.payload.req.CreatePaymentRequest;
import com.baentech.payment_service.payload.res.MessageResponse;
import com.baentech.payment_service.payload.res.PaymentResponse;
import com.baentech.payment_service.service.PaymentService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create")
    public ResponseEntity<?> createPayment(
            Principal principal,
            HttpServletRequest httpServletRequest,
            @Valid @RequestBody CreatePaymentRequest request) {
        try {
            if (principal == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Anda belum login");

                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }

            String email = principal.getName();
            String token = httpServletRequest.getHeader("Authorization");

            PaymentResponse response = paymentService.createPayment(email, token, request);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());

            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);

        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Terjadi kesalahan pada server");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/my-payments")
    public ResponseEntity<?> getMyPayments(Principal principal) {
        try {
            if (principal == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Anda belum login");

                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }

            String email = principal.getName();

            List<PaymentResponse> response = paymentService.getMyPayments(email);

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());

            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);

        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Terjadi kesalahan pada server");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPaymentById(
            Principal principal,
            @PathVariable Long id) {
        try {
            if (principal == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Anda belum login");

                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }

            String email = principal.getName();

            PaymentResponse response = paymentService.getPaymentById(email, id);

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());

            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);

        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Terjadi kesalahan pada server");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<?> getPaymentByOrderId(
            Principal principal,
            @PathVariable Long orderId) {
        try {
            if (principal == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Anda belum login");

                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }

            String email = principal.getName();

            PaymentResponse response = paymentService.getPaymentByOrderId(email, orderId);

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());

            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);

        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Terjadi kesalahan pada server");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/admin")
    public ResponseEntity<?> getAllPayments() {
        try {
            List<PaymentResponse> response = paymentService.getAllPayments();

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());

            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);

        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Terjadi kesalahan pada server");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PutMapping("/{id}/success")
    public ResponseEntity<?> paymentSuccess(
            HttpServletRequest httpServletRequest,
            @PathVariable Long id) {
        try {
            String token = httpServletRequest.getHeader("Authorization");

            PaymentResponse response = paymentService.paymentSuccess(token, id);

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());

            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);

        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Terjadi kesalahan pada server");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PutMapping("/{id}/failed")
    public ResponseEntity<?> paymentFailed(
            Principal principal,
            @PathVariable Long id) {
        try {
            if (principal == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Anda belum login");

                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }

            String email = principal.getName();

            PaymentResponse response = paymentService.paymentFailed(email, id);

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());

            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);

        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Terjadi kesalahan pada server");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelPayment(
            Principal principal,
            @PathVariable Long id) {
        try {
            if (principal == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Anda belum login");

                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }

            String email = principal.getName();

            MessageResponse response = paymentService.cancelPayment(email, id);

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());

            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);

        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Terjadi kesalahan pada server");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}