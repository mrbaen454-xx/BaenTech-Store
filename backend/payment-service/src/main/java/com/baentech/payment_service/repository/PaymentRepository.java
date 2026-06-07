package com.baentech.payment_service.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.baentech.payment_service.entity.Payment;
import com.baentech.payment_service.entity.PaymentStatus;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByPaymentNumber(String paymentNumber);

    Optional<Payment> findByOrderId(Long orderId);

    List<Payment> findByStatus(PaymentStatus status);

    List<Payment> findByEmailOrderByCreatedAtDesc(String email);

    boolean existsByPaymentNumber(String paymentNumber);

    boolean existsByOrderId(Long orderId);

    
}
