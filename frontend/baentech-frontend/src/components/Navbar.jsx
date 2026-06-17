import { Link, useLocation, useNavigate } from "react-router";
import {
  LogOut,
  Menu,
  Moon,
  PackageCheck,
  ShoppingCart,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { useState } from "react";

import logo from "../assets/baentech-logo.png";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const normalizeRole = (role) => {
  if (!role) return "";

  if (Array.isArray(role)) {
    const firstRole = role[0];

    if (typeof firstRole === "string") {
      return normalizeRole(firstRole);
    }

    if (firstRole?.authority) {
      return normalizeRole(firstRole.authority);
    }

    if (firstRole?.role) {
      return normalizeRole(firstRole.role);
    }

    return "";
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
        .map((char) => {
          return `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`;
        })
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

const getSavedUserProfile = () => {
  try {
    return JSON.parse(localStorage.getItem("userProfile") || "{}");
  } catch {
    return {};
  }
};

const getRoleFromToken = (token) => {
  const payload = decodeJwtPayload(token);

  return normalizeRole(
    payload.role ||
      payload.roles ||
      payload.authority ||
      payload.authorities ||
      "",
  );
};

const getFinalRole = (user) => {
  const token = getToken();
  const savedUser = getSavedUser();

  const roleFromToken = getRoleFromToken(token);
  const roleFromStorage = normalizeRole(localStorage.getItem("role"));
  const roleFromUser = normalizeRole(
    user?.role || user?.roles || user?.authority || user?.authorities || "",
  );
  const roleFromSavedUser = normalizeRole(
    savedUser?.role ||
      savedUser?.roles ||
      savedUser?.authority ||
      savedUser?.authorities ||
      "",
  );

  return normalizeRole(
    roleFromToken || roleFromStorage || roleFromUser || roleFromSavedUser,
  );
};

const getUserName = (user) => {
  const savedUser = getSavedUser();
  const savedProfile = getSavedUserProfile();

  return (
    savedProfile?.fullName ||
    savedProfile?.name ||
    user?.fullName ||
    user?.name ||
    savedUser?.fullName ||
    savedUser?.name ||
    user?.email ||
    savedUser?.email ||
    "User"
  );
};

const getUserPhoto = (user) => {
  const savedUser = getSavedUser();
  const savedProfile = getSavedUserProfile();

  return (
    savedProfile?.profileImageUrl ||
    savedProfile?.photoUrl ||
    savedProfile?.imageUrl ||
    user?.profileImageUrl ||
    user?.photoUrl ||
    user?.imageUrl ||
    savedUser?.profileImageUrl ||
    savedUser?.photoUrl ||
    savedUser?.imageUrl ||
    ""
  );
};

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  const [mobileOpen, setMobileOpen] = useState(false);

  const token = getToken();
  const role = getFinalRole(user);

  const isLoggedIn = Boolean(token);
  const isAdmin = role === "ADMIN";
  const isUser = role === "USER";

  const userName = getUserName(user);
  const userPhoto = getUserPhoto(user);

  const isProductPage =
    location.pathname === "/products" ||
    location.pathname.startsWith("/products/") ||
    location.pathname.startsWith("/product/");

  const showCenterMenu = !isProductPage;

  const handleLogout = () => {
    logout?.();

    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("jwt");
    localStorage.removeItem("authToken");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    localStorage.removeItem("adminProfile");
    localStorage.removeItem("userProfile");

    navigate("/", { replace: true });
  };

  const closeMobile = () => {
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 px-2 pt-2">
      <div className="mx-auto flex max-w-[1300px] items-center justify-between rounded-[2rem] border border-slate-200 bg-white/90 px-5 py-3 shadow-xl shadow-slate-300/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-black/30">
        {" "}
        <Link to="/" className="flex items-center gap-2" onClick={closeMobile}>
          <img
            src={logo}
            alt="BaenTech Store"
            className="h-9 w-auto object-contain"
          />
        </Link>
        {showCenterMenu && (
          <nav className="hidden items-center gap-7 lg:flex">
            <Link
              to="/products"
              className="text-sm font-black text-slate-700 transition hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400"
            >
              Produk
            </Link>

            <a
              href="/#categories"
              className="text-sm font-black text-slate-700 transition hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400"
            >
              Kategori
            </a>

            <a
              href="/#footer"
              className="text-sm font-black text-slate-700 transition hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400"
            >
              Tentang Kami
            </a>
          </nav>
        )}
        <div className="hidden items-center gap-3 lg:flex">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 transition hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:text-blue-400"
            title="Theme"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {isLoggedIn && isUser && (
            <>
              <Link
                to="/cart"
                className="relative flex h-11 w-11 items-center justify-center rounded-full text-slate-700 transition hover:bg-blue-50 hover:text-blue-600 dark:text-slate-200 dark:hover:bg-blue-950/40 dark:hover:text-blue-400"
                title="Keranjang"
              >
                <ShoppingCart size={23} />
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-black text-white">
                  0
                </span>
              </Link>

              <Link
                to="/my-orders"
                className="flex h-11 w-11 items-center justify-center rounded-full text-slate-700 transition hover:bg-blue-50 hover:text-blue-600 dark:text-slate-200 dark:hover:bg-blue-950/40 dark:hover:text-blue-400"
                title="Pesanan Saya"
              >
                <PackageCheck size={23} />
              </Link>
            </>
          )}

          {!isLoggedIn && (
            <>
              <Link
                to="/login"
                className="rounded-full border border-blue-600 px-5 py-2.5 text-sm font-black text-blue-400 transition hover:bg-blue-600 hover:text-white"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700"
              >
                Register
              </Link>
            </>
          )}

          {isLoggedIn && isAdmin && (
            <Link
              to="/admin/dashboard"
              className="rounded-full border border-blue-600 px-5 py-2.5 text-sm font-black text-blue-400 transition hover:bg-blue-600 hover:text-white"
            >
              Admin
            </Link>
          )}

          {isLoggedIn && isUser && (
            <Link
              to="/profile"
              className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 py-1.5 pl-2 pr-4 transition hover:border-blue-500 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-blue-950/30"
              title="Profile"
            >
              {userPhoto ? (
                <img
                  src={userPhoto}
                  alt={userName}
                  className="h-9 w-9 rounded-full border border-slate-700 object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                  <UserRound size={18} />
                </div>
              )}

              <div className="text-left">
                <p className="max-w-28 truncate text-sm font-black text-slate-900 dark:text-white">
                  {userName}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Customer
                </p>
              </div>
            </Link>
          )}

          {isLoggedIn && (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700"
            >
              Logout
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-white lg:hidden"
        >
          <Menu size={21} />
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[999] bg-slate-950/70 backdrop-blur-sm lg:hidden">
          <div className="ml-auto h-full w-80 max-w-[86%] bg-slate-950 p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <img
                src={logo}
                alt="BaenTech Store"
                className="h-10 w-auto object-contain"
              />

              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-full border border-slate-700 p-2 text-white"
              >
                <X size={18} />
              </button>
            </div>

            {isLoggedIn && isUser && (
              <Link
                to="/profile"
                onClick={closeMobile}
                className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900 p-3"
              >
                {userPhoto ? (
                  <img
                    src={userPhoto}
                    alt={userName}
                    className="h-11 w-11 rounded-full border border-slate-700 object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-950/50 text-blue-300">
                    <UserRound size={20} />
                  </div>
                )}

                <div>
                  <p className="font-black text-white">{userName}</p>
                  <p className="text-xs font-semibold text-slate-400">
                    Customer
                  </p>
                </div>
              </Link>
            )}

            <nav className="mt-8 space-y-2">
              {showCenterMenu && (
                <>
                  <MobileLink to="/products" onClick={closeMobile}>
                    Produk
                  </MobileLink>

                  <MobileAnchor href="/#categories" onClick={closeMobile}>
                    Kategori
                  </MobileAnchor>

                  <MobileAnchor href="/#footer" onClick={closeMobile}>
                    Tentang Kami
                  </MobileAnchor>
                </>
              )}

              {isLoggedIn && isUser && (
                <div className="grid grid-cols-2 gap-3 pt-3">
                  <MobileIconLink to="/cart" onClick={closeMobile}>
                    <ShoppingCart size={22} />
                    <span>Keranjang</span>
                  </MobileIconLink>

                  <MobileIconLink to="/my-orders" onClick={closeMobile}>
                    <PackageCheck size={22} />
                    <span>Pesanan</span>
                  </MobileIconLink>
                </div>
              )}

              {isLoggedIn && isAdmin && (
                <MobileLink to="/admin/dashboard" onClick={closeMobile}>
                  Admin Dashboard
                </MobileLink>
              )}
            </nav>

            <div className="mt-8 border-t border-slate-800 pt-5">
              <button
                type="button"
                onClick={toggleTheme}
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-700 px-5 py-3 text-sm font-black text-white"
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                Theme
              </button>

              {!isLoggedIn ? (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/login"
                    onClick={closeMobile}
                    className="rounded-2xl border border-blue-600 px-5 py-3 text-center text-sm font-black text-blue-400"
                  >
                    Login
                  </Link>

                  <Link
                    to="/register"
                    onClick={closeMobile}
                    className="rounded-2xl bg-blue-600 px-5 py-3 text-center text-sm font-black text-white"
                  >
                    Register
                  </Link>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function MobileLink({ to, onClick, children }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block rounded-2xl px-4 py-3 text-sm font-black text-white hover:bg-blue-950/50 hover:text-blue-400"
    >
      {children}
    </Link>
  );
}

function MobileAnchor({ href, onClick, children }) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="block rounded-2xl px-4 py-3 text-sm font-black text-white hover:bg-blue-950/50 hover:text-blue-400"
    >
      {children}
    </a>
  );
}

function MobileIconLink({ to, onClick, children }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 p-4 text-sm font-black text-white hover:border-blue-500 hover:text-blue-400"
    >
      {children}
    </Link>
  );
}

export default Navbar;
