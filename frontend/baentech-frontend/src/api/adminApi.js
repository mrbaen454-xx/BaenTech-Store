import axios from "axios";

const productBaseUrl = import.meta.env.VITE_PRODUCT_API_BASE_URL;

const adminAxios = axios.create({
  baseURL: productBaseUrl,
});

adminAxios.interceptors.request.use(
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
  if (Array.isArray(body.data)) return body.data;
  if (Array.isArray(body.data?.content)) return body.data.content;
  if (Array.isArray(body.content)) return body.content;

  return [];
};

const normalizeObject = (body) => {
  if (body?.data) return body.data;
  return body;
};

export const getAdminProductsApi = async () => {
  const response = await adminAxios.get("/api/products");
  return normalizeList(response.data);
};

export const getAdminProductByIdApi = async (id) => {
  const response = await adminAxios.get(`/api/products/${id}`);
  return normalizeObject(response.data);
};

export const getAdminCategoriesApi = async () => {
  const response = await adminAxios.get("/api/categories");
  return normalizeList(response.data);
};

export const createAdminProductApi = async (productData) => {
  const response = await adminAxios.post("/api/products", productData);
  return normalizeObject(response.data);
};

export const updateAdminProductApi = async (id, productData) => {
  const response = await adminAxios.put(`/api/products/${id}`, productData);
  return normalizeObject(response.data);
};

export const deleteAdminProductApi = async (id) => {
  const response = await adminAxios.delete(`/api/products/${id}`);
  return response.data;
};

export const uploadAdminProductImageApi = async (id, file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await adminAxios.post(
    `/api/products/${id}/image`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return normalizeObject(response.data);
};
export const createAdminCategoryApi = async (categoryData) => {
  const response = await adminAxios.post("/api/categories", categoryData);
  return normalizeObject(response.data);
};

export const updateAdminCategoryApi = async (id, categoryData) => {
  const response = await adminAxios.put(`/api/categories/${id}`, categoryData);
  return normalizeObject(response.data);
};

export const deleteAdminCategoryApi = async (id) => {
  const response = await adminAxios.delete(`/api/categories/${id}`);
  return response.data;
};
