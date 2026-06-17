import { createContext, useContext, useState } from "react";
import { loginApi } from "../api/authApi";

const AuthContext = createContext();

const normalizeRole = (role) => {
  if (!role) return "";

  if (Array.isArray(role)) {
    const firstRole = role[0];

    if (typeof firstRole === "string") {
      return normalizeRole(firstRole);
    }

    return normalizeRole(firstRole?.authority || firstRole?.role || firstRole?.name || "");
  }

  if (typeof role === "object") {
    return normalizeRole(role.authority || role.role || role.name || "");
  }

  return String(role).replace("ROLE_", "").trim().toUpperCase();
};

const decodeJwtPayload = (token) => {
  try {
    if (!token) return {};

    const cleanToken = token.startsWith("Bearer ")
      ? token.replace("Bearer ", "")
      : token;

    const base64Url = cleanToken.split(".")[1];

    if (!base64Url) return {};

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(""),
    );

    return JSON.parse(jsonPayload);
  } catch {
    return {};
  }
};

const getRoleFromToken = (token) => {
  const payload = decodeJwtPayload(token);

  return normalizeRole(
    payload.role || payload.roles || payload.authority || payload.authorities || "",
  );
};

const getTokenFromStorage = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("jwt") ||
    localStorage.getItem("authToken") ||
    ""
  );
};

const getSavedUser = () => {
  try {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    return null;
  }
};

const clearAuthStorage = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("jwt");
  localStorage.removeItem("authToken");
  localStorage.removeItem("role");
  localStorage.removeItem("user");
  localStorage.removeItem("adminProfile");
  localStorage.removeItem("userProfile");
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(getTokenFromStorage());
  const [user, setUser] = useState(getSavedUser());

  const login = async (email, password) => {
    clearAuthStorage();

    const data = await loginApi(email, password);
    const body = data?.data || data || {};

    const loginToken =
      body.token ||
      body.jwt ||
      body.accessToken ||
      data?.token ||
      data?.jwt ||
      data?.accessToken ||
      "";

    if (!loginToken) {
      throw new Error("Token tidak ditemukan dari response backend");
    }

    const cleanToken = loginToken.startsWith("Bearer ")
      ? loginToken.replace("Bearer ", "")
      : loginToken;

    const roleFromToken = getRoleFromToken(cleanToken);
    const roleFromResponse = normalizeRole(
      body.role ||
        body.roles ||
        body.authority ||
        body.authorities ||
        body.user?.role ||
        body.user?.roles ||
        data?.role ||
        data?.roles ||
        "",
    );

    const finalRole = normalizeRole(roleFromToken || roleFromResponse || "USER");

    const loginUser = {
      ...(body.user || {}),
      email: body.email || body.user?.email || data?.email || email,
      role: finalRole,
      name:
        body.name ||
        body.fullName ||
        body.nama ||
        body.user?.name ||
        body.user?.fullName ||
        body.user?.nama ||
        data?.name ||
        email,
    };

    localStorage.setItem("token", cleanToken);
    localStorage.setItem("role", finalRole);
    localStorage.setItem("user", JSON.stringify(loginUser));

    setToken(cleanToken);
    setUser(loginUser);

    return loginUser;
  };

  const logout = () => {
    clearAuthStorage();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        logout,
        isAuthenticated: Boolean(token),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
