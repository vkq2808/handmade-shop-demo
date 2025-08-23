import React from "react";

const fallbackPolicies = [
  {
    title: "Miễn phí vận chuyển",
    description: "Cho đơn từ 500K tại TP.HCM",
    icon: "🚚",
  },
  {
    title: "Đổi trả dễ dàng",
    description: "Trong 7 ngày nếu lỗi do nhà sản xuất",
    icon: "🔁",
  },
  {
    title: "Thanh toán an toàn",
    description: "Hỗ trợ COD và ví điện tử",
    icon: "🔒",
  },
  {
    title: "Hỗ trợ 24/7",
    description: "Liên hệ qua chat hoặc hotline",
    icon: "💬",
  },
];

export default function Policies({ policies = [] }) {
  const items = policies?.length ? policies : fallbackPolicies;

  return (
    <section className="mx-auto w-full max-w-7xl px-5 pb-12 md:px-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4">
        {items.map((p, i) => (
          <div key={i} className="card-handmade flex items-start gap-3 p-4">
            <div className="text-2xl" aria-hidden>
              {p.icon || "✅"}
            </div>
            <div>
              <div className="text-ink text-sm font-semibold md:text-base">{p.title}</div>
              <div className="text-muted mt-0.5 text-xs md:text-sm">{p.description}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
