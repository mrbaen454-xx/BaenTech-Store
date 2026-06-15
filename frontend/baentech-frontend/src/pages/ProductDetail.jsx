import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  BadgeCheck,
  Box,
  ShieldCheck,
  ShoppingCart,
  Tag,
} from "lucide-react";

import Navbar from "../components/Navbar";
import { getProductByIdApi } from "../api/productApi";
import { useAuth } from "../context/AuthContext";

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const productBaseUrl = import.meta.env.VITE_PRODUCT_API_BASE_URL;

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProductByIdApi(id);
        setProduct(data);
      } catch (err) {
        console.log(err);
        setError("Gagal mengambil detail produk.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const getCategoryName = (item) => {
    return (
      item?.categoryName ||
      item?.category?.name ||
      (typeof item?.category === "string" ? item.category : "Tanpa Kategori")
    );
  };

  const getImageUrl = (item) => {
    const rawImage =
      item?.imageUrl || item?.image || item?.photo || item?.thumbnail;

    if (!rawImage) {
      return "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80";
    }

    if (rawImage.startsWith("http")) {
      return rawImage;
    }

    return `${productBaseUrl}${rawImage}`;
  };

  const handleBuy = () => {
    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: `/products/${id}`,
        },
      });
      return;
    }

    alert("Fitur keranjang akan kita buat di tahap berikutnya.");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />

      <section className="mx-auto max-w-7xl px-6 py-10">
        <Link
          to="/products"
          className="mb-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm hover:text-blue-600"
        >
          <ArrowLeft size={18} />
          Kembali ke Produk
        </Link>

        {loading && (
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="h-[500px] animate-pulse rounded-3xl bg-white"></div>
            <div className="h-[500px] animate-pulse rounded-3xl bg-white"></div>
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center">
            <p className="font-black text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && product && (
          <div className="grid gap-8 lg:grid-cols-2">
            {/* IMAGE */}
            <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5 lg:rounded-[2rem]">
              <img
                src={getImageUrl(product)}
                alt={product.name}
                className="h-64 w-full rounded-2xl object-cover sm:h-96 lg:h-[500px] lg:rounded-[1.5rem]"
              />
            </div>

            {/* DETAIL */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8 lg:rounded-[2rem]">
              <div className="mb-4 flex flex-wrap gap-3">
                <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-black text-blue-600">
                  {getCategoryName(product)}
                </span>

                <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-black text-green-600">
                  {product.status || "ACTIVE"}
                </span>
              </div>

              <h1 className="text-2xl font-black leading-tight text-slate-950 dark:text-white sm:text-4xl">
                {product.name}
              </h1>

              <p className="mt-3 text-lg font-semibold text-slate-500">
                Brand: {product.brand || "-"}
              </p>

              <p className="mt-5 text-2xl font-black text-blue-600 dark:text-blue-400 sm:mt-6 sm:text-4xl">
                Rp {Number(product.price).toLocaleString("id-ID")}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4">
                <div className="rounded-2xl bg-slate-50 p-5">
                  <div className="flex items-center gap-3">
                    <Box className="text-blue-600" />
                    <div>
                      <p className="text-sm font-bold text-slate-500">Stok</p>
                      <p className="font-black text-slate-950">
                        {product.stock} tersedia
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="text-blue-600" />
                    <div>
                      <p className="text-sm font-bold text-slate-500">
                        Garansi
                      </p>
                      <p className="font-black text-slate-950">
                        {product.warranty || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <div className="flex items-center gap-3">
                    <Tag className="text-blue-600" />
                    <div>
                      <p className="text-sm font-bold text-slate-500">
                        Kategori
                      </p>
                      <p className="font-black text-slate-950">
                        {getCategoryName(product)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <div className="flex items-center gap-3">
                    <BadgeCheck className="text-blue-600" />
                    <div>
                      <p className="text-sm font-bold text-slate-500">
                        Kualitas
                      </p>
                      <p className="font-black text-slate-950">
                        Produk Original
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h2 className="text-xl font-black text-slate-950">
                  Deskripsi Produk
                </h2>
                <p className="mt-3 leading-relaxed text-slate-600">
                  {product.description || "Belum ada deskripsi produk."}
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  onClick={handleBuy}
                  className="flex items-center gap-2 rounded-2xl bg-blue-600 px-7 py-4 font-black text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700"
                >
                  <ShoppingCart size={20} />
                  {isAuthenticated
                    ? "Tambah ke Keranjang"
                    : "Login untuk Membeli"}
                </button>

                <Link
                  to="/products"
                  className="rounded-2xl border border-slate-300 bg-white px-7 py-4 font-black text-slate-950 hover:border-blue-600 hover:text-blue-600"
                >
                  Lihat Produk Lain
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default ProductDetail;
