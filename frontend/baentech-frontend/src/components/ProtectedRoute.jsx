import { Navigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";

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

const getToken = () => {
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
    return JSON.parse(localStorage.getItem("user") || "{}");
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

const getCurrentRole = (user) => {
  const token = getToken();
  const savedUser = getSavedUser();

  return normalizeRole(
    getRoleFromToken(token) ||
      localStorage.getItem("role") ||
      user?.role ||
      user?.roles ||
      user?.authority ||
      user?.authorities ||
      savedUser?.role ||
      savedUser?.roles ||
      savedUser?.authority ||
      savedUser?.authorities ||
      "",
  );
};

function ProtectedRoute({ children, allowedRoles = [] }) {
  const location = useLocation();
  const { user } = useAuth();

  const token = getToken();
  const role = getCurrentRole(user);

  const normalizedAllowedRoles = allowedRoles.map((item) => normalizeRole(item));

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (
    normalizedAllowedRoles.length > 0 &&
    !normalizedAllowedRoles.includes(role)
  ) {
    if (role === "ADMIN") {
      return <Navigate to="/admin/dashboard" replace />;
    }

    return <Navigate to="/" replace />;
  }

  return children;
}

export function UserOnlyRoute({ children }) {
  const { user } = useAuth();

  const token = getToken();
  const role = getCurrentRole(user);

  if (token && role === "ADMIN") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}

export function GuestRoute({ children }) {
  const { user } = useAuth();

  const token = getToken();
  const role = getCurrentRole(user);

  if (token && role === "ADMIN") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (token && role === "USER") {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
