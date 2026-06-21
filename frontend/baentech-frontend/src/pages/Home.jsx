import { useEffect, useState } from "react";
import { Link } from "react-router";
import logo from "../assets/baentech-logo.png";
import {
  ArrowRight,
  BadgeCheck,
  Cable,
  Headphones,
  Keyboard,
  Laptop,
  Monitor,
  Mouse,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";

import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import { getProductsApi } from "../api/productApi";
import BrandLogo from "../components/BrandLogo";

const categories = [
  { name: "Laptop", icon: Laptop },
  { name: "Keyboard", icon: Keyboard },
  { name: "Mouse", icon: Mouse },
  { name: "Headset", icon: Headphones },
  { name: "Monitor", icon: Monitor },
  { name: "Aksesoris", icon: Cable },
];

const heroStats = [
  { label: "Produk aktif", value: "100+" },
  { label: "Garansi resmi", value: "2 Tahun" },
  { label: "Support", value: "24/7" },
];

const benefits = [
  {
    title: "Belanja Aman",
    description: "Sistem terjamin",
    icon: ShieldCheck,
  },
  {
    title: "Harga Terbaik",
    description: "Kompetitif",
    icon: BadgeCheck,
  },
  {
    title: "Pengiriman Cepat",
    description: "Cepat & aman",
    icon: Truck,
  },
  {
    title: "Layanan 24/7",
    description: "Siap membantu",
    icon: Headphones,
  },
];

function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProductsApi();

        const activeProducts = data.filter((product) => {
          return !product.status || product.status === "ACTIVE";
        });

        setProducts(activeProducts);
      } catch (err) {
        console.log(err);
        setError("Gagal mengambil data produk dari backend.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-200 text-slate-950 dark:bg-slate-950">
      <Navbar />

      <section className="relative overflow-hidden border-b border-white/60 bg-[radial-gradient(circle_at_top_left,_#dbeafe,_transparent_34%),linear-gradient(135deg,#f8fafc_0%,#e2e8f0_48%,#dbeafe_100%)] dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.22),_transparent_36%),linear-gradient(135deg,#020617_0%,#0f172a_55%,#111827_100%)]">
        <div className="absolute -left-16 top-12 h-56 w-56 rounded-full bg-blue-300/40 blur-3xl dark:bg-blue-600/20" />
        <div className="absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-cyan-300/40 blur-3xl dark:bg-cyan-500/10" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-16 md:grid-cols-[1.05fr_0.95fr] md:gap-12 lg:py-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-wide text-blue-700 shadow-sm backdrop-blur dark:border-blue-900/60 dark:bg-slate-900/70 dark:text-blue-300">
              <Sparkles size={15} />
              Toko teknologi pilihan
            </div>

            <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
              Teknologi Terbaik untuk Hidup Lebih Mudah
            </h1>

            <p className="mt-5 max-w-xl text-sm font-semibold leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
              Temukan produk teknologi berkualitas, garansi jelas, dan proses
              belanja yang lebih nyaman hanya di{" "}
              <span className="font-black text-blue-700 dark:text-blue-300">
                BaenTech Store
              </span>
              .
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 active:translate-y-0 sm:px-7 sm:text-base"
              >
                Lihat Produk
                <ArrowRight size={18} />
              </Link>

              <a
                href="#categories"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white/85 px-6 py-3.5 text-sm font-black text-slate-800 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-400 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:border-blue-500 dark:hover:text-blue-300 sm:text-base"
              >
                Jelajahi Kategori
              </a>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3 sm:mt-10 sm:gap-4">
              {heroStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/70 bg-white/70 p-3 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70 sm:p-4"
                >
                  <p className="text-sm font-black text-slate-950 dark:text-white sm:text-lg">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 sm:text-xs">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-4 rounded-[2rem] bg-blue-500/20 blur-2xl dark:bg-blue-500/10" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 p-4 shadow-2xl shadow-slate-400/30 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/30 sm:p-6">
              <div className="rounded-[1.5rem] border border-slate-100 bg-gradient-to-br from-white to-slate-100 p-6 dark:border-slate-800 dark:from-slate-950 dark:to-slate-900 sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 p-2 shadow-lg shadow-blue-600/25">
                      <img
                        src={logo}
                        alt="BaenTech Store"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-blue-600 dark:text-blue-300">
                        BaenTech Store
                      </p>
                      <h2 className="text-xl font-black text-slate-950 dark:text-white sm:text-2xl">
                        Smart Tech Hub
                      </h2>
                    </div>
                  </div>
                  <div className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-black text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    Online
                  </div>
                </div>

                <div className="mt-7 grid gap-3">
                  {categories.slice(0, 4).map((category) => {
                    const Icon = category.icon;

                    return (
                      <div
                        key={category.name}
                        className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                            <Icon size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-950 dark:text-white">
                              {category.name}
                            </p>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                              Siap dicari di katalog
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-400" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="categories" className="py-10 dark:bg-slate-950 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-black uppercase tracking-wide text-blue-600 dark:text-blue-400">
              Kategori Produk
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">
              Kategori Populer
            </h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400 sm:text-base">
              Pilih kategori produk sesuai kebutuhan dan temukan perangkat yang
              cocok untuk aktivitas kamu.
            </p>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 sm:mt-9 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6">
            {categories.map((category) => {
              const Icon = category.icon;

              return (
                <Link
                  key={category.name}
                  to={`/products?category=${encodeURIComponent(category.name)}`}
                  className="group rounded-3xl border border-slate-200 bg-white p-4 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/10 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500 sm:p-6"
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-950/50 dark:text-blue-300 sm:h-16 sm:w-16">
                    <Icon className="h-6 w-6 sm:h-8 sm:w-8" />
                  </div>

                  <p className="mt-3 text-sm font-black text-slate-950 dark:text-white sm:mt-4 sm:text-base">
                    {category.name}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="pb-12 dark:bg-slate-950 sm:pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-blue-600 dark:text-blue-400">
                Rekomendasi
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">
                Produk Pilihan
              </h2>
              <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400 sm:text-base">
                Produk pilihan terbaik dari BaenTech Store.
              </p>
            </div>

            <Link
              to="/products"
              className="inline-flex w-fit items-center gap-2 rounded-2xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-black text-blue-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-md dark:border-blue-900/60 dark:bg-slate-900 dark:text-blue-300"
            >
              Lihat Semua
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {loading &&
              Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-72 animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
                />
              ))}

            {error && (
              <div className="col-span-full rounded-3xl border border-red-200 bg-red-50 p-6 text-center font-bold text-red-600 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </div>
            )}

            {!loading && !error && products.length === 0 && (
              <div className="col-span-full rounded-3xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
                <p className="text-lg font-black text-slate-950 dark:text-white">
                  Belum ada produk tersedia.
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  Produk aktif akan tampil di bagian ini.
                </p>
              </div>
            )}

            {!loading &&
              !error &&
              products
                .slice(0, 4)
                .map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-12 dark:bg-slate-950 sm:px-6 sm:pb-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-3 rounded-[2rem] border border-blue-100 bg-blue-50/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:gap-5 sm:p-6 md:grid-cols-4">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <div
                  key={benefit.title}
                  className="flex items-center gap-3 rounded-2xl bg-white/70 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-md dark:bg-slate-950/40 dark:hover:bg-slate-950 sm:gap-4 sm:p-4"
                >
                  <div className="rounded-xl bg-blue-100 p-3 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300 sm:rounded-2xl sm:p-4">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-950 dark:text-white sm:text-base">
                      {benefit.title}
                    </h3>
                    <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 sm:text-sm">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer id="footer" className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-5 px-4 py-8 sm:px-6 sm:py-12 md:grid-cols-4 md:gap-10">
          <div className="col-span-2 md:col-span-1">
            <div className="inline-flex">
              <BrandLogo dark />
            </div>

            <p className="mt-4 max-w-xs text-[12px] font-semibold leading-relaxed text-slate-300 sm:text-sm">
              BaenTech Store adalah toko online yang menyediakan produk teknologi
              berkualitas dengan harga terbaik untuk Anda.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-black sm:text-base">Menu</h3>
            <div className="mt-3 space-y-2 text-[11px] font-semibold text-slate-300 sm:mt-4 sm:space-y-3 sm:text-sm">
              <p>Home</p>
              <p>Produk</p>
              <p>Kategori</p>
              <p>Tentang Kami</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-black sm:text-base">Informasi</h3>
            <div className="mt-3 space-y-2 text-[11px] font-semibold text-slate-300 sm:mt-4 sm:space-y-3 sm:text-sm">
              <p>Cara Belanja</p>
              <p>Pembayaran</p>
              <p>Pengiriman</p>
              <p>Garansi & Retur</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-black sm:text-base">Kontak Kami</h3>
            <div className="mt-3 space-y-2 text-[11px] font-semibold text-slate-300 sm:mt-4 sm:space-y-3 sm:text-sm">
              <p>Jakarta, Indonesia</p>
              <p>+62 812-3456-7890</p>
              <p>support@baentech.store</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 px-4 py-4 text-center text-[11px] font-semibold text-slate-400 sm:text-sm">
          © 2026 BaenTech Store. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default Home;
