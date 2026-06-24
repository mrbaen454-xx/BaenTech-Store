package com.baentech.shipping_service.controller;

import com.baentech.shipping_service.entity.ShippingStatus;
import com.baentech.shipping_service.payload.req.CreateShippingRequest;
import com.baentech.shipping_service.payload.req.ShipOrderRequest;
import com.baentech.shipping_service.payload.res.MessageResponse;
import com.baentech.shipping_service.payload.res.ShippingResponse;
import com.baentech.shipping_service.service.ShippingService;

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
@RequestMapping("/api/shippings")
@RequiredArgsConstructor
public class ShippingController {

    private final ShippingService shippingService;

    @PostMapping("/create")
    public ResponseEntity<?> createShipping(
            HttpServletRequest httpServletRequest,
            @Valid @RequestBody CreateShippingRequest request) {
        try {
            String token = httpServletRequest.getHeader("Authorization");

            ShippingResponse response = shippingService.createShipping(token, request);

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

    @GetMapping("/my-shippings")
    public ResponseEntity<?> getMyShippings(Principal principal) {
        try {
            if (principal == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Anda belum login");

                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }

            String email = principal.getName();

            List<ShippingResponse> response = shippingService.getMyShippings(email);

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
    public ResponseEntity<?> getShippingById(
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

            ShippingResponse response = shippingService.getShippingById(email, id);

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
    public ResponseEntity<?> getShippingByOrderId(
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

            ShippingResponse response = shippingService.getShippingByOrderId(email, orderId);

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
    public ResponseEntity<?> getAllShippings() {
        try {
            List<ShippingResponse> response = shippingService.getAllShippings();

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

    @PutMapping("/{id}/ship")
    public ResponseEntity<?> shipOrder(
            HttpServletRequest httpServletRequest,
            @PathVariable Long id,
            @Valid @RequestBody ShipOrderRequest request) {
        try {
            String token = httpServletRequest.getHeader("Authorization");

            ShippingResponse response = shippingService.shipOrder(token, id, request);

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

    @PutMapping("/{id}/shipped")
    public ResponseEntity<?> markShippingShipped(
            HttpServletRequest httpServletRequest,
            @PathVariable Long id) {
        try {
            String token = httpServletRequest.getHeader("Authorization");

            ShippingResponse response = shippingService.markShippingShipped(token, id);

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

    @PutMapping("/{id}/delivered")
    public ResponseEntity<?> markShippingDelivered(@PathVariable Long id) {
        try {
            ShippingResponse response = shippingService.markShippingDelivered(id);

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

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateShippingStatus(
            HttpServletRequest httpServletRequest,
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        try {
            String statusValue = request.get("status");

            if (statusValue == null || statusValue.isBlank()) {
                throw new RuntimeException("Status shipping tidak boleh kosong");
            }

            String token = httpServletRequest.getHeader("Authorization");
            ShippingStatus status = ShippingStatus.valueOf(statusValue.trim().toUpperCase());

            ShippingResponse response = shippingService.updateShippingStatus(token, id, status);

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Status shipping tidak valid");

            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);

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

    @PutMapping("/{id}/confirm-received")
    public ResponseEntity<?> confirmReceived(
            Principal principal,
            HttpServletRequest httpServletRequest,
            @PathVariable Long id) {
        try {
            if (principal == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Anda belum login");

                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }

            String email = principal.getName();
            String token = httpServletRequest.getHeader("Authorization");

            ShippingResponse response = shippingService.confirmReceived(email, token, id);

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
    public ResponseEntity<?> cancelShipping(@PathVariable Long id) {
        try {
            MessageResponse response = shippingService.cancelShipping(id);

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
