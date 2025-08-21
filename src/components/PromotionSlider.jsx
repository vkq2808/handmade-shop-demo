import React, { useEffect, useMemo, useState, useRef } from "react";

const fallbackBanners = [
  {
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop",
    link: "/products",
    title: "Ưu đãi mùa này",
    subtitle: "Giảm giá cho sản phẩm thủ công chọn lọc",
  },
  {
    image:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1600&auto=format&fit=crop",
    link: "/products?sort=newest",
    title: "Hàng mới về",
    subtitle: "Khám phá thiết kế mới nhất",
  },
];

export default function PromotionSlider({ promotions = [], handleNavigate }) {
  const slides = useMemo(() => (promotions?.length ? promotions : fallbackBanners), [promotions]);
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!slides.length) return undefined;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, [slides.length]);

  const go = (dir) => {
    if (!slides.length) return;
    setIndex((i) => (dir === "next" ? (i + 1) % slides.length : (i - 1 + slides.length) % slides.length));
  };

  const select = (i) => setIndex(i);

  if (!slides.length) return null;

  const current = slides[index];

  return (
    <section className="relative mx-auto mt-4 w-full max-w-7xl px-5 md:px-8">
      <div className="relative h-52 w-full overflow-hidden rounded-2xl md:h-72 lg:h-80">
        <img
          src={current?.image}
          alt={current?.title || "Promotion"}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          onClick={() => current?.link && handleNavigate?.(current.link)}
          role={current?.link ? "button" : undefined}
        />
        {current?.title || current?.subtitle ? (
          <div className="absolute inset-0 bg-gradient-to-tr from-black/45 to-transparent" />
        ) : null}
        {(current?.title || current?.subtitle) && (
          <div className="absolute left-4 top-4 max-w-lg rounded-lg bg-black/30 p-3 text-white backdrop-blur-sm md:left-6 md:top-6 md:p-4">
            {current?.title && <h3 className="text-lg font-semibold md:text-2xl">{current.title}</h3>}
            {current?.subtitle && <p className="mt-1 text-sm md:text-base">{current.subtitle}</p>}
          </div>
        )}
        {/* Arrows */}
        <button
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow hover:bg-white"
          onClick={() => go("prev")}
          aria-label="Previous"
        >
          ‹
        </button>
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow hover:bg-white"
          onClick={() => go("next")}
          aria-label="Next"
        >
          ›
        </button>
        {/* Dots */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`h-2 w-2 rounded-full ${i === index ? "bg-white" : "bg-white/60"}`}
              onClick={() => select(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
