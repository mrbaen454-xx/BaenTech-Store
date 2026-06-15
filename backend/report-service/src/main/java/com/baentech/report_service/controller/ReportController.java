package com.baentech.report_service.controller;

import com.baentech.report_service.enums.IncomePeriod;
import com.baentech.report_service.payload.res.IncomeChartResponse;
import com.baentech.report_service.payload.res.OrderReportResponse;
import com.baentech.report_service.payload.res.PaymentReportResponse;
import com.baentech.report_service.payload.res.ReportSummaryResponse;
import com.baentech.report_service.service.ReportService;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {


    private final ReportService reportService;

    @GetMapping("/summary")
    public ResponseEntity<?> getSummary(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String token) {
        try {
            validateToken(token);

            ReportSummaryResponse response = reportService.getSummary(token);

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            return errorResponse(HttpStatus.BAD_REQUEST, e.getMessage());

        } catch (Exception e) {
            return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Terjadi kesalahan pada server");
        }
    }

    @GetMapping("/orders")
    public ResponseEntity<?> getOrderReports(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String token,

            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,

            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            validateToken(token);
            validateDateRange(startDate, endDate);

            List<OrderReportResponse> response = reportService.getOrderReports(token, startDate, endDate);

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            return errorResponse(HttpStatus.BAD_REQUEST, e.getMessage());

        } catch (Exception e) {
            return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Terjadi kesalahan pada server");
        }
    }

    @GetMapping("/payments")
    public ResponseEntity<?> getPaymentReports(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String token,

            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,

            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            validateToken(token);
            validateDateRange(startDate, endDate);

            List<PaymentReportResponse> response = reportService.getPaymentReports(token, startDate, endDate);

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            return errorResponse(HttpStatus.BAD_REQUEST, e.getMessage());

        } catch (Exception e) {
            return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Terjadi kesalahan pada server");
        }
    }

    @GetMapping("/orders/export-excel")
    public ResponseEntity<?> exportOrderReportsToExcel(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String token,

            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,

            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            validateToken(token);
            validateDateRange(startDate, endDate);

            byte[] excelFile = reportService.exportOrderReportsToExcel(token, startDate, endDate);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=order-report.xlsx")
                    .contentType(MediaType.parseMediaType(
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(excelFile);

        } catch (RuntimeException e) {
            return errorResponse(HttpStatus.BAD_REQUEST, e.getMessage());

        } catch (Exception e) {
            return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Terjadi kesalahan pada server");
        }
    }

    @GetMapping("/payments/export-excel")
    public ResponseEntity<?> exportPaymentReportsToExcel(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String token,

            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,

            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            validateToken(token);
            validateDateRange(startDate, endDate);

            byte[] excelFile = reportService.exportPaymentReportsToExcel(token, startDate, endDate);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=payment-report.xlsx")
                    .contentType(MediaType.parseMediaType(
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(excelFile);

        } catch (RuntimeException e) {
            return errorResponse(HttpStatus.BAD_REQUEST, e.getMessage());

        } catch (Exception e) {
            return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Terjadi kesalahan pada server");
        }
    }

@GetMapping("/income")
public ResponseEntity<?> getIncomeChart(
        HttpServletRequest httpServletRequest,
        @RequestParam(defaultValue = "WEEK") IncomePeriod period
) {
    try {
        String token = httpServletRequest.getHeader("Authorization");

        List<IncomeChartResponse> response =
                reportService.getIncomeChart(token, period);

        return ResponseEntity.ok(response);

    } catch (RuntimeException e) {
        Map<String, Object> error = new HashMap<>();
        error.put("success", false);
        error.put("message", e.getMessage());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);

    } catch (Exception e) {
        Map<String, Object> error = new HashMap<>();
        error.put("success", false);
        error.put("message", "Gagal mengambil data grafik pemasukan");

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
    private void validateToken(String token) {
        if (token == null || token.isBlank()) {
            throw new RuntimeException("Token tidak boleh kosong");
        }

        if (!token.startsWith("Bearer ")) {
            throw new RuntimeException("Format token tidak valid");
        }
    }

    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new RuntimeException("Start date tidak boleh lebih besar dari end date");
        }
    }

    private ResponseEntity<Map<String, Object>> errorResponse(HttpStatus status, String message) {
        Map<String, Object> error = new HashMap<>();
        error.put("success", false);
        error.put("message", message);

        return ResponseEntity.status(status).body(error);
    }
}