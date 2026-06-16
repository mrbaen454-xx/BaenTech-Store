import { Routes, Route } from "react-router";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Products from "../pages/Products";
import ProductDetail from "../pages/ProductDetail";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminProducts from "../pages/admin/AdminProducts";
import AdminProductForm from "../pages/admin/AdminProductFrom";
import AdminProfile from "../pages/admin/AdminProfile";
import AdminCategories from "../pages/admin/AdminCategories";
import AdminOrders from "../pages/admin/AdminOrders";
import AdminPayments from "../pages/admin/AdminPayments";

import ProtectedRoute from "../components/ProtectedRoute";

function AppRoutes() {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/products" element={<Products />} />
      <Route path="/products/:id" element={<ProductDetail />} />

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
        path="/admin/products/create"
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
    </Routes>
  );
}

export default AppRoutes;
