import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Homepage from "../pages/client/homepage";
import Login from "../pages/auth/login";
import Register from "../pages/auth/register";
import VerifyEmail from "../pages/auth/verifyEmail";
import ForgotPassword from "../pages/auth/forgotPassword";
import ResetPassword from "../pages/auth/resetPassword";
import ProductDetail from "../pages/client/productDetail";
import ProductsPage from "../pages/client/products";
import Search from "../pages/client/search";
import Cart from "../pages/client/cart";
import Order from "../pages/client/order";
import Profile from "../pages/client/profile";
import Header from "../components/header";
import Footer from "../components/footer";
import AdminLayout from "../pages/admin/AdminLayout.jsx";
import Dashboard from "../pages/admin/Dashboard.jsx";
import Products from "../pages/admin/Products.jsx";
import Categories from "../pages/admin/Categories.jsx";
import Orders from "../pages/admin/Orders.jsx";
import Users from "../pages/admin/Users.jsx";
import Imports from "../pages/admin/Imports.jsx";
import SettingsPage from "../pages/admin/Settings.jsx";
import CheckoutPage from "../pages/client/checkout.jsx";
import FavoritesPage from "../pages/client/favorites.jsx";
import AboutPage from "../pages/client/about.jsx";

export default function AppRoutes() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  return (
    <div
      style={{
        backgroundImage: `url("/banner.png")`,
        backgroundSize: "cover",
        backgroundRepeat: "repeat-y",
      }}
    >
      {!isAdminPath && <Header />}
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/search" element={<Search />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order" element={<Order />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={
          <>
            Not found.
          </>
        } />

        {/* Admin */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="categories" element={<Categories />} />
          <Route path="imports" element={<Imports />} />
          <Route path="orders" element={<Orders />} />
          <Route path="users" element={<Users />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
      {!isAdminPath && <Footer />}
    </div>
  );
}
