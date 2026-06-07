package com.baentech.payment_service.service;

import com.baentech.payment_service.payload.req.CreatePaymentRequest;
import com.baentech.payment_service.payload.res.MessageResponse;
import com.baentech.payment_service.payload.res.PaymentResponse;

import java.util.List;

public interface PaymentService {

    PaymentResponse createPayment(String email, String token, CreatePaymentRequest request);

    List<PaymentResponse> getMyPayments(String email);

    PaymentResponse getPaymentById(String email, Long id);

    PaymentResponse getPaymentByOrderId(String email, Long orderId);

    List<PaymentResponse> getAllPayments();

    PaymentResponse paymentSuccess(String token, Long id);

    PaymentResponse paymentFailed(String email, Long id);

    MessageResponse cancelPayment(String email, Long id);
}