package com.baentech.shipping_service.service;

import java.util.List;

import com.baentech.shipping_service.payload.req.CreateShippingRequest;
import com.baentech.shipping_service.payload.req.ShipOrderRequest;
import com.baentech.shipping_service.payload.res.MessageResponse;
import com.baentech.shipping_service.payload.res.ShippingResponse;

public interface ShippingService {
    ShippingResponse createShipping(String token, CreateShippingRequest request);

    List<ShippingResponse> getMyShippings(String email);

    ShippingResponse getShippingById(String email,Long id);

    ShippingResponse getShippingByOrderId(String email,Long orderId);

    List<ShippingResponse> getAllShippings();

    ShippingResponse shipOrder(Long id,ShipOrderRequest request);

    ShippingResponse confirmReceived(String email,String token,Long id);

    MessageResponse cancelShipping(Long id);
}
