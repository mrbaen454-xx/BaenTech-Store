import axios from "axios";

const productBaseUrl =
  import.meta.env.VITE_PRODUCT_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "";

const productAxios = axios.create({
  baseURL: productBaseUrl,
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
  if (Array.isArray(body?.content)) return body.content;
  if (Array.isArray(body?.products)) return body.products;
  if (Array.isArray(body?.result)) return body.result;

  return [];
};

const normalizeObject = (body) => {
  if (body?.data) return body.data;
  return body || {};
};

export const getUserProductsApi = async () => {
  const response = await productAxios.get("/api/products");
  return normalizeList(response.data);
};

export const getUserProductByIdApi = async (productId) => {
  const response = await productAxios.get(`/api/products/${productId}`);
  return normalizeObject(response.data);
};

export const searchUserProductsApi = async (keyword) => {
  const response = await productAxios.get("/api/products/search", {
    params: { keyword },
  });

  return normalizeList(response.data);
};

export const getUserProductsByCategoryApi = async (categoryId) => {
  const response = await productAxios.get(
    `/api/products/category/${categoryId}`,
  );
  return normalizeList(response.data);
};

export const getUserProductsByBrandApi = async (brand) => {
  const response = await productAxios.get(`/api/products/brand/${brand}`);
  return normalizeList(response.data);
};

export const getUserCategoriesApi = async () => {
  const response = await productAxios.get("/api/categories");
  return normalizeList(response.data);
};

export default productAxios;
