package com.baentech.shipping_service.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "shippings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shipping {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false,unique = true)
    private Long orderId;

    @Column(nullable = false)
    private String orderNumber;
    
    @Column(nullable = false)
    private String email;
    
    private String recipientName;
    
    private String phoneNumber;
    
    @Column(columnDefinition = "TEXT")
    private String shippingAddress; 
    
    private String city;
    
    private String province;

    private String postalCode;
    
    private String courier;
    
    private String trackingNumber;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShippingStatus status;

    private LocalDateTime shippedAt;

    private LocalDateTime estimatedDeliveryAt;

    private LocalDateTime deliveredAt;
    
    private LocalDateTime receivedAt;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();

        if (status == null) {
            status = ShippingStatus.PENDING;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }



}
