import axios from "axios";

const cartBaseUrl =
  import.meta.env.VITE_CART_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "";

const cartAxios = axios.create({
  baseURL: cartBaseUrl,
});

cartAxios.interceptors.request.use(
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
  if (body?.result) return body.result;
  return body || {};
};

const normalizeItems = (cart) => {
  if (Array.isArray(cart?.items)) return cart.items;
  if (Array.isArray(cart?.cartItems)) return cart.cartItems;
  if (Array.isArray(cart?.data?.items)) return cart.data.items;
  return [];
};

const normalizeCart = (body) => {
  const cart = normalizeObject(body);
  const items = normalizeItems(cart);

  const totalItems =
    cart.totalItems ??
    items.reduce((total, item) => total + Number(item.quantity || 0), 0);

  const totalPrice =
    cart.totalPrice ??
    items.reduce((total, item) => total + Number(item.subTotal || 0), 0);

  return {
    ...cart,
    items,
    totalItems: Number(totalItems || 0),
    totalPrice: Number(totalPrice || 0),
  };
};

export const getMyCartApi = async () => {
  const response = await cartAxios.get("/api/carts");
  return normalizeCart(response.data);
};

export const addCartItemApi = async (productId, quantity = 1) => {
  const response = await cartAxios.post("/api/carts/items", {
    productId: Number(productId),
    quantity: Number(quantity),
  });

  return normalizeCart(response.data);
};

export const updateCartItemApi = async (itemId, quantity) => {
  const response = await cartAxios.put(`/api/carts/items/${itemId}`, {
    quantity: Number(quantity),
  });

  return normalizeCart(response.data);
};

export const deleteCartItemApi = async (itemId) => {
  const response = await cartAxios.delete(`/api/carts/items/${itemId}`);
  return normalizeObject(response.data);
};

export const clearCartApi = async () => {
  const response = await cartAxios.delete("/api/carts/clear");
  return normalizeObject(response.data);
};

export default cartAxios;
