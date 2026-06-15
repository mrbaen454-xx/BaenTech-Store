import axios from "axios";

const authBaseUrl = import.meta.env.VITE_API_BASE_URL;

const publicAuthAxios = axios.create({
  baseURL: authBaseUrl,
});

export const loginApi = async (email, password) => {
  const response = await publicAuthAxios.post("/api/auth/login", {
    email,
    password,
  });

  return response.data;
};

export const registerApi = async (userData) => {
  const response = await publicAuthAxios.post("/api/auth/register", userData);

  return response.data;
};
