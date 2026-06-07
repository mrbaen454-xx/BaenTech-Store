package com.baentech.cart_service.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.baentech.cart_service.entity.Cart;

public interface CartRepository extends JpaRepository<Cart, Long>{
    
    Optional<Cart> findByEmail(String email);
    
    boolean existsByEmail(String email);
}
