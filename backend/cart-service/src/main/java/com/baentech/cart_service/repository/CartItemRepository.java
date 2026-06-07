package com.baentech.cart_service.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.baentech.cart_service.entity.CartItem;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    
    Optional<CartItem> findByIdAndCartEmail(Long id, String email);

    Optional<CartItem> findByCartEmailAndProductId(String email, Long productId);

    void deleteByCartEmail(String email);
}
