package com.baentech.cart_service.service;

import com.baentech.cart_service.payload.req.AddCartItemRequest;
import com.baentech.cart_service.payload.req.UpdateCartItemRequest;
import com.baentech.cart_service.payload.res.CartResponse;
import com.baentech.cart_service.payload.res.MessageResponse;

public interface CartService {

    CartResponse addItemToCart(String email, AddCartItemRequest request);

    CartResponse getMyCart(String email);

    CartResponse updateCartItem(String email, Long itemId, UpdateCartItemRequest request);

    MessageResponse deleteCartItem(String email, Long itemId);

    MessageResponse clearCart(String email);
}