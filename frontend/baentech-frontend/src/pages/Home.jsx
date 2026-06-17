import { useEffect, useState } from "react";
import { Link } from "react-router";
import logo from "../assets/baentech-logo.png";
import {
  Laptop,
  Keyboard,
  Mouse,
  Headphones,
  Monitor,
  Cable,
  ShieldCheck,
  Truck,
  BadgeCheck,
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
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950">
      {" "}
      <Navbar />
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-blue-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        {" "}
        <div className="absolute left-0 top-0 h-52 w-52 rounded-full bg-blue-200 blur-3xl sm:h-72 sm:w-72"></div>
        <div className="absolute right-0 top-20 h-64 w-64 rounded-full bg-blue-300 blur-3xl sm:h-96 sm:w-96"></div>
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-16 md:grid-cols-2 md:gap-12 md:py-20">
          <div>
            <h1 className="text-3xl font-black leading-tight text-slate-950 dark:text-white sm:text-5xl md:text-6xl">
              Teknologi Terbaik <br />
              <span className="text-blue-600">Untuk Hidup Lebih Mudah</span>
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:mt-6 sm:text-lg">
              Temukan berbagai produk teknologi berkualitas dengan harga terbaik
              hanya di{" "}
              <span className="font-black text-slate-950 dark:text-white">
                BaenTech Store
              </span>
            </p>

            <div className="mt-6 flex flex-wrap gap-3 sm:mt-8 sm:gap-4">
              <Link
                to="/products"
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 sm:px-7 sm:py-4 sm:text-base"
              >
                Lihat Produk
              </Link>

              <a
                href="#footer"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-950 hover:border-blue-600 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:px-7 sm:py-4 sm:text-base"
              >
                Tentang Kami
              </a>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3 sm:mt-12 sm:gap-5">
              <div className="flex items-center gap-2 sm:gap-3">
                <ShieldCheck className="h-5 w-5 text-blue-600 sm:h-6 sm:w-6" />
                <div>
                  <h4 className="text-[11px] font-black text-slate-950 dark:text-white sm:text-sm">
                    Produk Original
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 sm:text-xs">
                    100% Produk Asli
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <BadgeCheck className="h-5 w-5 text-blue-600 sm:h-6 sm:w-6" />
                <div>
                  <h4 className="text-[11px] font-black text-slate-950 dark:text-white sm:text-sm">
                    Garansi Resmi
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 sm:text-xs">
                    Hingga 2 Tahun
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <Truck className="h-5 w-5 text-blue-600 sm:h-6 sm:w-6" />
                <div>
                  <h4 className="text-[11px] font-black text-slate-950 dark:text-white sm:text-sm">
                    Pengiriman Cepat
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 sm:text-xs">
                    Indonesia
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute right-0 top-10 h-52 w-52 rounded-full bg-blue-300 sm:h-80 sm:w-80"></div>

            <div className="relative rounded-3xl bg-white/40 p-3 dark:bg-slate-800/60 sm:rounded-[2rem] sm:p-6">
              <img
                src="https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=1000&q=80"
                alt="BaenTech Hero"
                className="h-56 w-full rounded-3xl object-cover shadow-2xl sm:h-[420px] sm:rounded-[2rem]"
              />
            </div>
          </div>
        </div>
      </section>
      {/* KATEGORI */}
      <section
        id="categories"
        className="bg-slate-100/70 py-10 dark:bg-slate-950 sm:py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">
            Kategori Populer
          </h2>

          <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400 sm:mt-3 sm:text-base">
            Pilih kategori produk sesuai kebutuhan kamu
          </p>

          <div className="mt-6 grid grid-cols-3 gap-2 sm:mt-8 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6">
            {categories.map((category) => {
              const Icon = category.icon;

              return (
                <Link
                  key={category.name}
                  to={`/products?category=${encodeURIComponent(category.name)}`}
                  className="group rounded-2xl border border-slate-200 bg-white/90 p-3 text-center shadow-sm transition hover:-translate-y-1 hover:border-blue-500 hover:bg-blue-50 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500 dark:hover:bg-slate-800 sm:rounded-3xl sm:p-7"
                >
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-950/50 dark:text-blue-400 dark:group-hover:bg-blue-600 dark:group-hover:text-white sm:h-16 sm:w-16 sm:rounded-2xl">
                    <Icon className="h-5 w-5 sm:h-8 sm:w-8" />
                  </div>

                  <p className="mt-2 text-[11px] font-black text-slate-950 dark:text-white sm:mt-4 sm:text-base">
                    {category.name}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
      {/* PRODUK */}
      <section className="bg-slate-100/70 pb-12 dark:bg-slate-950 sm:pb-16">
        {" "}
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-6 flex items-center justify-between gap-4 sm:mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">
                Rekomendasi Produk
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 sm:mt-2 sm:text-base">
                Produk pilihan terbaik dari BaenTech Store
              </p>
            </div>

            <Link
              to="/products"
              className="shrink-0 text-xs font-black text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 sm:text-base"
            >
              Lihat Semua →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {loading && (
              <p className="col-span-full text-center font-semibold text-slate-500 dark:text-slate-400">
                Memuat produk...
              </p>
            )}

            {error && (
              <p className="col-span-full text-center font-semibold text-red-500">
                {error}
              </p>
            )}

            {!loading && !error && products.length === 0 && (
              <p className="col-span-full text-center font-semibold text-slate-500 dark:text-slate-400">
                Belum ada produk tersedia.
              </p>
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
      {/* BENEFIT */}
      <section className="bg-white px-4 pb-12 dark:bg-slate-950 sm:px-6 sm:pb-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-3 rounded-3xl bg-blue-50 p-4 dark:bg-slate-900 sm:gap-6 sm:p-8 md:grid-cols-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="rounded-xl bg-blue-100 p-3 text-blue-600 dark:bg-blue-950/50 sm:rounded-2xl sm:p-4">
                <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-950 dark:text-white sm:text-base">
                  Belanja Aman
                </h3>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 sm:text-sm">
                  Sistem terjamin
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <div className="rounded-xl bg-blue-100 p-3 text-blue-600 dark:bg-blue-950/50 sm:rounded-2xl sm:p-4">
                <BadgeCheck className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-950 dark:text-white sm:text-base">
                  Harga Terbaik
                </h3>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 sm:text-sm">
                  Kompetitif
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <div className="rounded-xl bg-blue-100 p-3 text-blue-600 dark:bg-blue-950/50 sm:rounded-2xl sm:p-4">
                <Truck className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-950 dark:text-white sm:text-base">
                  Pengiriman Cepat
                </h3>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 sm:text-sm">
                  Cepat & aman
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <div className="rounded-xl bg-blue-100 p-3 text-blue-600 dark:bg-blue-950/50 sm:rounded-2xl sm:p-4">
                <Headphones className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-950 dark:text-white sm:text-base">
                  Layanan 24/7
                </h3>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 sm:text-sm">
                  Siap membantu
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* FOOTER */}
      <footer id="footer" className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-5 px-4 py-8 sm:px-6 sm:py-12 md:grid-cols-4 md:gap-10">
          <div>
            <div className="inline-flex">
              <BrandLogo dark />
            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-slate-300 sm:mt-5 sm:text-sm">
              BaenTech Store adalah toko online yang menyediakan produk
              teknologi berkualitas dengan harga terbaik untuk Anda.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-black sm:text-base">Menu</h3>
            <div className="mt-3 space-y-2 text-[11px] text-slate-300 sm:mt-4 sm:space-y-3 sm:text-sm">
              <p>Home</p>
              <p>Produk</p>
              <p>Kategori</p>
              <p>Tentang Kami</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-black sm:text-base">Informasi</h3>
            <div className="mt-3 space-y-2 text-[11px] text-slate-300 sm:mt-4 sm:space-y-3 sm:text-sm">
              <p>Cara Belanja</p>
              <p>Pembayaran</p>
              <p>Pengiriman</p>
              <p>Garansi & Retur</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-black sm:text-base">Kontak Kami</h3>
            <div className="mt-3 space-y-2 text-[11px] text-slate-300 sm:mt-4 sm:space-y-3 sm:text-sm">
              <p>Jakarta, Indonesia</p>
              <p>+62 812-3456-7890</p>
              <p>support@baentech.store</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 px-4 py-4 text-center text-[11px] text-slate-400 sm:text-sm">
          © 2026 BaenTech Store. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default Home;
