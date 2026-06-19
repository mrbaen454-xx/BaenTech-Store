import axios from "axios";

const paymentBaseUrl =
  import.meta.env.VITE_PAYMENT_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "";

const paymentAxios = axios.create({
  baseURL: paymentBaseUrl,
});

paymentAxios.interceptors.request.use(
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
  if (Array.isArray(body?.payments)) return body.payments;
  if (Array.isArray(body?.data?.payments)) return body.data.payments;
  if (Array.isArray(body?.result)) return body.result;

  return [];
};

const normalizeObject = (body) => {
  if (body?.data) return body.data;
  return body;
};

export const getAdminPaymentsApi = async () => {
  const response = await paymentAxios.get("/api/payments/admin");
  return normalizeList(response.data);
};

export const getPaymentByIdApi = async (paymentId) => {
  const response = await paymentAxios.get(`/api/payments/${paymentId}`);
  return normalizeObject(response.data);
};

export const getMyPaymentsApi = async () => {
  const response = await paymentAxios.get("/api/payments/my-payments");
  return normalizeList(response.data);
};

export const createMidtransPaymentApi = async (payload) => {
  const response = await paymentAxios.post("/api/payments/midtrans/create", {
    orderId: Number(payload.orderId),
    paymentMethod: payload.paymentMethod,
  });

  return response.data?.data || response.data;
};

export const getPaymentByOrderIdApi = async (orderId) => {
  const response = await paymentAxios.get(`/api/payments/order/${orderId}`);

  return response.data?.data || response.data;
};

export const createPaymentApi = async (payload) => {
  const response = await paymentAxios.post("/api/payments/create", {
    orderId: Number(payload.orderId),
    paymentMethod: payload.paymentMethod,
  });

  return response.data?.data || response.data;
};

export const paymentSuccessApi = async (paymentId) => {
  const response = await paymentAxios.put(`/api/payments/${paymentId}/success`);
  return normalizeObject(response.data);
};

export const paymentFailedApi = async (paymentId) => {
  const response = await paymentAxios.put(`/api/payments/${paymentId}/failed`);
  return normalizeObject(response.data);
};

export const createXenditPaymentApi = async (payload) => {
  const response = await paymentAxios.post("/api/payments/xendit/create", {
    orderId: Number(payload.orderId),
    paymentMethod: payload.paymentMethod,
  });

  return response.data?.data || response.data;
};

// Alias supaya halaman lama yang pakai nama markPaymentSuccessApi tetap aman
export const markPaymentSuccessApi = paymentSuccessApi;
export const markPaymentFailedApi = paymentFailedApi;

export default paymentAxios;
