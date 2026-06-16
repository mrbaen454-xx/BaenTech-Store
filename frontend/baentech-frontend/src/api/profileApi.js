import axios from "axios";

const userBaseUrl =
  import.meta.env.VITE_USER_API_BASE_URL || import.meta.env.VITE_API_BASE_URL;

const profileAxios = axios.create({
  baseURL: userBaseUrl,
});

profileAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

const normalizeObject = (body) => {
  if (body?.data) return body.data;
  return body;
};

export const getAdminProfileApi = async () => {
  const response = await profileAxios.get("/api/users/profile");
  return normalizeObject(response.data);
};

export const updateAdminProfileApi = async (profileData) => {
  const response = await profileAxios.put("/api/users/profile", profileData);
  return normalizeObject(response.data);
};

export const createOrUpdateAdminProfileApi = async (profileData) => {
  const response = await profileAxios.post("/api/users/profile", profileData);
  return normalizeObject(response.data);
};
