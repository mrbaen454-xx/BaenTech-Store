import axios from "axios";

const paymentBaseUrl =
  import.meta.env.VITE_PAYMENT_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL;

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

export const getPaymentByIdApi = async (id) => {
  const response = await paymentAxios.get(`/api/payments/${id}`);
  return normalizeObject(response.data);
};

export const markPaymentSuccessApi = async (id) => {
  const response = await paymentAxios.put(`/api/payments/${id}/success`);
  return normalizeObject(response.data);
};

export const markPaymentFailedApi = async (id) => {
  const response = await paymentAxios.put(`/api/payments/${id}/failed`);
  return normalizeObject(response.data);
};
