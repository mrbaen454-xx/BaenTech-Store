import axios from "axios";

const userBaseUrl =
  import.meta.env.VITE_USER_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "";

const userAxios = axios.create({
  baseURL: userBaseUrl,
});

userAxios.interceptors.request.use(
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

const normalizeObject = (body) => {
  if (body?.data) return body.data;
  return body || {};
};

const normalizeList = (body) => {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.content)) return body.content;
  if (Array.isArray(body?.result)) return body.result;
  if (Array.isArray(body?.addresses)) return body.addresses;

  return [];
};

export const getMyProfileApi = async () => {
  const response = await userAxios.get("/api/users/profile");
  return normalizeObject(response.data);
};

export const createOrUpdateProfileApi = async (payload) => {
  const response = await userAxios.post("/api/users/profile", payload);
  return normalizeObject(response.data);
};

export const updateProfileApi = async (payload) => {
  const response = await userAxios.put("/api/users/profile", payload);
  return normalizeObject(response.data);
};

export const getMyAddressesApi = async () => {
  const response = await userAxios.get("/api/addresses");
  return normalizeList(response.data);
};

export const getAddressByIdApi = async (addressId) => {
  const response = await userAxios.get(`/api/addresses/${addressId}`);
  return normalizeObject(response.data);
};

export const createAddressApi = async (payload) => {
  const response = await userAxios.post("/api/addresses", payload);
  return normalizeObject(response.data);
};

export const updateAddressApi = async (addressId, payload) => {
  const response = await userAxios.put(`/api/addresses/${addressId}`, payload);
  return normalizeObject(response.data);
};

export const deleteAddressApi = async (addressId) => {
  const response = await userAxios.delete(`/api/addresses/${addressId}`);
  return normalizeObject(response.data);
};

export const setMainAddressApi = async (addressId) => {
  const response = await userAxios.put(`/api/addresses/${addressId}/main`);
  return normalizeObject(response.data);
};

export default userAxios;
