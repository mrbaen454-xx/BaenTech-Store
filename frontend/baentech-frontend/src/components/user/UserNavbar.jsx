import { Link, useNavigate } from "react-router";
import {
  LogOut,
  Menu,
  Moon,
  ShoppingBag,
  ShoppingCart,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { useState } from "react";

import logo from "../../assets/baentech-logo.png";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

function UserNavbar() {
  const navigate = useNavigate();

  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  const [mobileOpen, setMobileOpen] = useState(false);

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("jwt") ||
    localStorage.getItem("authToken");

  const isLoggedIn = Boolean(token || user);

  const userName =
    user?.fullName || user?.name || user?.email || getSavedUserName() || "User";

  const handleLogout = () => {
    logout?.();

    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("jwt");
    localStorage.removeItem("authToken");

    navigate("/");
  };

  const publicMenus = [
    { label: "Home", path: "/" },
    { label: "Products", path: "/products" },
    { label: "About", path: "/about" },
  ];

  const userMenus = [
    { label: "Home", path: "/" },
    { label: "Products", path: "/products" },
    { label: "Cart", path: "/cart" },
    { label: "My Orders", path: "/my-orders" },
    { label: "Profile", path: "/profile" },
  ];

  const menus = isLoggedIn ? userMenus : publicMenus;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/85 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={logo}
            alt="BaenTech Store"
            className="h-12 w-auto object-contain"
          />
        </Link>

        <nav className="hidden items-center gap-2 lg:flex">
          {menus.map((menu) => (
            <Link
              key={menu.path}
              to={menu.path}
              className="rounded-full px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-blue-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-blue-950/30 dark:hover:text-blue-400"
            >
              {menu.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-yellow-300"
          >
            {isDarkMode ? <Sun size={19} /> : <Moon size={19} />}
          </button>

          {isLoggedIn ? (
            <>
              <Link
                to="/cart"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300"
              >
                <ShoppingCart size={20} />
              </Link>

              <Link
                to="/profile"
                className="flex items-center gap-3 rounded-full border border-slate-200 bg-white py-1.5 pl-2 pr-4 dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                  <UserRound size={18} />
                </div>

                <div>
                  <p className="text-sm font-black text-slate-950 dark:text-white">
                    {userName}
                  </p>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Customer
                  </p>
                </div>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-100 dark:bg-red-950/30 dark:text-red-300"
              >
                <LogOut size={19} />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-black text-slate-700 transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:text-slate-200"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700"
              >
                Register
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white lg:hidden"
        >
          <Menu size={21} />
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[999] bg-slate-950/60 backdrop-blur-sm lg:hidden">
          <div className="ml-auto h-full w-80 max-w-[85%] bg-white p-5 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <img
                src={logo}
                alt="BaenTech Store"
                className="h-12 w-auto object-contain"
              />

              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-full border border-slate-200 p-2 text-slate-700 dark:border-slate-700 dark:text-slate-300"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-8 space-y-2">
              {menus.map((menu) => (
                <Link
                  key={menu.path}
                  to={menu.path}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-2xl px-4 py-3 text-sm font-black text-slate-700 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-200 dark:hover:bg-blue-950/30"
                >
                  {menu.label}
                </Link>
              ))}
            </div>

            <div className="mt-8 border-t border-slate-200 pt-5 dark:border-slate-700">
              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-2xl border border-slate-200 px-5 py-3 text-center text-sm font-black text-slate-700 dark:border-slate-700 dark:text-slate-200"
                  >
                    Login
                  </Link>

                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-2xl bg-blue-600 px-5 py-3 text-center text-sm font-black text-white"
                  >
                    Register
                  </Link>
                </div>
              )}

              <button
                type="button"
                onClick={toggleTheme}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 dark:border-slate-700 dark:text-slate-200"
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                Theme
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function getSavedUserName() {
  try {
    const profile = JSON.parse(localStorage.getItem("userProfile") || "{}");
    return profile?.fullName || profile?.name || "";
  } catch {
    return "";
  }
}

export default UserNavbar;
