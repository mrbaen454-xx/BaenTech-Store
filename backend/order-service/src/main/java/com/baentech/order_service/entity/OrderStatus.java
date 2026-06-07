package com.baentech.order_service.entity;

public enum OrderStatus {
    PENDING_PAYMENT,
    PAID,
    PROCESSING,
    SHIPPED,
    COMPLETED,
    CANCELLED
}
