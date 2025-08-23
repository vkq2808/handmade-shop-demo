import React from "react";

export default function AboutPage() {
  return (
    <div className="bg-parchment bg-page min-h-screen w-full">
      <section className="mx-auto w-full max-w-7xl px-5 md:px-8 py-10">
        <div className="rounded-2xl bg-white/70 p-6 md:p-10 shadow-sm">
          <h1 className="text-ink text-3xl md:text-4xl font-semibold text-center">Giới thiệu HandMade Shop</h1>
          <p className="text-muted mt-4 max-w-3xl mx-auto text-base md:text-lg text-center">
            HandMade Shop tôn vinh sự mộc mạc và bền vững qua các sản phẩm thủ công làm bằng tay.
            Mỗi sản phẩm là câu chuyện của sự tỉ mỉ, tình yêu và cam kết với môi trường.
          </p>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card-handmade p-5">
              <h3 className="text-ink font-semibold text-lg">Chất liệu thân thiện</h3>
              <p className="text-muted mt-2 text-sm">Chúng tôi chọn lọc chất liệu an toàn, bền bỉ và thân thiện với thiên nhiên.</p>
            </div>
            <div className="card-handmade p-5">
              <h3 className="text-ink font-semibold text-lg">Tỉ mỉ thủ công</h3>
              <p className="text-muted mt-2 text-sm">Mỗi chi tiết đều được chăm chút bởi bàn tay người thợ lành nghề.</p>
            </div>
            <div className="card-handmade p-5">
              <h3 className="text-ink font-semibold text-lg">Đồng hành dài lâu</h3>
              <p className="text-muted mt-2 text-sm">Sự bền lâu và cảm xúc là điều chúng tôi mong muốn gửi gắm đến bạn.</p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <a href="/products" className="btn-primary inline-block">Khám phá sản phẩm</a>
          </div>
        </div>
      </section>
    </div>
  );
}
