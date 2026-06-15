import axios from "axios";

const reportBaseUrl = import.meta.env.VITE_REPORT_API_BASE_URL;

const reportAxios = axios.create({
  baseURL: reportBaseUrl,
});

reportAxios.interceptors.request.use(
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

export const getIncomeChartApi = async (period) => {
  const response = await reportAxios.get("/api/reports/income", {
    params: {
      period,
    },
  });

  return normalizeList(response.data);
};
