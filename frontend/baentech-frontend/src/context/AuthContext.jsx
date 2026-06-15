import { createContext, useContext, useState } from "react";
import { loginApi } from "../api/authApi";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = async (email, password) => {
    const data = await loginApi(email, password);

    const loginToken =
      data.token || data.jwt || data.accessToken || data.data?.token;

    const loginUser = {
      email: data.email || data.data?.email || email,
      role: data.role || data.data?.role || "ADMIN",
      name: data.name || data.nama || data.data?.name || "Admin",
    };

    if (!loginToken) {
      throw new Error("Token tidak ditemukan dari response backend");
    }

    localStorage.setItem("token", loginToken);
    localStorage.setItem("user", JSON.stringify(loginUser));

    setToken(loginToken);
    setUser(loginUser);

    return loginUser;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

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
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
