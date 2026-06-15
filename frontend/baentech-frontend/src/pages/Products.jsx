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
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />

      {/* HERO */}
      <section className="bg-gradient-to-br from-slate-100 via-slate-50 to-blue-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        {" "}
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="max-w-3xl">
            <p className="mb-3 inline-block rounded-full bg-blue-100 px-4 py-2 text-sm font-black text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
              BaenTech Products
            </p>

            <h1 className="text-4xl font-black leading-tight text-slate-950 dark:text-white md:text-5xl">
              Temukan produk teknologi terbaik untuk kebutuhanmu.
            </h1>

            <p className="mt-5 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              Lihat semua produk BaenTech Store. Sebelum login, kamu hanya bisa
              melihat produk dan detail produk.
            </p>
          </div>
        </div>
      </section>

      {/* FILTER */}
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
            <div className="flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3">
              <Search size={20} className="text-slate-500" />
              <input
                type="text"
                placeholder="Cari produk, brand, atau kategori..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3">
              <SlidersHorizontal size={20} className="text-slate-500" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full bg-transparent text-sm font-bold outline-none"
              >
                <option value="terbaru">Terbaru</option>
                <option value="termurah">Harga Termurah</option>
                <option value="termahal">Harga Termahal</option>
                <option value="stok">Stok Terbanyak</option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-5 py-2.5 text-sm font-black transition ${
                  selectedCategory === category
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                    : "bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCT LIST */}
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-950">Semua Produk</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Menampilkan {filteredProducts.length} produk
            </p>
          </div>

          <Link
            to="/"
            className="hidden rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:border-blue-500 hover:text-blue-600 md:block"
          >
            Kembali ke Home
          </Link>
        </div>

        {loading && (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {" "}
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-64 animate-pulse rounded-2xl bg-white shadow-sm dark:bg-slate-900 sm:h-96 sm:rounded-3xl"
              ></div>
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="font-black text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && filteredProducts.length === 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
            <PackageOpen size={60} className="mx-auto text-slate-400" />
            <h3 className="mt-4 text-xl font-black text-slate-900">
              Produk tidak ditemukan
            </h3>
            <p className="mt-2 text-slate-500">
              Coba gunakan kata kunci atau kategori yang lain.
            </p>
          </div>
        )}

        {!loading && !error && filteredProducts.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {" "}
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
