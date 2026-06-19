
package com.baentech.payment_service.service;

import com.baentech.payment_service.entity.Payment;
import com.baentech.payment_service.payload.client.OrderClientResponse;
import com.baentech.payment_service.payload.res.XenditInvoiceResponse;

public interface XenditService {

    XenditInvoiceResponse createInvoice(Payment payment, OrderClientResponse order);
}