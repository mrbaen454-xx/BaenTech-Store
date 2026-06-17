import axios from "axios";

const productAxios = axios.create({
  baseURL:
    import.meta.env.VITE_PRODUCT_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "",
});

productAxios.interceptors.request.use(
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

  return [];
};

const normalizeObject = (body) => {
  if (body?.data) return body.data;
  return body || {};
};

export const getProductsApi = async () => {
  const response = await productAxios.get("/api/products");
  return normalizeList(response.data);
};

export const getProductByIdApi = async (id) => {
  const response = await productAxios.get(`/api/products/${id}`);
  return normalizeObject(response.data);
};

export const getProductReviewsApi = async (productId) => {
  const response = await productAxios.get(`/api/products/${productId}/reviews`);
  return normalizeList(response.data);
};

export const getProductReviewSummaryApi = async (productId) => {
  const response = await productAxios.get(
    `/api/products/${productId}/reviews/summary`,
  );
  return normalizeObject(response.data);
};

export const createOrUpdateProductReviewApi = async (productId, payload) => {
  const response = await productAxios.post(
    `/api/products/${productId}/reviews`,
    payload,
  );
  return normalizeObject(response.data);
};

export const deleteProductReviewApi = async (reviewId) => {
  const response = await productAxios.delete(`/api/products/reviews/${reviewId}`);
  return normalizeObject(response.data);
};

export default productAxios;
