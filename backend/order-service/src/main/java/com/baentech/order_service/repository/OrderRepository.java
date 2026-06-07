package com.baentech.order_service.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.baentech.order_service.entity.Order;
import com.baentech.order_service.entity.OrderStatus;

public interface OrderRepository extends JpaRepository<Order, Long> {
    
    Optional<Order> findByOrderNumber(String orderNumber);

    List<Order> findByEmail(String email);

    List<Order> findByEmailOrderByCreatedAtDesc(String email);

    List <Order> findByStatus(OrderStatus status);

    boolean existsByOrderNumber(String orderNumber);
}
