import axios from "axios";

const orderBaseUrl =
  import.meta.env.VITE_ORDER_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "";

const orderAxios = axios.create({
  baseURL: orderBaseUrl,
});

orderAxios.interceptors.request.use(
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
  if (Array.isArray(body?.orders)) return body.orders;
  if (Array.isArray(body?.data?.orders)) return body.data.orders;
  if (Array.isArray(body?.result)) return body.result;

  return [];
};

const normalizeObject = (body) => {
  if (body?.data) return body.data;
  return body;
};

export const getAdminOrdersApi = async () => {
  const response = await orderAxios.get("/api/orders/admin");
  return normalizeList(response.data);
};

export const getAdminOrderByIdApi = async (orderId) => {
  const response = await orderAxios.get(`/api/orders/${orderId}`);
  return normalizeObject(response.data);
};

export const updateAdminOrderStatusApi = async (orderId, status) => {
  const response = await orderAxios.put(`/api/orders/${orderId}/status`, {
    status,
  });

  return normalizeObject(response.data);
};

export const getMyOrdersApi = async () => {
  const response = await orderAxios.get("/api/orders/my-orders");
  return normalizeList(response.data);
};

export const getOrderByIdApi = async (orderId) => {
  const response = await orderAxios.get(`/api/orders/${orderId}`);
  return normalizeObject(response.data);
};

export const checkoutApi = async (payload) => {
  const response = await orderAxios.post("/api/orders/checkout", payload);
  return normalizeObject(response.data);
};

export const cancelOrderApi = async (orderId) => {
  const response = await orderAxios.put(`/api/orders/${orderId}/cancel`);
  return normalizeObject(response.data);
};

export const completeOrderApi = async (orderId) => {
  const response = await orderAxios.put(`/api/orders/${orderId}/complete`);
  return normalizeObject(response.data);
};

export default orderAxios;
