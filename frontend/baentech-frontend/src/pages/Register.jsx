import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Lock,
  Mail,
  UserRound,
  ShieldCheck,
  BadgeCheck,
  Headphones,
} from "lucide-react";

import Navbar from "../components/Navbar";
import logo from "../assets/baentech-logo.png";
import { registerApi } from "../api/authApi";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleGoogleLogin = () => {
    const authBaseUrl =
      import.meta.env.VITE_AUTH_API_BASE_URL || "http://localhost:8081";

    window.location.href = `${authBaseUrl}/oauth2/authorization/google`;
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (form.password !== form.confirmPassword) {
      setError("Password dan konfirmasi password tidak sama.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        fullName: form.fullName,
        email: form.email,
        password: form.password,
      };

      await registerApi(payload);

      setSuccess("Akun berhasil dibuat. Silakan login.");

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (err) {
      console.log(err);

      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.response?.data ||
        err.message ||
        "Register gagal. Periksa data yang dimasukkan.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 dark:bg-slate-950">
      <Navbar />

      <main className="flex min-h-[calc(100vh-88px)] items-center justify-center px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
        <section className="grid w-full max-w-6xl overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-2xl shadow-slate-300/50 transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/40 lg:min-h-[690px] lg:grid-cols-[0.95fr_1.05fr]">
          {/* LEFT FORM */}
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
                  Buat Akun
                </p>
                <h1 className="mt-2 text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">
                  Daftar BaenTech Store
                </h1>

                <p className="mt-2 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400 sm:text-sm">
                  Daftar sekarang dan nikmati pengalaman belanja terbaik.
                </p>
              </div>

              {error && (
                <div className="mb-5 rounded-2xl bg-red-100 px-4 py-3 text-xs font-bold leading-5 text-red-700 dark:bg-red-950/40 dark:text-red-300 sm:text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-5 rounded-2xl bg-green-100 px-4 py-3 text-xs font-bold leading-5 text-green-700 dark:bg-green-950/40 dark:text-green-300 sm:text-sm">
                  {success}
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4 sm:space-y-5">
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300 sm:text-sm">
                    Nama Lengkap
                  </label>

                  <div className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-slate-50 px-3 py-3 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus-within:bg-slate-950 dark:focus-within:ring-blue-950 sm:px-4">
                    <UserRound size={18} className="text-slate-400" />

                    <input
                      type="text"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      placeholder="Masukkan nama lengkap"
                      className="w-full bg-transparent text-sm font-semibold outline-none dark:text-white"
                      required
                    />
                  </div>
                </div>

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
                      placeholder="Masukkan email"
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

                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300 sm:text-sm">
                    Konfirmasi Password
                  </label>

                  <div className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-slate-50 px-3 py-3 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus-within:bg-slate-950 dark:focus-within:ring-blue-950 sm:px-4">
                    <Lock size={18} className="text-slate-400" />

                    <input
                      type="password"
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      placeholder="Konfirmasi password"
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
                  {loading ? "Mendaftarkan..." : "Daftar"}
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
                Daftar dengan Google
              </button>

              <p className="mt-6 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">
                Sudah punya akun?{" "}
                <Link
                  to="/login"
                  className="font-black text-blue-600 transition hover:text-blue-700"
                >
                  Login
                </Link>
              </p>
            </div>
          </div>

          {/* RIGHT BRAND */}
          <div className="relative hidden overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-blue-100 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 lg:flex lg:items-center lg:justify-center">
            <div className="absolute right-10 top-20 h-72 w-72 rounded-full bg-blue-400/30 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
            <div className="absolute inset-x-10 bottom-10 h-px bg-blue-200/70 dark:bg-white/10" />

            <div className="relative z-10 max-w-xl px-10 text-center">
              <div className="mx-auto inline-flex rounded-3xl bg-white p-4 shadow-2xl transition duration-300 hover:-translate-y-1 hover:shadow-blue-200/70 dark:shadow-black/40">
                <img
                  src={logo}
                  alt="BaenTech Store"
                  className="h-32 w-auto object-contain"
                />
              </div>

              <h1 className="mt-10 text-4xl font-black leading-tight text-slate-950 dark:text-white">
                Selamat Datang di BaenTech Store
              </h1>

              <p className="mx-auto mt-4 max-w-md text-base font-semibold leading-relaxed text-slate-600 dark:text-slate-300">
                Bergabunglah sekarang dan dapatkan akses ke berbagai produk
                teknologi terbaik.
              </p>

              <div className="mt-12 grid grid-cols-3 gap-4">
                <div className="rounded-3xl bg-white/70 p-4 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white dark:bg-white/10">
                  <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-blue-600" />
                  <p className="text-sm font-bold text-slate-950 dark:text-white">
                    Aman
                  </p>
                </div>

                <div className="rounded-3xl bg-white/70 p-4 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white dark:bg-white/10">
                  <BadgeCheck className="mx-auto mb-3 h-8 w-8 text-blue-600" />
                  <p className="text-sm font-bold text-slate-950 dark:text-white">
                    Original
                  </p>
                </div>

                <div className="rounded-3xl bg-white/70 p-4 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white dark:bg-white/10">
                  <Headphones className="mx-auto mb-3 h-8 w-8 text-blue-600" />
                  <p className="text-sm font-bold text-slate-950 dark:text-white">
                    Support
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Register;
