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
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950">
      <Navbar />

      <section className="grid min-h-[calc(100vh-90px)] lg:grid-cols-2">
        {/* LEFT FORM */}
        <div className="flex items-center justify-center px-4 py-10 sm:px-6">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-2xl shadow-slate-300/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/40 sm:p-9">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-black text-slate-950 dark:text-white">
                Buat Akun Baru
              </h1>

              <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                Daftar sekarang dan nikmati pengalaman belanja terbaik
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-xl bg-red-100 px-4 py-3 text-sm font-bold text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-5 rounded-xl bg-green-100 px-4 py-3 text-sm font-bold text-green-700">
                {success}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Nama Lengkap
                </label>

                <div className="flex items-center gap-3 rounded-xl border border-slate-300 px-4 py-3 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus-within:ring-blue-950">
                  <UserRound size={20} className="text-slate-400" />

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
                    placeholder="Masukkan email"
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

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Konfirmasi Password
                </label>

                <div className="flex items-center gap-3 rounded-xl border border-slate-300 px-4 py-3 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus-within:ring-blue-950">
                  <Lock size={20} className="text-slate-400" />

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
                className="w-full rounded-xl bg-blue-600 py-3.5 font-black text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
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
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                className="h-5 w-5"
              />
              Daftar dengan Google
            </button>

            <p className="mt-7 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
              Sudah punya akun?{" "}
              <Link to="/login" className="font-black text-blue-600">
                Login
              </Link>
            </p>
          </div>
        </div>

        {/* RIGHT BRAND */}
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-blue-100 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 lg:flex lg:items-center lg:justify-center">
          <div className="absolute right-10 top-20 h-72 w-72 rounded-full bg-blue-400/30 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl"></div>

          <div className="relative z-10 max-w-xl px-10 text-center">
            <div className="mx-auto inline-flex rounded-3xl bg-white p-4 shadow-2xl">
              <img
                src={logo}
                alt="BaenTech Store"
                className="h-36 w-auto object-contain"
              />
            </div>

            <h1 className="mt-10 text-4xl font-black text-slate-950 dark:text-white">
              Selamat Datang di BaenTech Store
            </h1>

            <p className="mt-4 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              Bergabunglah sekarang dan dapatkan akses ke berbagai produk
              teknologi terbaik.
            </p>

            <div className="mt-12 grid grid-cols-3 gap-6">
              <div>
                <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-blue-600" />
                <p className="text-sm font-bold text-slate-950 dark:text-white">
                  Aman
                </p>
              </div>

              <div>
                <BadgeCheck className="mx-auto mb-3 h-8 w-8 text-blue-600" />
                <p className="text-sm font-bold text-slate-950 dark:text-white">
                  Original
                </p>
              </div>

              <div>
                <Headphones className="mx-auto mb-3 h-8 w-8 text-blue-600" />
                <p className="text-sm font-bold text-slate-950 dark:text-white">
                  Support
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Register;
