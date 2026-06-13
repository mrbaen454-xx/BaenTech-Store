package com.baentech.order_service.service;

import com.baentech.order_service.payload.req.CheckoutRequest;
import com.baentech.order_service.payload.req.UpdateOrderStatusRequest;
import com.baentech.order_service.payload.res.MessageResponse;
import com.baentech.order_service.payload.res.OrderResponse;

import java.util.List;

public interface OrderService {

    OrderResponse checkout(String email, String token, CheckoutRequest request);

    List<OrderResponse> getMyOrders(String email);

    OrderResponse getOrderById(String email, Long id);

    List<OrderResponse> getAllOrders();

    OrderResponse updateOrderStatus(Long id, String token,UpdateOrderStatusRequest request);

    MessageResponse cancelOrder(String email, Long id);

    OrderResponse completeOrder(String email, Long id);
}