import { Routes, Route } from "react-router";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Products from "../pages/Products";
import ProductDetail from "../pages/ProductDetail";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminProducts from "../pages/admin/AdminProducts";
import AdminProductForm from "../pages/admin/AdminProductFrom";
import AdminProductReviews from "../pages/admin/AdminProductReviews";
import AdminProductReviewsIndex from "../pages/admin/AdminProductReviewsIndex";
import AdminProfile from "../pages/admin/AdminProfile";
import AdminCategories from "../pages/admin/AdminCategories";
import AdminOrders from "../pages/admin/AdminOrders";
import AdminPayments from "../pages/admin/AdminPayments";
import AdminShipping from "../pages/admin/AdminShipping";
import AdminReports from "../pages/admin/AdminReports";
import UserProfile from "../pages/UserProfile";
import Cart from "../pages/Cart";
import CheckoutV2 from "../pages/CheckoutV2";
import PaymentResult from "../pages/PaymentResult";
import MyOrders from "../pages/MyOrders";
import OAuthSuccess from "../pages/OAuthSuccess";

import ProtectedRoute, {
  GuestRoute,
  UserOnlyRoute,
} from "../components/ProtectedRoute";

function AppRoutes() {
  return (
    <Routes>
      {/* PUBLIC + USER ONLY */}
      <Route
        path="/"
        element={
          <UserOnlyRoute>
            <Home />
          </UserOnlyRoute>
        }
      />
      <Route
        path="/products"
        element={
          <UserOnlyRoute>
            <Products />
          </UserOnlyRoute>
        }
      />
      <Route
        path="/products/:id"
        element={
          <UserOnlyRoute>
            <ProductDetail />
          </UserOnlyRoute>
        }
      />

      {/* GUEST ONLY */}
      <Route
        path="/login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <Register />
          </GuestRoute>
        }
      />
      <Route path="/oauth2/success" element={<OAuthSuccess />} />

      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={["USER", "ROLE_USER"]}>
            <UserProfile />
          </ProtectedRoute>
        }
      />

      {/* ADMIN */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "ROLE_ADMIN"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/profile"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "ROLE_ADMIN"]}>
            <AdminProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "ROLE_ADMIN"]}>
            <AdminProducts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/product-reviews"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "ROLE_ADMIN"]}>
            <AdminProductReviewsIndex />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products/create"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "ROLE_ADMIN"]}>
            <AdminProductForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products/add"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "ROLE_ADMIN"]}>
            <AdminProductForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products/edit/:id"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "ROLE_ADMIN"]}>
            <AdminProductForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products/:id/reviews"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "ROLE_ADMIN"]}>
            <AdminProductReviews />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "ROLE_ADMIN"]}>
            <AdminCategories />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "ROLE_ADMIN"]}>
            <AdminOrders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/payments"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "ROLE_ADMIN"]}>
            <AdminPayments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/shipping"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "ROLE_ADMIN"]}>
            <AdminShipping />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "ROLE_ADMIN"]}>
            <AdminReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cart"
        element={
          <ProtectedRoute allowedRoles={["USER", "ROLE_USER"]}>
            <Cart />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-orders"
        element={
          <ProtectedRoute allowedRoles={["USER", "ROLE_USER"]}>
            <MyOrders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute allowedRoles={["USER", "ROLE_USER"]}>
            <CheckoutV2 />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment/finish"
        element={
          <ProtectedRoute allowedRoles={["USER", "ROLE_USER"]}>
            <PaymentResult />
          </ProtectedRoute>
        }
      />

      <Route
        path="/payment/pending"
        element={
          <ProtectedRoute allowedRoles={["USER", "ROLE_USER"]}>
            <PaymentResult />
          </ProtectedRoute>
        }
      />

      <Route
        path="/payment/error"
        element={
          <ProtectedRoute allowedRoles={["USER", "ROLE_USER"]}>
            <PaymentResult />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default AppRoutes;
