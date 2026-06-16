import axios from "axios";

const orderBaseUrl =
  import.meta.env.VITE_ORDER_API_BASE_URL || import.meta.env.VITE_API_BASE_URL;

const orderAxios = axios.create({
  baseURL: orderBaseUrl,
});

orderAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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

  return [];
};

const normalizeObject = (body) => {
  if (body?.data) return body.data;
  return body;
};

export const getAdminOrdersApi = async () => {
  const endpoints = ["/api/orders/admin", "/api/orders", "/api/orders/all"];

  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const response = await orderAxios.get(endpoint);
      return normalizeList(response.data);
    } catch (err) {
      lastError = err;

      if (err.response && err.response.status !== 404) {
        throw err;
      }
    }
  }

  throw lastError;
};

export const getAdminOrderByIdApi = async (id) => {
  const endpoints = [`/api/orders/admin/${id}`, `/api/orders/${id}`];

  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const response = await orderAxios.get(endpoint);
      return normalizeObject(response.data);
    } catch (err) {
      lastError = err;

      if (err.response && err.response.status !== 404) {
        throw err;
      }
    }
  }

  throw lastError;
};
