export const DEFAULT_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80";

export function getProductImageUrl(imageUrl, baseUrl = "") {
  if (!imageUrl) return "";

  const value = String(imageUrl).trim();

  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("blob:") || value.startsWith("data:")) return value;

  const normalizedPath = value.startsWith("/uploads/products/")
    ? value.replace("/uploads/products/", "/api/products/images/")
    : value;

  const cleanBaseUrl = String(baseUrl || "").replace(/\/+$/, "");
  const cleanPath = normalizedPath.startsWith("/")
    ? normalizedPath
    : `/${normalizedPath}`;

  return `${cleanBaseUrl}${cleanPath}`;
}

export function getProductRawImage(product) {
  return (
    product?.imageUrl ||
    product?.image_url ||
    product?.profileImageUrl ||
    product?.profile_image_url ||
    product?.image ||
    product?.productImage ||
    product?.photo ||
    product?.thumbnail ||
    ""
  );
}
