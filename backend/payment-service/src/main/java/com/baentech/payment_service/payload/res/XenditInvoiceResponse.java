package com.baentech.payment_service.payload.res;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class XenditInvoiceResponse {

    private String id;

    @JsonProperty("external_id")
    private String externalId;

    @JsonProperty("user_id")
    private String userId;

    private String status;

    @JsonProperty("merchant_name")
    private String merchantName;

    private BigDecimal amount;

    @JsonProperty("paid_amount")
    private BigDecimal paidAmount;

    @JsonProperty("payer_email")
    private String payerEmail;

    private String description;

    @JsonProperty("expiry_date")
    private String expiryDate;

    @JsonProperty("invoice_url")
    private String invoiceUrl;

    private String currency;

    @JsonProperty("paid_at")
    private String paidAt;

    @JsonProperty("payment_method")
    private String paymentMethod;

    @JsonProperty("payment_channel")
    private String paymentChannel;

    @JsonProperty("payment_destination")
    private String paymentDestination;
}