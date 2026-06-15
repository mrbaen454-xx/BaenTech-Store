import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Lock, Mail, ShieldCheck, Truck, Headphones } from "lucide-react";

import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/baentech-logo.png";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = location.state?.from || "/";

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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(form.email, form.password);

      if (from !== "/") {
        navigate(from, { replace: true });
      } else if (user.role === "ADMIN" || user.role === "ROLE_ADMIN") {
        navigate("/admin/dashboard");
      } else {
        navigate("/");
      }
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
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950">
      <Navbar />

      <section className="grid min-h-[calc(100vh-90px)] lg:grid-cols-2">
        {/* LEFT BRAND */}
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-blue-700 via-blue-900 to-slate-950 text-white lg:flex lg:items-center lg:justify-center">
          <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-blue-400/30 blur-3xl"></div>
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-600/30 blur-3xl"></div>

          <div className="relative z-10 max-w-xl px-10 text-center">
            <div className="mx-auto inline-flex rounded-3xl bg-white p-4 shadow-2xl">
              <img
                src={logo}
                alt="BaenTech Store"
                className="h-36 w-auto object-contain"
              />
            </div>

            <h1 className="mt-10 text-4xl font-black">
              Selamat Datang Kembali!
            </h1>

            <p className="mt-4 text-lg leading-relaxed text-blue-100">
              Masuk untuk melanjutkan pengalaman belanja terbaik di BaenTech
              Store.
            </p>

            <div className="mt-12 grid grid-cols-3 gap-6">
              <div>
                <ShieldCheck className="mx-auto mb-3 h-8 w-8" />
                <p className="text-sm font-bold">Aman</p>
              </div>

              <div>
                <Headphones className="mx-auto mb-3 h-8 w-8" />
                <p className="text-sm font-bold">Responsif</p>
              </div>

              <div>
                <Truck className="mx-auto mb-3 h-8 w-8" />
                <p className="text-sm font-bold">Cepat</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT FORM */}
        <div className="flex items-center justify-center px-4 py-10 sm:px-6">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-2xl shadow-slate-300/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/40 sm:p-9">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-black text-slate-950 dark:text-white">
                Masuk ke Akun Anda
              </h1>
              <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                Silakan masuk untuk melanjutkan
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-xl bg-red-100 px-4 py-3 text-sm font-bold text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Email
                </label>

                <div className="flex items-center gap-3 rounded-xl border border-slate-300 px-4 py-3 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus-within:ring-blue-950">
                  <Mail size={20} className="text-slate-400" />
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
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Password
                </label>

                <div className="flex items-center gap-3 rounded-xl border border-slate-300 px-4 py-3 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus-within:ring-blue-950">
                  <Lock size={20} className="text-slate-400" />
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
                className="w-full rounded-xl bg-blue-600 py-3.5 font-black text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 disabled:bg-blue-300"
              >
                {loading ? "Memproses..." : "Login"}
              </button>
            </form>

            <p className="mt-7 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
              Belum punya akun?{" "}
              <Link to="/register" className="font-black text-blue-600">
                Daftar
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Login;
