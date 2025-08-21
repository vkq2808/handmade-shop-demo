import React from "react";
import { Link, useLocation } from "react-router-dom";
import MainIcon from "../MainIcon";

const NavItem = ({ to, label }) => {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${active ? "bg-primary text-ink" : "text-ink hover:bg-primary/60"
        }`}
    >
      {label}
    </Link>
  );
};

const AdminSidebar = () => {
  const navItems = [
    { to: "/admin/dashboard", label: "Bảng điều khiển" },
    { to: "/admin/products", label: "Sản phẩm" },
    { to: "/admin/categories", label: "Danh mục" },
    { to: "/admin/imports", label: "Nhập hàng" },
    { to: "/admin/orders", label: "Đơn hàng" },
    { to: "/admin/users", label: "Người dùng" },
    { to: "/admin/settings", label: "Cài đặt" },
  ].sort((a, b) => a.label.localeCompare(b.label));
  return (
    <aside className="bg-surface border-r border-primary w-56 flex-shrink-0 p-3 sticky top-0 h-[calc(100vh)]">
      <div className="mb-4">
        <div className="flex justify-center items-center w-full">
          <MainIcon size={32} />
        </div>
        <h2 className="text-lg font-bold">HM Admin</h2>
        <p className="text-xs text-muted">Quản trị hệ thống</p>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => (
          <NavItem key={item.to} to={item.to} label={item.label} />
        ))}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
