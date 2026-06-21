import { createContext, useCallback, useContext, useEffect, useState } from "react";
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

const cleanBearerToken = (token) => {
  if (!token) return "";

  return token.startsWith("Bearer ") ? token.replace("Bearer ", "") : token;
};

const buildUserFromSession = (token, existingUser = null, fallbackUser = {}) => {
  const payload = decodeJwtPayload(token);
  const role = normalizeRole(
    getRoleFromToken(token) ||
      existingUser?.role ||
      fallbackUser?.role ||
      localStorage.getItem("role") ||
      "USER",
  );

  const email =
    fallbackUser?.email ||
    existingUser?.email ||
    payload.email ||
    payload.sub ||
    "";

  const name =
    fallbackUser?.name ||
    fallbackUser?.fullName ||
    fallbackUser?.nama ||
    existingUser?.name ||
    existingUser?.fullName ||
    existingUser?.nama ||
    payload.name ||
    payload.fullName ||
    payload.nama ||
    email ||
    "User";

  return {
    ...(existingUser || {}),
    ...(fallbackUser || {}),
    email,
    role,
    name,
  };
};

const saveAuthSession = (token, user) => {
  localStorage.setItem("token", token);
  localStorage.setItem("role", user?.role || "USER");
  localStorage.setItem("user", JSON.stringify(user || null));
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(getTokenFromStorage());
  const [user, setUser] = useState(getSavedUser());

  const setSessionFromToken = useCallback((incomingToken, fallbackUser = {}) => {
    const cleanToken = cleanBearerToken(incomingToken);

    if (!cleanToken) {
      clearAuthStorage();
      setToken(null);
      setUser(null);
      return null;
    }

    const sessionUser = buildUserFromSession(cleanToken, getSavedUser(), fallbackUser);

    saveAuthSession(cleanToken, sessionUser);
    setToken(cleanToken);
    setUser(sessionUser);

    return sessionUser;
  }, []);

  const refreshAuthSession = useCallback(() => {
    const savedToken = cleanBearerToken(getTokenFromStorage());

    if (!savedToken) {
      setToken(null);
      setUser(null);
      return null;
    }

    return setSessionFromToken(savedToken, getSavedUser() || {});
  }, [setSessionFromToken]);

  useEffect(() => {
    refreshAuthSession();

    const handleAuthStorageChange = (event) => {
      if (
        event &&
        !["token", "accessToken", "jwt", "authToken", "role", "user"].includes(
          event.key,
        )
      ) {
        return;
      }

      refreshAuthSession();
    };

    const handleAuthChanged = () => {
      refreshAuthSession();
    };

    window.addEventListener("storage", handleAuthStorageChange);
    window.addEventListener("baentech-auth-changed", handleAuthChanged);

    return () => {
      window.removeEventListener("storage", handleAuthStorageChange);
      window.removeEventListener("baentech-auth-changed", handleAuthChanged);
    };
  }, [refreshAuthSession]);

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

    const cleanToken = cleanBearerToken(loginToken);

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

    saveAuthSession(cleanToken, loginUser);

    setToken(cleanToken);
    setUser(loginUser);

    window.dispatchEvent(new Event("baentech-auth-changed"));

    return loginUser;
  };

  const logout = () => {
    clearAuthStorage();
    setToken(null);
    setUser(null);
    window.dispatchEvent(new Event("baentech-auth-changed"));
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        logout,
        setSessionFromToken,
        refreshAuthSession,
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