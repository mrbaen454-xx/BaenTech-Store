package com.baentech.report_service.service;

import com.baentech.report_service.payload.res.OrderReportResponse;
import com.baentech.report_service.payload.res.PaymentReportResponse;
import com.baentech.report_service.payload.res.ReportSummaryResponse;

import java.time.LocalDate;
import java.util.List;

public interface ReportService {

    ReportSummaryResponse getSummary(String token);

    List<OrderReportResponse> getOrderReports(String token,LocalDate startDate,LocalDate endDate);

    List<PaymentReportResponse> getPaymentReports(String token,LocalDate startDate,LocalDate endDate);

    byte[] exportOrderReportsToExcel(String token,LocalDate startDate,LocalDate endDate);

    byte[] exportPaymentReportsToExcel(String token,LocalDate startDate,LocalDate endDate);
}