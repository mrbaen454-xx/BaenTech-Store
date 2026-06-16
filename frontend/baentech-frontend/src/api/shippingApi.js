import axios from "axios";

const shippingBaseUrl =
  import.meta.env.VITE_SHIPPING_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "";

const shippingAxios = axios.create({
  baseURL: shippingBaseUrl,
});

shippingAxios.interceptors.request.use(
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
  if (Array.isArray(body?.shippings)) return body.shippings;
  if (Array.isArray(body?.data?.shippings)) return body.data.shippings;
  if (Array.isArray(body?.result)) return body.result;

  return [];
};

const normalizeObject = (body) => {
  if (body?.data) return body.data;
  return body;
};

export const getAdminShippingsApi = async () => {
  const endpoints = [
    "/api/shippings/admin",
    "/api/shippings",
    "/api/shipping/admin",
    "/api/shipping",
  ];

  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const response = await shippingAxios.get(endpoint);
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

export const getShippingByIdApi = async (shippingId) => {
  const endpoints = [
    `/api/shippings/${shippingId}`,
    `/api/shipping/${shippingId}`,
  ];

  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const response = await shippingAxios.get(endpoint);
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

export const createShippingApi = async (payload) => {
  const endpoints = [
    "/api/shippings",
    "/api/shipping",
    "/api/shippings/create",
  ];

  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const response = await shippingAxios.post(endpoint, payload);
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

export const updateShippingStatusApi = async (shippingId, status) => {
  const endpoints = [
    `/api/shippings/${shippingId}/status`,
    `/api/shipping/${shippingId}/status`,
  ];

  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const response = await shippingAxios.put(endpoint, { status });
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

export const markShippingShippedApi = async (shippingId) => {
  const endpoints = [
    `/api/shippings/${shippingId}/shipped`,
    `/api/shipping/${shippingId}/shipped`,
  ];

  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const response = await shippingAxios.put(endpoint);
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

export const markShippingDeliveredApi = async (shippingId) => {
  const endpoints = [
    `/api/shippings/${shippingId}/delivered`,
    `/api/shipping/${shippingId}/delivered`,
  ];

  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const response = await shippingAxios.put(endpoint);
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

export default shippingAxios;
