package com.baentech.cart_service.controller;

import com.baentech.cart_service.payload.req.AddCartItemRequest;
import com.baentech.cart_service.payload.req.UpdateCartItemRequest;
import com.baentech.cart_service.payload.res.CartResponse;
import com.baentech.cart_service.payload.res.MessageResponse;
import com.baentech.cart_service.service.CartService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/carts")
@RequiredArgsConstructor
public class CartController {

    // @Autowired
    private final CartService cartService;

    @PostMapping("/items")
    public ResponseEntity<?> addItemToCart(Principal principal,@Valid @RequestBody AddCartItemRequest request) 
    {
        try {
            if (principal == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Anda belum login");

                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }

            String email = principal.getName();

            CartResponse response = cartService.addItemToCart(email, request);

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

    @GetMapping
    public ResponseEntity<?> getMyCart(Principal principal) {
        try {
            if (principal == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Anda belum login");

                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }

            String email = principal.getName();

            CartResponse response = cartService.getMyCart(email);

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

    @PutMapping("/items/{itemId}")
    public ResponseEntity<?> updateCartItem(Principal principal,@PathVariable Long itemId,@Valid @RequestBody UpdateCartItemRequest request) 
    {
        try {
            if (principal == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Anda belum login");

                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }

            String email = principal.getName();

            CartResponse response = cartService.updateCartItem(email, itemId, request);

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

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<?> deleteCartItem(Principal principal,@PathVariable Long itemId) 
    {
        try {
            if (principal == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Anda belum login");

                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }

            String email = principal.getName();

            MessageResponse response = cartService.deleteCartItem(email, itemId);

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

    @DeleteMapping("/clear")
    public ResponseEntity<?> clearCart(Principal principal) {
        try {
            if (principal == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Anda belum login");

                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }

            String email = principal.getName();

            MessageResponse response = cartService.clearCart(email);

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