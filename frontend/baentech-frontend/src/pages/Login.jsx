import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Lock, Mail, ShieldCheck, Truck, Headphones } from "lucide-react";

import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/baentech-logo.png";

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

const getTokenFromResultOrStorage = (result) => {
  return (
    result?.token ||
    result?.accessToken ||
    result?.jwt ||
    result?.data?.token ||
    result?.data?.accessToken ||
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("jwt") ||
    localStorage.getItem("authToken") ||
    ""
  );
};

const getRoleFromLoginResult = (result) => {
  return normalizeRole(
    result?.role ||
      result?.roles ||
      result?.authority ||
      result?.authorities ||
      result?.user?.role ||
      result?.user?.roles ||
      result?.data?.role ||
      result?.data?.roles ||
      result?.data?.user?.role ||
      result?.data?.user?.roles ||
      "",
  );
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

const getFromPath = (from) => {
  if (!from) return "/";

  if (typeof from === "string") {
    return from;
  }

  if (from.pathname) {
    return from.pathname;
  }

  return "/";
};

const resolveRedirectPath = (role, fromPath) => {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "ADMIN") {
    if (fromPath && fromPath.startsWith("/admin")) {
      return fromPath;
    }

    return "/admin/dashboard";
  }

  // Selain ADMIN, jangan pernah masuk route admin
  if (fromPath && fromPath.startsWith("/admin")) {
    return "/";
  }

  if (
    fromPath === "/login" ||
    fromPath === "/register" ||
    fromPath === "/admin/dashboard"
  ) {
    return "/";
  }

  return fromPath || "/";
};

const clearOldAuthSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("jwt");
  localStorage.removeItem("authToken");
  localStorage.removeItem("role");
  localStorage.removeItem("user");
  localStorage.removeItem("adminProfile");
};

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const fromPath = getFromPath(location.state?.from || "/");

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleGoogleLogin = () => {
    clearOldAuthSession();

    const authBaseUrl =
      import.meta.env.VITE_AUTH_API_BASE_URL || "http://localhost:8081";

    window.location.href = `${authBaseUrl}/oauth2/authorization/google`;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Penting: hapus role/token lama dulu biar akun USER tidak kebaca ADMIN lama
      clearOldAuthSession();

      const loginResult = await login(form.email, form.password);

      const token = getTokenFromResultOrStorage(loginResult);

      const roleFromToken = getRoleFromToken(token);
      const roleFromResult = getRoleFromLoginResult(loginResult);

      // Prioritas role dari token baru, baru fallback ke response login
      const finalRole = normalizeRole(roleFromToken || roleFromResult);

      if (token) {
        localStorage.setItem(
          "token",
          token.startsWith("Bearer ") ? token.replace("Bearer ", "") : token,
        );
      }

      localStorage.setItem("role", finalRole);

      console.log("LOGIN RESULT:", loginResult);
      console.log("TOKEN ROLE:", roleFromToken);
      console.log("RESPONSE ROLE:", roleFromResult);
      console.log("FINAL ROLE:", finalRole);

      const redirectPath = resolveRedirectPath(finalRole, fromPath);

      navigate(redirectPath, { replace: true });
    } catch (err) {
      console.log(err);

      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Login gagal. Periksa email dan password.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 dark:bg-slate-950">
      <Navbar />

      <main className="flex min-h-[calc(100vh-88px)] items-center justify-center px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
        <section className="grid w-full max-w-6xl overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-2xl shadow-slate-300/50 transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/40 lg:min-h-[650px] lg:grid-cols-[1.05fr_0.95fr]">
          {/* LEFT BRAND */}
          <div className="relative hidden overflow-hidden bg-gradient-to-br from-blue-700 via-blue-900 to-slate-950 text-white lg:flex lg:items-center lg:justify-center">
            <div className="absolute -left-16 top-14 h-72 w-72 rounded-full bg-blue-400/30 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-600/30 blur-3xl" />
            <div className="absolute inset-x-10 bottom-10 h-px bg-white/20" />

            <div className="relative z-10 max-w-xl px-10 text-center">
              <div className="mx-auto inline-flex rounded-3xl bg-white p-4 shadow-2xl transition duration-300 hover:-translate-y-1 hover:shadow-blue-950/40">
                <img
                  src={logo}
                  alt="BaenTech Store"
                  className="h-32 w-auto object-contain"
                />
              </div>

              <h1 className="mt-10 text-4xl font-black leading-tight">
                Selamat Datang Kembali!
              </h1>

              <p className="mx-auto mt-4 max-w-md text-base font-semibold leading-relaxed text-blue-100">
                Masuk untuk melanjutkan belanja produk teknologi terbaik di
                BaenTech Store.
              </p>

              <div className="mt-12 grid grid-cols-3 gap-4">
                <div className="rounded-3xl bg-white/10 p-4 backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/15">
                  <ShieldCheck className="mx-auto mb-3 h-8 w-8" />
                  <p className="text-sm font-bold">Aman</p>
                </div>

                <div className="rounded-3xl bg-white/10 p-4 backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/15">
                  <Headphones className="mx-auto mb-3 h-8 w-8" />
                  <p className="text-sm font-bold">Responsif</p>
                </div>

                <div className="rounded-3xl bg-white/10 p-4 backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/15">
                  <Truck className="mx-auto mb-3 h-8 w-8" />
                  <p className="text-sm font-bold">Cepat</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT FORM */}
          <div className="flex items-center justify-center bg-white px-4 py-7 dark:bg-slate-900 sm:px-8 sm:py-10">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70 transition duration-300 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30 sm:rounded-3xl sm:p-8">
              <div className="mb-6 text-center sm:mb-8">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 p-2 shadow-inner dark:bg-blue-950/40 lg:hidden">
                  <img
                    src={logo}
                    alt="BaenTech Store"
                    className="h-full w-full object-contain"
                  />
                </div>

                <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400">
                  BaenTech Store
                </p>
                <h1 className="mt-2 text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">
                  Masuk ke Akun Anda
                </h1>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400 sm:text-sm">
                  Silakan masuk untuk melanjutkan transaksi dan melihat pesanan.
                </p>
              </div>

              {error && (
                <div className="mb-5 rounded-2xl bg-red-100 px-4 py-3 text-xs font-bold leading-5 text-red-700 dark:bg-red-950/40 dark:text-red-300 sm:text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300 sm:text-sm">
                    Email
                  </label>

                  <div className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-slate-50 px-3 py-3 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus-within:bg-slate-950 dark:focus-within:ring-blue-950 sm:px-4">
                    <Mail size={18} className="text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="nama@email.com"
                      className="w-full bg-transparent text-sm font-semibold outline-none dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300 sm:text-sm">
                    Password
                  </label>

                  <div className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-slate-50 px-3 py-3 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus-within:bg-slate-950 dark:focus-within:ring-blue-950 sm:px-4">
                    <Lock size={18} className="text-slate-400" />
                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Masukkan password"
                      className="w-full bg-transparent text-sm font-semibold outline-none dark:text-white"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-blue-300 disabled:hover:translate-y-0"
                >
                  {loading ? "Memproses..." : "Login"}
                </button>
              </form>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                <span className="text-xs font-black uppercase text-slate-400">
                  atau
                </span>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-slate-50 hover:shadow-lg active:scale-[0.98] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  className="h-5 w-5"
                />
                Lanjutkan dengan Google
              </button>

              <p className="mt-6 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">
                Belum punya akun?{" "}
                <Link
                  to="/register"
                  className="font-black text-blue-600 transition hover:text-blue-700"
                >
                  Daftar
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Login;
