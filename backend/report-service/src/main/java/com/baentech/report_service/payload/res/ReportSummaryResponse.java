package com.baentech.report_service.payload.res;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ReportSummaryResponse {

    private Long totalOrders;

    private Long totalPendingPaymentOrders;

    private Long totalPaidOrders;

    private Long totalCompletedOrders;

    private Long totalCancelledOrders;

    private Long totalPayments;

    private Long totalSuccessPayments;

    private Long totalFailedPayments;

    private BigDecimal totalRevenue;

    private Long totalShippings;

    private Long totalDeliveredShippings;

    private Long totalReceivedShippings;
}