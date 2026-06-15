import axios from "axios";

const productAxios = axios.create({
  baseURL: import.meta.env.VITE_PRODUCT_API_BASE_URL,
});

productAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

export const getProductsApi = async () => {
  const response = await productAxios.get("/api/products");

  const body = response.data;

  if (Array.isArray(body)) {
    return body;
  }

  if (Array.isArray(body.data)) {
    return body.data;
  }

  if (Array.isArray(body.data?.content)) {
    return body.data.content;
  }

  if (Array.isArray(body.content)) {
    return body.content;
  }

  return [];
};

export const getProductByIdApi = async (id) => {
  const response = await productAxios.get(`/api/products/${id}`);

  return response.data?.data || response.data;
};
