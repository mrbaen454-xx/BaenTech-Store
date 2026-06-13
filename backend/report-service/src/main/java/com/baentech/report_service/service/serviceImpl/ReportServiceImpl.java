package com.baentech.report_service.service.serviceImpl;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.baentech.report_service.payload.client.OrderClientResponse;
import com.baentech.report_service.payload.client.PaymentClientResponse;
import com.baentech.report_service.payload.client.ShippingClientResponse;
import com.baentech.report_service.payload.res.OrderReportResponse;
import com.baentech.report_service.payload.res.PaymentReportResponse;
import com.baentech.report_service.payload.res.ReportSummaryResponse;
import com.baentech.report_service.service.ReportService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService  
{
    private final WebClient.Builder webClientBuilder;

    @Override
    public ReportSummaryResponse getSummary(String token)
    {
        try {
            List<OrderClientResponse> orders = getOrdersFromOrderService(token);
            List<PaymentClientResponse> payments = getPaymentsFromPaymentService(token);
            List<ShippingClientResponse> shippings = getShippingsFromShippingService(token);
            
            Long totalOrders = (long) orders.size();

            Long totalPendingPaymentOrders = orders.stream()
                    .filter(order -> "PENDING_PAYMENT".equalsIgnoreCase(order.getStatus()))
                    .count();

            Long totalPaidOrders = orders.stream()
                    .filter(order -> "PAID".equalsIgnoreCase(order.getStatus()))
                    .count();

            Long totalCompletedOrders = orders.stream()
                    .filter(order -> "COMPLETED".equalsIgnoreCase(order.getStatus()))
                    .count();

            Long totalCancelledOrders = orders.stream()
                    .filter(order -> "CANCELLED".equalsIgnoreCase(order.getStatus()))
                    .count();

            Long totalPayments = (long) payments.size();

            Long totalSuccessPayments = payments.stream()
                    .filter(payment -> "SUCCESS".equalsIgnoreCase(payment.getStatus()))
                    .count();

            Long totalFailedPayments = payments.stream()
                    .filter(payment -> "FAILED".equalsIgnoreCase(payment.getStatus()))
                    .count();
            BigDecimal totalRevenue = payments.stream()
                    .filter(payment -> "SUCCESS".equalsIgnoreCase(payment.getStatus()))
                    .map(PaymentClientResponse::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Long totalShippings = (long) shippings.size();

            Long totalDeliveredShippings = shippings.stream()
                    .filter(shipping -> "DELIVERED".equalsIgnoreCase(shipping.getStatus()))
                    .count();

            Long totalReceivedShippings = shippings.stream()
                    .filter(shipping -> "RECEIVED".equalsIgnoreCase(shipping.getStatus()))
                    .count();

            return ReportSummaryResponse.builder()
                    .totalOrders(totalOrders)
                    .totalPendingPaymentOrders(totalPendingPaymentOrders)
                    .totalPaidOrders(totalPaidOrders)
                    .totalCompletedOrders(totalCompletedOrders)
                    .totalCancelledOrders(totalCancelledOrders)
                    .totalPayments(totalPayments)
                    .totalSuccessPayments(totalSuccessPayments)
                    .totalFailedPayments(totalFailedPayments)
                    .totalRevenue(totalRevenue)
                    .totalShippings(totalShippings)
                    .totalDeliveredShippings(totalDeliveredShippings)
                    .totalReceivedShippings(totalReceivedShippings)
                    .build();
        } catch (Exception e) {
            throw new RuntimeException("Gagal mengambil summary report : " + e.getMessage());
        }
    }

    @Override
    public List<OrderReportResponse> getOrderReports(String token, LocalDate startDate, LocalDate endDate) {
        try {
            List<OrderClientResponse> orders = getOrdersFromOrderService(token);

            return orders.stream()
                .filter(order -> isBetWeenDate(order.getCreatedAt(), startDate, endDate))
                .map(order -> OrderReportResponse.builder()
                        .orderId(order.getId())
                        .orderNumber(order.getOrderNumber())
                        .email(order.getEmail())
                        .recipientName(order.getRecipientName())
                        .city(order.getCity())
                        .province(order.getProvince())
                        .totalPrice(order.getTotalPrice())
                        .status(order.getStatus())
                        .createdAt(order.getCreatedAt())
                        .build())
                .toList();
        } catch (Exception e) {
            throw new RuntimeException("Gagal mengambil laporan order : " + e.getMessage());
        }
    }

    @Override
    public List<PaymentReportResponse> getPaymentReports(String token, LocalDate startDate, LocalDate endDate) {
        try {
            List<PaymentClientResponse> payments = getPaymentsFromPaymentService(token);

            return payments.stream()
                 .filter(payment -> isBetWeenDate(payment.getCreatedAt(), startDate, endDate))
                 .map(payment -> PaymentReportResponse.builder()
                         .paymentId(payment.getId())
                         .orderId(payment.getOrderId())
                         .paymentNumber(payment.getPaymentNumber())
                         .email(payment.getEmail())
                         .amount(payment.getAmount())
                         .paymentMethod(payment.getPaymentMethod())
                         .status(payment.getStatus())
                         .paidAt(payment.getPaidAt())
                         .createdAt(payment.getCreatedAt())
                         .build())
                 .toList();
        } catch (Exception e) {
            throw new RuntimeException("Gagal mengambil laporan payment : " + e.getMessage());
        }
    }
    @Override
    public byte[] exportOrderReportsToExcel(String token,LocalDate startDate,LocalDate endDate) {
        try {
            List<OrderReportResponse> orders = getOrderReports(token,startDate,endDate);

            Workbook workbook = new XSSFWorkbook();
            Sheet sheet = workbook.createSheet("Order Report");

            Row header = sheet.createRow(0);

            header.createCell(0).setCellValue("No");
            header.createCell(1).setCellValue("Order ID");
            header.createCell(2).setCellValue("Order Number");
            header.createCell(3).setCellValue("Email");
            header.createCell(4).setCellValue("Recipient Name");
            header.createCell(5).setCellValue("City");
            header.createCell(6).setCellValue("Province");
            header.createCell(7).setCellValue("Total Price");
            header.createCell(8).setCellValue("Status");
            header.createCell(9).setCellValue("Created At");

            int rowIndex = 1;
            int no = 1;

            for (OrderReportResponse order : orders) {
                Row row = sheet.createRow(rowIndex++);

                row.createCell(0).setCellValue(no++);
                row.createCell(1).setCellValue(order.getOrderId());
                row.createCell(2).setCellValue(order.getOrderNumber());
                row.createCell(3).setCellValue(order.getEmail());
                row.createCell(4).setCellValue(order.getRecipientName());
                row.createCell(5).setCellValue(order.getCity());
                row.createCell(6).setCellValue(order.getProvince());

                if (order.getTotalPrice() != null) {
                    row.createCell(7).setCellValue(order.getTotalPrice().doubleValue());
                } else {
                    row.createCell(7).setCellValue(0);
                }

                row.createCell(8).setCellValue(order.getStatus());

                if (order.getCreatedAt() != null) {
                    row.createCell(9).setCellValue(order.getCreatedAt().toString());
                }else {
                    row.createCell(9).setCellValue("-");
                }
            }

            for (int i = 0; i <= 9; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            workbook.close();

            return outputStream.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Gagal export laporan order ke Excel: " + e.getMessage());
        }
    }

    @Override
    public byte[] exportPaymentReportsToExcel(String token,LocalDate startDate,LocalDate endDate) {
        try {
            List<PaymentReportResponse> payments = getPaymentReports(token,startDate,endDate);

            Workbook workbook = new XSSFWorkbook();
            Sheet sheet = workbook.createSheet("Payment Report");

            Row header = sheet.createRow(0);

            header.createCell(0).setCellValue("No");
            header.createCell(1).setCellValue("Payment ID");
            header.createCell(2).setCellValue("Order ID");
            header.createCell(3).setCellValue("Payment Number");
            header.createCell(4).setCellValue("Email");
            header.createCell(5).setCellValue("Amount");
            header.createCell(6).setCellValue("Payment Method");
            header.createCell(7).setCellValue("Status");
            header.createCell(8).setCellValue("Paid At");
            header.createCell(9).setCellValue("Created At");

            int rowIndex = 1;
            int no = 1;

            for (PaymentReportResponse payment : payments) {
                Row row = sheet.createRow(rowIndex++);

                row.createCell(0).setCellValue(no++);
                row.createCell(1).setCellValue(payment.getPaymentId());
                row.createCell(2).setCellValue(payment.getOrderId());
                row.createCell(3).setCellValue(payment.getPaymentNumber());
                row.createCell(4).setCellValue(payment.getEmail());

                if (payment.getAmount() != null) {
                    row.createCell(5).setCellValue(payment.getAmount().doubleValue());
                } else {
                    row.createCell(5).setCellValue(0);
                }

                row.createCell(6).setCellValue(payment.getPaymentMethod());
                row.createCell(7).setCellValue(payment.getStatus());

                if (payment.getPaidAt() != null) {
                    row.createCell(8).setCellValue(payment.getPaidAt().toString());
                } else {
                    row.createCell(8).setCellValue("-");
                }

                if (payment.getCreatedAt() != null) {
                    row.createCell(9).setCellValue(payment.getCreatedAt().toString());
                } else {
                    row.createCell(9).setCellValue("-");
                }
            }

            for (int i = 0; i <= 9; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            workbook.close();

            return outputStream.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Gagal export laporan payment ke Excel: " + e.getMessage());
        }
    }
    
    private boolean isBetWeenDate(LocalDateTime createdAt,LocalDate startDate, LocalDate endDate) 
    {
        try {
            if (createdAt == null) {
                return false;
            }

            LocalDate createdDate = createdAt.toLocalDate();

            if (startDate != null && createdDate.isBefore(startDate)) {
                return false;
            }
            if (endDate != null && createdDate.isAfter(endDate)) {
                return false;
            }

            return true;


        } catch (Exception e) {
            throw new RuntimeException("Gagal filter tanggal: " + e.getMessage());
        }
        
    }

    private List<OrderClientResponse> getOrdersFromOrderService(String token) {
        try {
                return webClientBuilder.build()
                        .get()
                        .uri("http://ORDER-SERVICE/api/orders/admin")
                        .header("Authorization", token)
                        .retrieve()
                        .bodyToMono(new ParameterizedTypeReference<List<OrderClientResponse>>(){})
                        .block();
        } catch (Exception e) {
            throw new RuntimeException("Gagal mengambil data ORDER-SERVICE : " + e.getMessage());
        }

    }

    private List<PaymentClientResponse> getPaymentsFromPaymentService(String token) {
        try {
            return webClientBuilder.build()
                    .get()
                    .uri("http://PAYMENT-SERVICE/api/payments/admin")
                    .header("Authorization", token)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<List<PaymentClientResponse>>(){})
                    .block();
        } catch (Exception e) {
            throw new RuntimeException("Gagal mengambil data PAYMENT-SERVICE : " + e.getMessage());
        }
    }

    private List<ShippingClientResponse> getShippingsFromShippingService(String token) {
        try {
            return webClientBuilder.build()
                    .get()
                    .uri("http://SHIPING-SERIVE/api/shippings/admin")
                    .header("Authorization", token)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<List<ShippingClientResponse>>(){})
                    .block();
        } catch (Exception e) {
            throw new RuntimeException("Gagal mengambil data SHIPPING-SERVICE : " + e.getMessage());
        }
    }
}
