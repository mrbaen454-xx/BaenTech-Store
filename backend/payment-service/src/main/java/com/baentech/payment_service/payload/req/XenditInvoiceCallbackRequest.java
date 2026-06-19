package com.baentech.payment_service.payload.req;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class XenditInvoiceCallbackRequest {

    private String id;

    @JsonProperty("external_id")
    private String externalId;

    private String status;

    private BigDecimal amount;

    @JsonProperty("paid_amount")
    private BigDecimal paidAmount;

    @JsonProperty("payer_email")
    private String payerEmail;

    private String description;

    @JsonProperty("paid_at")
    private String paidAt;

    @JsonProperty("payment_method")
    private String paymentMethod;

    @JsonProperty("payment_channel")
    private String paymentChannel;

    @JsonProperty("payment_destination")
    private String paymentDestination;

    @JsonProperty("invoice_url")
    private String invoiceUrl;
}