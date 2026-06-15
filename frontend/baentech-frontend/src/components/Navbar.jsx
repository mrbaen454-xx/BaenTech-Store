import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Menu, Moon, ShoppingCart, Sun, UserRound, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import logo from "../assets/baentech-logo.png";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated, user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  const [openMenu, setOpenMenu] = useState(false);

  const isAdmin = user?.role === "ADMIN" || user?.role === "ROLE_ADMIN";

  const isProductPage = location.pathname.startsWith("/products");
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";

  const hideMenuLinks = isProductPage || isAuthPage;

  const closeMenu = () => {
    setOpenMenu(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    setOpenMenu(false);
  };

  return (
    <header className="sticky top-3 z-50 px-3 sm:top-4 sm:px-6">
      <div className="mx-auto max-w-6xl rounded-full border border-slate-200/80 bg-white/85 px-4 py-2 shadow-xl shadow-slate-300/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85 dark:shadow-black/30 sm:px-5">
        <div className="flex items-center justify-between">
          <Link to="/" onClick={closeMenu} className="flex items-center">
            <img
              src={logo}
              alt="BaenTech Store"
              className="h-9 w-auto object-contain sm:h-11 md:h-12"
            />
          </Link>

          {!hideMenuLinks && (
            <nav className="hidden items-center gap-7 md:flex">
              <Link
                className="text-sm font-bold text-slate-800 hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400"
                to="/"
              >
                Rumah
              </Link>

              <Link
                className="text-sm font-bold text-slate-800 hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400"
                to="/products"
              >
                Produk
              </Link>

              <a
                className="text-sm font-bold text-slate-800 hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400"
                href="/#kategori"
              >
                Kategori
              </a>

              <a
                className="text-sm font-bold text-slate-800 hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400"
                href="/#footer"
              >
                Tentang Kami
              </a>
            </nav>
          )}

          <div className="hidden items-center gap-3 md:flex">
            <button
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-yellow-300"
              title={isDarkMode ? "Mode Siang" : "Mode Malam"}
            >
              {isDarkMode ? <Sun size={19} /> : <Moon size={19} />}
            </button>

            {isAuthenticated && (
              <Link
                to="/cart"
                className="relative text-slate-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
              >
                <ShoppingCart size={23} />
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">
                  0
                </span>
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin/dashboard"
                className="rounded-full border border-blue-200 px-4 py-2 text-sm font-black text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-slate-900"
              >
                Admin
              </Link>
            )}

            {!isAuthenticated ? (
              <div className="flex items-center gap-2">
                {location.pathname !== "/register" && (
                  <Link
                    to="/register"
                    className="rounded-full border border-blue-200 px-4 py-2 text-sm font-black text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-slate-900"
                  >
                    Daftar
                  </Link>
                )}

                {location.pathname !== "/login" && (
                  <Link
                    to="/login"
                    className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700"
                  >
                    <UserRound size={17} />
                    Login
                  </Link>
                )}
              </div>
            ) : (
              <button
                onClick={handleLogout}
                className="rounded-full bg-red-500 px-4 py-2 text-sm font-black text-white hover:bg-red-600"
              >
                Logout
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-yellow-300"
            >
              {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <button
              onClick={() => setOpenMenu(!openMenu)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              {openMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {openMenu && (
        <div className="mx-auto mt-2 max-w-6xl rounded-3xl border border-slate-200 bg-white/95 p-3 shadow-xl shadow-slate-300/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 dark:shadow-black/30 md:hidden">
          <div className="space-y-2">
            {!hideMenuLinks && (
              <>
                <Link
                  to="/"
                  onClick={closeMenu}
                  className="block rounded-2xl px-4 py-2.5 text-sm font-black text-slate-900 hover:bg-blue-50 dark:text-white dark:hover:bg-slate-900"
                >
                  Rumah
                </Link>

                <Link
                  to="/products"
                  onClick={closeMenu}
                  className="block rounded-2xl px-4 py-2.5 text-sm font-black text-slate-900 hover:bg-blue-50 dark:text-white dark:hover:bg-slate-900"
                >
                  Produk
                </Link>

                <a
                  href="/#kategori"
                  onClick={closeMenu}
                  className="block rounded-2xl px-4 py-2.5 text-sm font-black text-slate-900 hover:bg-blue-50 dark:text-white dark:hover:bg-slate-900"
                >
                  Kategori
                </a>

                <a
                  href="/#footer"
                  onClick={closeMenu}
                  className="block rounded-2xl px-4 py-2.5 text-sm font-black text-slate-900 hover:bg-blue-50 dark:text-white dark:hover:bg-slate-900"
                >
                  Tentang Kami
                </a>
              </>
            )}

            {isAuthenticated && (
              <Link
                to="/cart"
                onClick={closeMenu}
                className="block rounded-2xl px-4 py-2.5 text-sm font-black text-slate-900 hover:bg-blue-50 dark:text-white dark:hover:bg-slate-900"
              >
                Keranjang
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin/dashboard"
                onClick={closeMenu}
                className="block rounded-2xl px-4 py-2.5 text-sm font-black text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-slate-900"
              >
                Admin
              </Link>
            )}

            {!isAuthenticated ? (
              <div className="grid grid-cols-2 gap-2 pt-2">
                {location.pathname !== "/register" && (
                  <Link
                    to="/register"
                    onClick={closeMenu}
                    className="flex items-center justify-center rounded-full border border-blue-200 px-4 py-2.5 text-sm font-black text-blue-600 dark:border-blue-800 dark:text-blue-400"
                  >
                    Daftar
                  </Link>
                )}

                {location.pathname !== "/login" && (
                  <Link
                    to="/login"
                    onClick={closeMenu}
                    className="flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-sm font-black text-white"
                  >
                    <UserRound size={17} />
                    Login
                  </Link>
                )}
              </div>
            ) : (
              <button
                onClick={handleLogout}
                className="w-full rounded-full bg-red-500 px-4 py-2.5 text-sm font-black text-white"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
