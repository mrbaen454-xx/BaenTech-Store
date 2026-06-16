import axios from "axios";

const reportBaseUrl =
  import.meta.env.VITE_REPORT_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "";

const reportAxios = axios.create({
  baseURL: reportBaseUrl,
});

reportAxios.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("jwt") ||
      localStorage.getItem("authToken");

    if (token) {
      const cleanToken = token.startsWith("Bearer ")
        ? token.replace("Bearer ", "")
        : token;

      config.headers.Authorization = `Bearer ${cleanToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

const normalizeList = (body) => {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.data?.content)) return body.data.content;
  if (Array.isArray(body?.content)) return body.content;
  if (Array.isArray(body?.result)) return body.result;
  if (Array.isArray(body?.reports)) return body.reports;
  if (Array.isArray(body?.orders)) return body.orders;
  if (Array.isArray(body?.payments)) return body.payments;

  return [];
};

const normalizeObject = (body) => {
  if (body?.data) return body.data;
  return body || {};
};

const buildDateParams = (startDate, endDate) => {
  const params = {};

  if (startDate) {
    params.startDate = startDate;
  }

  if (endDate) {
    params.endDate = endDate;
  }

  return params;
};

export const getReportSummaryApi = async () => {
  const response = await reportAxios.get("/api/reports/summary");
  return normalizeObject(response.data);
};

export const getOrderReportsApi = async ({ startDate, endDate } = {}) => {
  const response = await reportAxios.get("/api/reports/orders", {
    params: buildDateParams(startDate, endDate),
  });

  return normalizeList(response.data);
};

export const getPaymentReportsApi = async ({ startDate, endDate } = {}) => {
  const response = await reportAxios.get("/api/reports/payments", {
    params: buildDateParams(startDate, endDate),
  });

  return normalizeList(response.data);
};

// Nama lama tetap dipakai supaya code yang sudah ada tidak error
export const getIncomeChartApi = async (period = "WEEK") => {
  const response = await reportAxios.get("/api/reports/income", {
    params: {
      period,
    },
  });

  return normalizeList(response.data);
};

// Alias kalau nanti di AdminReports mau pakai nama ini
export const getIncomeReportsApi = getIncomeChartApi;

export const exportOrderReportExcelApi = async ({
  startDate,
  endDate,
} = {}) => {
  const response = await reportAxios.get("/api/reports/orders/export-excel", {
    params: buildDateParams(startDate, endDate),
    responseType: "blob",
  });

  downloadBlob(response.data, "order-report.xlsx");
};

export const exportPaymentReportExcelApi = async ({
  startDate,
  endDate,
} = {}) => {
  const response = await reportAxios.get("/api/reports/payments/export-excel", {
    params: buildDateParams(startDate, endDate),
    responseType: "blob",
  });

  downloadBlob(response.data, "payment-report.xlsx");
};

const downloadBlob = (blobData, fileName) => {
  const blob = new Blob([blobData], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.setAttribute("download", fileName);

  document.body.appendChild(link);
  link.click();

  link.remove();
  window.URL.revokeObjectURL(url);
};

export default reportAxios;
