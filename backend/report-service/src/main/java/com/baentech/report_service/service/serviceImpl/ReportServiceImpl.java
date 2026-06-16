package com.baentech.report_service.service.serviceImpl;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.CreationHelper;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.VerticalAlignment;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.baentech.report_service.enums.IncomePeriod;
import com.baentech.report_service.payload.client.OrderClientResponse;
import com.baentech.report_service.payload.client.PaymentClientResponse;
import com.baentech.report_service.payload.client.ShippingClientResponse;
import com.baentech.report_service.payload.res.IncomeChartResponse;
import com.baentech.report_service.payload.res.OrderReportResponse;
import com.baentech.report_service.payload.res.PaymentReportResponse;
import com.baentech.report_service.payload.res.ReportSummaryResponse;
import com.baentech.report_service.service.ReportService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final WebClient.Builder webClientBuilder;

    @Override
    public ReportSummaryResponse getSummary(String token) {
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
                    .map(payment -> safeBigDecimal(payment.getAmount()))
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
    public byte[] exportOrderReportsToExcel(String token, LocalDate startDate, LocalDate endDate) {
        List<OrderReportResponse> orders = getOrderReports(token, startDate, endDate);

        try (Workbook workbook = new XSSFWorkbook();
                ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Order Report");

            CellStyle titleStyle = createTitleStyle(workbook);
            CellStyle subtitleStyle = createSubtitleStyle(workbook);
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle textStyle = createTextStyle(workbook);
            CellStyle centerStyle = createCenterStyle(workbook);
            CellStyle moneyStyle = createMoneyStyle(workbook);
            CellStyle dateStyle = createDateStyle(workbook);
            CellStyle statusStyle = createStatusStyle(workbook);
            CellStyle totalStyle = createTotalStyle(workbook);

            int rowIndex = 0;

            Row titleRow = sheet.createRow(rowIndex++);
            titleRow.setHeightInPoints(32);

            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("BAENTECH STORE - ORDER REPORT");
            titleCell.setCellStyle(titleStyle);

            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 9));
            applyMergedRegionStyle(sheet, 0, 0, 0, 9, titleStyle);

            Row subtitleRow = sheet.createRow(rowIndex++);
            subtitleRow.setHeightInPoints(24);

            Cell subtitleCell = subtitleRow.createCell(0);
            subtitleCell.setCellValue("Periode: " + formatPeriod(startDate, endDate));
            subtitleCell.setCellStyle(subtitleStyle);

            sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, 9));
            applyMergedRegionStyle(sheet, 1, 1, 0, 9, subtitleStyle);

            rowIndex++;

            Row headerRow = sheet.createRow(rowIndex++);
            headerRow.setHeightInPoints(25);

            String[] headers = {
                    "No",
                    "Order ID",
                    "Order Number",
                    "Email",
                    "Recipient Name",
                    "City",
                    "Province",
                    "Total Price",
                    "Status",
                    "Created At"
            };

            for (int i = 0; i < headers.length; i++) {
                createCell(headerRow, i, headers[i], headerStyle);
            }

            int no = 1;
            BigDecimal grandTotal = BigDecimal.ZERO;

            for (OrderReportResponse order : orders) {
                Row row = sheet.createRow(rowIndex++);
                row.setHeightInPoints(22);

                BigDecimal totalPrice = safeBigDecimal(order.getTotalPrice());
                grandTotal = grandTotal.add(totalPrice);

                createCell(row, 0, no++, centerStyle);
                createCell(row, 1, order.getOrderId(), centerStyle);
                createCell(row, 2, order.getOrderNumber(), textStyle);
                createCell(row, 3, order.getEmail(), textStyle);
                createCell(row, 4, order.getRecipientName(), textStyle);
                createCell(row, 5, order.getCity(), textStyle);
                createCell(row, 6, order.getProvince(), textStyle);
                createCell(row, 7, totalPrice.doubleValue(), moneyStyle);
                createCell(row, 8, order.getStatus(), statusStyle);
                createCell(row, 9, formatDateTime(order.getCreatedAt()), dateStyle);
            }

            rowIndex++;

            Row totalRow = sheet.createRow(rowIndex);
            totalRow.setHeightInPoints(25);

            createCell(totalRow, 6, "GRAND TOTAL", totalStyle);
            createCell(totalRow, 7, grandTotal.doubleValue(), moneyStyle);

            int lastDataRow = Math.max(3, rowIndex - 2);
            sheet.setAutoFilter(new CellRangeAddress(3, lastDataRow, 0, headers.length - 1));
            sheet.createFreezePane(0, 4);

            setColumnWidths(sheet, headers.length);

            workbook.write(outputStream);
            return outputStream.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Gagal export laporan order ke Excel: " + e.getMessage());
        }
    }

    @Override
    public byte[] exportPaymentReportsToExcel(String token, LocalDate startDate, LocalDate endDate) {
        List<PaymentReportResponse> payments = getPaymentReports(token, startDate, endDate);

        try (Workbook workbook = new XSSFWorkbook();
                ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Payment Report");

            CellStyle titleStyle = createTitleStyle(workbook);
            CellStyle subtitleStyle = createSubtitleStyle(workbook);
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle textStyle = createTextStyle(workbook);
            CellStyle centerStyle = createCenterStyle(workbook);
            CellStyle moneyStyle = createMoneyStyle(workbook);
            CellStyle dateStyle = createDateStyle(workbook);
            CellStyle statusStyle = createStatusStyle(workbook);
            CellStyle totalStyle = createTotalStyle(workbook);

            int rowIndex = 0;

            Row titleRow = sheet.createRow(rowIndex++);
            titleRow.setHeightInPoints(32);

            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("BAENTECH STORE - PAYMENT REPORT");
            titleCell.setCellStyle(titleStyle);

            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 9));
            applyMergedRegionStyle(sheet, 0, 0, 0, 9, titleStyle);

            Row subtitleRow = sheet.createRow(rowIndex++);
            subtitleRow.setHeightInPoints(24);

            Cell subtitleCell = subtitleRow.createCell(0);
            subtitleCell.setCellValue("Periode: " + formatPeriod(startDate, endDate));
            subtitleCell.setCellStyle(subtitleStyle);

            sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, 9));
            applyMergedRegionStyle(sheet, 1, 1, 0, 9, subtitleStyle);

            rowIndex++;

            Row headerRow = sheet.createRow(rowIndex++);
            headerRow.setHeightInPoints(25);

            String[] headers = {
                    "No",
                    "Payment ID",
                    "Order ID",
                    "Payment Number",
                    "Email",
                    "Amount",
                    "Payment Method",
                    "Status",
                    "Paid At",
                    "Created At"
            };

            for (int i = 0; i < headers.length; i++) {
                createCell(headerRow, i, headers[i], headerStyle);
            }

            int no = 1;
            BigDecimal grandTotal = BigDecimal.ZERO;

            for (PaymentReportResponse payment : payments) {
                Row row = sheet.createRow(rowIndex++);
                row.setHeightInPoints(22);

                BigDecimal amount = safeBigDecimal(payment.getAmount());

                if ("SUCCESS".equalsIgnoreCase(payment.getStatus())) {
                    grandTotal = grandTotal.add(amount);
                }

                createCell(row, 0, no++, centerStyle);
                createCell(row, 1, payment.getPaymentId(), centerStyle);
                createCell(row, 2, payment.getOrderId(), centerStyle);
                createCell(row, 3, payment.getPaymentNumber(), textStyle);
                createCell(row, 4, payment.getEmail(), textStyle);
                createCell(row, 5, amount.doubleValue(), moneyStyle);
                createCell(row, 6, payment.getPaymentMethod(), centerStyle);
                createCell(row, 7, payment.getStatus(), statusStyle);
                createCell(row, 8, formatDateTime(payment.getPaidAt()), dateStyle);
                createCell(row, 9, formatDateTime(payment.getCreatedAt()), dateStyle);
            }

            rowIndex++;

            Row totalRow = sheet.createRow(rowIndex);
            totalRow.setHeightInPoints(25);

            createCell(totalRow, 4, "TOTAL SUCCESS PAYMENT", totalStyle);
            createCell(totalRow, 5, grandTotal.doubleValue(), moneyStyle);

            int lastDataRow = Math.max(3, rowIndex - 2);
            sheet.setAutoFilter(new CellRangeAddress(3, lastDataRow, 0, headers.length - 1));
            sheet.createFreezePane(0, 4);

            setColumnWidths(sheet, headers.length);

            workbook.write(outputStream);
            return outputStream.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Gagal export laporan payment ke Excel: " + e.getMessage());
        }
    }

    private boolean isBetWeenDate(LocalDateTime createdAt, LocalDate startDate, LocalDate endDate) {
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
            List<OrderClientResponse> orders = webClientBuilder.build()
                    .get()
                    .uri("http://ORDER-SERVICE/api/orders/admin")
                    .header("Authorization", token)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<List<OrderClientResponse>>() {
                    })
                    .block();

            return orders == null ? List.of() : orders;
        } catch (Exception e) {
            throw new RuntimeException("Gagal mengambil data ORDER-SERVICE : " + e.getMessage());
        }
    }

    private List<PaymentClientResponse> getPaymentsFromPaymentService(String token) {
        try {
            List<PaymentClientResponse> payments = webClientBuilder.build()
                    .get()
                    .uri("http://PAYMENT-SERVICE/api/payments/admin")
                    .header("Authorization", token)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<List<PaymentClientResponse>>() {
                    })
                    .block();

            return payments == null ? List.of() : payments;
        } catch (Exception e) {
            throw new RuntimeException("Gagal mengambil data PAYMENT-SERVICE : " + e.getMessage());
        }
    }

    private List<ShippingClientResponse> getShippingsFromShippingService(String token) {
        try {
            List<ShippingClientResponse> shippings = webClientBuilder.build()
                    .get()
                    .uri("http://SHIPING-SERIVE/api/shippings/admin")
                    .header("Authorization", token)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<List<ShippingClientResponse>>() {
                    })
                    .block();

            return shippings == null ? List.of() : shippings;
        } catch (Exception e) {
            throw new RuntimeException("Gagal mengambil data SHIPPING-SERVICE : " + e.getMessage());
        }
    }

    @Override
    public List<IncomeChartResponse> getIncomeChart(String token, IncomePeriod period) {
        if (period == null) {
            period = IncomePeriod.WEEK;
        }

        LocalDate today = LocalDate.now();
        LocalDate startDate;
        LocalDate endDate;

        if (period == IncomePeriod.MONTH) {
            startDate = today.withDayOfMonth(1);
            endDate = today.withDayOfMonth(today.lengthOfMonth());
        } else if (period == IncomePeriod.YEAR) {
            startDate = today.withDayOfYear(1);
            endDate = today.withDayOfYear(today.lengthOfYear());
        } else {
            startDate = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            endDate = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
        }

        List<PaymentReportResponse> payments = getPaymentReports(token, startDate, endDate);

        return buildIncomeChart(period, payments);
    }

    private List<IncomeChartResponse> buildIncomeChart(
            IncomePeriod period,
            List<PaymentReportResponse> payments) {
        if (period == IncomePeriod.MONTH) {
            return buildMonthlyIncome(payments);
        }

        if (period == IncomePeriod.YEAR) {
            return buildYearlyIncome(payments);
        }

        return buildWeeklyIncome(payments);
    }

    private List<IncomeChartResponse> buildWeeklyIncome(List<PaymentReportResponse> payments) {
        Map<Integer, IncomeChartResponse> result = new LinkedHashMap<>();

        result.put(1, new IncomeChartResponse("Sen", BigDecimal.ZERO));
        result.put(2, new IncomeChartResponse("Sel", BigDecimal.ZERO));
        result.put(3, new IncomeChartResponse("Rab", BigDecimal.ZERO));
        result.put(4, new IncomeChartResponse("Kam", BigDecimal.ZERO));
        result.put(5, new IncomeChartResponse("Jum", BigDecimal.ZERO));
        result.put(6, new IncomeChartResponse("Sab", BigDecimal.ZERO));
        result.put(7, new IncomeChartResponse("Min", BigDecimal.ZERO));

        for (PaymentReportResponse payment : payments) {
            if (!isSuccessPayment(payment)) {
                continue;
            }

            LocalDate paymentDate = getPaymentDate(payment);

            if (paymentDate == null) {
                continue;
            }

            int dayNumber = paymentDate.getDayOfWeek().getValue();
            addIncome(result.get(dayNumber), payment.getAmount());
        }

        return new ArrayList<>(result.values());
    }

    private List<IncomeChartResponse> buildMonthlyIncome(List<PaymentReportResponse> payments) {
        Map<Integer, IncomeChartResponse> result = new LinkedHashMap<>();

        result.put(1, new IncomeChartResponse("M1", BigDecimal.ZERO));
        result.put(2, new IncomeChartResponse("M2", BigDecimal.ZERO));
        result.put(3, new IncomeChartResponse("M3", BigDecimal.ZERO));
        result.put(4, new IncomeChartResponse("M4", BigDecimal.ZERO));
        result.put(5, new IncomeChartResponse("M5", BigDecimal.ZERO));

        for (PaymentReportResponse payment : payments) {
            if (!isSuccessPayment(payment)) {
                continue;
            }

            LocalDate paymentDate = getPaymentDate(payment);

            if (paymentDate == null) {
                continue;
            }

            int weekNumber = (int) Math.ceil(paymentDate.getDayOfMonth() / 7.0);

            if (weekNumber < 1) {
                weekNumber = 1;
            }

            if (weekNumber > 5) {
                weekNumber = 5;
            }

            addIncome(result.get(weekNumber), payment.getAmount());
        }

        return new ArrayList<>(result.values());
    }

    private List<IncomeChartResponse> buildYearlyIncome(List<PaymentReportResponse> payments) {
        Map<Integer, IncomeChartResponse> result = new LinkedHashMap<>();

        result.put(1, new IncomeChartResponse("Jan", BigDecimal.ZERO));
        result.put(2, new IncomeChartResponse("Feb", BigDecimal.ZERO));
        result.put(3, new IncomeChartResponse("Mar", BigDecimal.ZERO));
        result.put(4, new IncomeChartResponse("Apr", BigDecimal.ZERO));
        result.put(5, new IncomeChartResponse("Mei", BigDecimal.ZERO));
        result.put(6, new IncomeChartResponse("Jun", BigDecimal.ZERO));
        result.put(7, new IncomeChartResponse("Jul", BigDecimal.ZERO));
        result.put(8, new IncomeChartResponse("Agu", BigDecimal.ZERO));
        result.put(9, new IncomeChartResponse("Sep", BigDecimal.ZERO));
        result.put(10, new IncomeChartResponse("Okt", BigDecimal.ZERO));
        result.put(11, new IncomeChartResponse("Nov", BigDecimal.ZERO));
        result.put(12, new IncomeChartResponse("Des", BigDecimal.ZERO));

        for (PaymentReportResponse payment : payments) {
            if (!isSuccessPayment(payment)) {
                continue;
            }

            LocalDate paymentDate = getPaymentDate(payment);

            if (paymentDate == null) {
                continue;
            }

            int monthNumber = paymentDate.getMonthValue();
            addIncome(result.get(monthNumber), payment.getAmount());
        }

        return new ArrayList<>(result.values());
    }

    private boolean isSuccessPayment(PaymentReportResponse payment) {
        if (payment == null || payment.getStatus() == null) {
            return false;
        }

        String status = payment.getStatus().toUpperCase();

        return status.equals("SUCCESS")
                || status.equals("PAID")
                || status.equals("COMPLETED");
    }

    private LocalDate getPaymentDate(PaymentReportResponse payment) {
        LocalDateTime paymentDateTime = payment.getPaidAt();

        if (paymentDateTime == null) {
            paymentDateTime = payment.getCreatedAt();
        }

        if (paymentDateTime == null) {
            return null;
        }

        return paymentDateTime.toLocalDate();
    }

    private void addIncome(IncomeChartResponse response, BigDecimal amount) {
        if (response == null || amount == null) {
            return;
        }

        response.setValue(response.getValue().add(amount));
    }

    private CellStyle createTitleStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();

        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 16);
        font.setColor(IndexedColors.WHITE.getIndex());

        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);

        setThinBorder(style);

        return style;
    }

    private CellStyle createSubtitleStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();

        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 11);
        font.setColor(IndexedColors.DARK_BLUE.getIndex());

        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.PALE_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);

        setThinBorder(style);

        return style;
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();

        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());

        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.ROYAL_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);

        setThinBorder(style);

        return style;
    }

    private CellStyle createTextStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();

        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setWrapText(true);

        setThinBorder(style);

        return style;
    }

    private CellStyle createCenterStyle(Workbook workbook) {
        CellStyle style = createTextStyle(workbook);
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }

    private CellStyle createMoneyStyle(Workbook workbook) {
        CellStyle style = createTextStyle(workbook);

        CreationHelper creationHelper = workbook.getCreationHelper();
        style.setDataFormat(creationHelper.createDataFormat().getFormat("\"Rp\" #,##0"));
        style.setAlignment(HorizontalAlignment.RIGHT);

        return style;
    }

    private CellStyle createDateStyle(Workbook workbook) {
        CellStyle style = createTextStyle(workbook);
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }

    private CellStyle createStatusStyle(Workbook workbook) {
        CellStyle style = createTextStyle(workbook);

        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.DARK_BLUE.getIndex());

        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setFillForegroundColor(IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        return style;
    }

    private CellStyle createTotalStyle(Workbook workbook) {
        CellStyle style = createHeaderStyle(workbook);
        style.setAlignment(HorizontalAlignment.RIGHT);
        return style;
    }

    private void setThinBorder(CellStyle style) {
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);

        style.setTopBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setRightBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setBottomBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setLeftBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
    }

    private void createCell(Row row, int column, Object value, CellStyle style) {
        Cell cell = row.createCell(column);

        if (value == null) {
            cell.setCellValue("-");
        } else if (value instanceof Number number) {
            cell.setCellValue(number.doubleValue());
        } else {
            cell.setCellValue(String.valueOf(value));
        }

        cell.setCellStyle(style);
    }

    private void applyMergedRegionStyle(
            Sheet sheet,
            int firstRow,
            int lastRow,
            int firstColumn,
            int lastColumn,
            CellStyle style) {
        for (int rowIndex = firstRow; rowIndex <= lastRow; rowIndex++) {
            Row row = sheet.getRow(rowIndex);

            if (row == null) {
                row = sheet.createRow(rowIndex);
            }

            for (int columnIndex = firstColumn; columnIndex <= lastColumn; columnIndex++) {
                Cell cell = row.getCell(columnIndex);

                if (cell == null) {
                    cell = row.createCell(columnIndex);
                }

                cell.setCellStyle(style);
            }
        }
    }

    private void setColumnWidths(Sheet sheet, int totalColumns) {
        for (int i = 0; i < totalColumns; i++) {
            sheet.autoSizeColumn(i);

            int currentWidth = sheet.getColumnWidth(i);
            int newWidth = Math.min(currentWidth + 1200, 10000);

            sheet.setColumnWidth(i, newWidth);
        }
    }

    private BigDecimal safeBigDecimal(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String formatDateTime(LocalDateTime value) {
        if (value == null) {
            return "-";
        }

        return value.format(DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm"));
    }

    private String formatPeriod(LocalDate startDate, LocalDate endDate) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM yyyy");

        if (startDate == null && endDate == null) {
            return "Semua Data";
        }

        if (startDate != null && endDate != null) {
            return startDate.format(formatter) + " - " + endDate.format(formatter);
        }

        if (startDate != null) {
            return "Mulai " + startDate.format(formatter);
        }

        return "Sampai " + endDate.format(formatter);
    }
}
