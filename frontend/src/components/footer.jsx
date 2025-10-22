import React from "react";
import { Link } from "react-router-dom";
import HMlogo from "../assets/HMlogo.png";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-primary text-ink relative border-t">
      {/* Decorative accent bar (traditional touch) */}
      <div className="h-1 w-full bg-gradient-to-r from-[var(--color-accent)] via-[var(--color-primary-600)] to-[var(--color-accent)]" />

      {/* Main content */}
      <div className="bg-primary">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-5 py-8 md:grid-cols-3 md:px-8">
          {/* Brand */}
          <div className="flex items-start gap-3">
            <img
              src={HMlogo}
              alt="HM Handmade"
              className="h-10 w-10 rounded object-contain"
            />
            <div>
              <h4 className="text-lg font-semibold">HM Handmade</h4>
              <p className="text-muted mt-1 text-sm">
                Tinh tế từ đôi tay – Mộc mạc bền lâu
              </p>
              <div className="text-ink/80 mt-3 flex flex-wrap gap-2 text-xs">
                <span className="border-primary-600/30 bg-surface rounded-full border px-2 py-0.5">
                  Thủ công
                </span>
                <span className="border-primary-600/30 bg-surface rounded-full border px-2 py-0.5">
                  Bền vững
                </span>
                <span className="border-primary-600/30 bg-surface rounded-full border px-2 py-0.5">
                  Tỉ mỉ
                </span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="mb-3 font-semibold">Khám phá</h4>
            <nav className="flex flex-col gap-2 text-sm">
              <Link className="hover:underline" to="/">
                Trang chủ
              </Link>
              <Link className="hover:underline" to="/search">
                Tất cả sản phẩm
              </Link>
              <Link className="hover:underline" to="/cart">
                Giỏ hàng
              </Link>
              <Link className="hover:underline" to="/order">
                Đặt hàng
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="md:text-right">
            <h4 className="mb-3 font-semibold">Liên hệ</h4>
            <div className="text-sm">
              <div>
                <b>Email:</b> nguyenthithu270603@gmail.com
              </div>
              <div className="mt-1">
                <b>Điện thoại:</b> 036 851 7314
              </div>
              <div className="mt-1">
                <b>Địa chỉ:</b> Đại học Công nghiệp Hà Nội
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-primary/60 bg-surface text-muted border-t py-3 text-center text-xs">
        © {year} HM Handmade • Tôn vinh giá trị truyền thống trong một diện mạo
        hiện đại
      </div>
    </footer>
  );
}
