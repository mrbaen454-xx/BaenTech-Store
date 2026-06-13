package com.baentech.shipping_service.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.baentech.shipping_service.entity.Shipping;
import com.baentech.shipping_service.entity.ShippingStatus;

public interface ShippingRepository extends JpaRepository<Shipping, Long> {
    Optional<Shipping> findByOrderId(Long orderId);

    Optional<Shipping> findByIdAndEmail (Long id, String email);

    Optional<Shipping> findByOrderIdAndEmail(Long orderId, String email);

    List<Shipping> findByEmailOrderByCreatedAtDesc(String email);

    List<Shipping> findByStatus(ShippingStatus status);

    List<Shipping> findByStatusAndEstimatedDeliveryAtLessThanEqual(
            ShippingStatus status,
            LocalDateTime now);
    boolean existsByOrderId(Long orderId);
}
