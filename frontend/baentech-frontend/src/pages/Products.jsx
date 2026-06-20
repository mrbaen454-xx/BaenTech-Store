import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Search, SlidersHorizontal, PackageOpen } from "lucide-react";

import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import { getProductsApi } from "../api/productApi";

function Products() {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("terbaru");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getCategoryName = (product) => {
    return (
      product.categoryName ||
      product.category?.name ||
      (typeof product.category === "string"
        ? product.category
        : "Tanpa Kategori")
    );
  };

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

  const categories = useMemo(() => {
    const categoryList = products.map((product) => getCategoryName(product));
    return ["Semua", ...new Set(categoryList)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (selectedCategory !== "Semua") {
      result = result.filter((product) => {
        return getCategoryName(product) === selectedCategory;
      });
    }

    if (search.trim() !== "") {
      const keyword = search.toLowerCase();

      result = result.filter((product) => {
        const name = product.name?.toLowerCase() || "";
        const brand = product.brand?.toLowerCase() || "";
        const category = getCategoryName(product).toLowerCase();

        return (
          name.includes(keyword) ||
          brand.includes(keyword) ||
          category.includes(keyword)
        );
      });
    }

    if (sort === "termurah") {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    }

    if (sort === "termahal") {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    }

    if (sort === "stok") {
      result.sort((a, b) => Number(b.stock) - Number(a.stock));
    }

    if (sort === "terbaru") {
      result.sort((a, b) => Number(b.id) - Number(a.id));
    }

    return result;
  }, [products, selectedCategory, search, sort]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-blue-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-24 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-blue-600 shadow-sm dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300 sm:text-sm">
              BaenTech Products
            </p>

            <h1 className="text-3xl font-black leading-tight text-slate-950 dark:text-white sm:text-5xl">
              Temukan produk teknologi terbaik untuk kebutuhanmu.
            </h1>

            <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-slate-600 dark:text-slate-300 sm:mt-5 sm:text-lg">
              Lihat semua produk BaenTech Store. Cari produk, pilih kategori,
              dan urutkan sesuai kebutuhan kamu.
            </p>
          </div>
        </div>
      </section>

      {/* FILTER */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-4 shadow-sm shadow-slate-200/70 backdrop-blur-xl transition-all duration-300 dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-black/20 sm:rounded-[2rem] sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_230px]">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100 dark:border-slate-800 dark:bg-slate-950 dark:focus-within:bg-slate-950 dark:focus-within:ring-blue-950/60">
              <Search size={20} className="shrink-0 text-slate-500" />
              <input
                type="text"
                placeholder="Cari produk, brand, atau kategori..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100 dark:border-slate-800 dark:bg-slate-950 dark:focus-within:bg-slate-950 dark:focus-within:ring-blue-950/60">
              <SlidersHorizontal size={20} className="shrink-0 text-slate-500" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none dark:text-white"
              >
                <option value="terbaru">Terbaru</option>
                <option value="termurah">Harga Termurah</option>
                <option value="termahal">Harga Termahal</option>
                <option value="stok">Stok Terbanyak</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:gap-3 sm:overflow-visible sm:pb-0">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-black transition-all duration-200 active:scale-[0.98] sm:px-5 sm:py-2.5 sm:text-sm ${
                  selectedCategory === category
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                    : "border border-slate-200 bg-slate-50 text-slate-700 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-blue-700 dark:hover:bg-blue-950/40 dark:hover:text-blue-300"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCT LIST */}
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 sm:pb-16 lg:px-8">
        <div className="mb-5 flex flex-col gap-3 sm:mb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">
              Semua Produk
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
              Menampilkan {filteredProducts.length} produk
            </p>
          </div>

          <Link
            to="/"
            className="w-fit rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-500 hover:text-blue-600 active:scale-[0.98] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-blue-300 sm:px-5 sm:py-3 sm:text-sm"
          >
            Kembali ke Home
          </Link>
        </div>

        {loading && (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div
                key={item}
                className="h-72 animate-pulse rounded-[1.5rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:h-96 sm:rounded-[1.75rem]"
              >
                <div className="m-3 h-32 rounded-2xl bg-slate-100 dark:bg-slate-800 sm:h-52" />
                <div className="space-y-3 px-4 pt-2">
                  <div className="h-4 w-3/4 rounded-full bg-slate-100 dark:bg-slate-800" />
                  <div className="h-4 w-1/2 rounded-full bg-slate-100 dark:bg-slate-800" />
                  <div className="h-10 rounded-2xl bg-slate-100 dark:bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-[2rem] border border-red-200 bg-red-50 p-8 text-center shadow-sm dark:border-red-900 dark:bg-red-950/30">
            <p className="font-black text-red-600 dark:text-red-300">{error}</p>
          </div>
        )}

        {!loading && !error && filteredProducts.length === 0 && (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400 dark:bg-slate-950">
              <PackageOpen size={42} />
            </div>
            <h3 className="mt-4 text-xl font-black text-slate-900 dark:text-white">
              Produk tidak ditemukan
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
              Coba gunakan kata kunci lain, ubah kategori, atau reset filter produk.
            </p>
          </div>
        )}

        {!loading && !error && filteredProducts.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Products;
