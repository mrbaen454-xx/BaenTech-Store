import { Link } from "react-router";

function ProductCard({ product }) {
  const productBaseUrl = import.meta.env.VITE_PRODUCT_API_BASE_URL;

  const categoryName =
    product.categoryName ||
    product.category?.name ||
    (typeof product.category === "string"
      ? product.category
      : "Tanpa Kategori");

  const rawImage =
    product.imageUrl || product.image || product.photo || product.thumbnail;

  const imageUrl = rawImage
    ? rawImage.startsWith("http")
      ? rawImage
      : `${productBaseUrl}${rawImage}`
    : "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80";

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white/95 p-2.5 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:bg-white hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-600 dark:hover:bg-slate-800 sm:rounded-3xl sm:p-5">
      <div className="flex h-28 items-center justify-center overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 sm:h-52 sm:rounded-2xl">
        <img
          src={imageUrl}
          alt={product.name}
          className="h-full w-full rounded-xl object-cover transition duration-300 group-hover:scale-105 sm:rounded-2xl"
        />
      </div>

      <div className="mt-2.5 sm:mt-5">
        <h3 className="line-clamp-2 text-xs font-black leading-snug text-slate-950 dark:text-white sm:text-lg">
          {product.name}
        </h3>

        <p className="mt-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 sm:text-sm">
          {categoryName}
        </p>

        <p className="mt-2 text-xs font-black text-blue-600 dark:text-blue-400 sm:mt-4 sm:text-lg">
          Rp {Number(product.price).toLocaleString("id-ID")}
        </p>

        <Link
          to={`/products/${product.id}`}
          className="mt-3 block rounded-lg border-2 border-blue-600 py-2 text-center text-[11px] font-black text-blue-600 transition hover:bg-blue-600 hover:text-white dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white sm:mt-5 sm:rounded-xl sm:py-3 sm:text-sm"
        >
          Lihat Detail
        </Link>
      </div>
    </div>
  );
}

export default ProductCard;
