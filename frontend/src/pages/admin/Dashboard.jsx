import React, { useEffect, useMemo, useState } from "react";
import {
  FaMoneyBillTrendUp,
  FaReceipt,
  FaRotateRight,
  FaArrowTrendUp,
  FaArrowTrendDown,
} from "react-icons/fa6";
import api from "../../utils/customAxios.js";

const numberFormat = (n) =>
  typeof n === "number" ? n.toLocaleString("vi-VN") : "0";

const StatCard = ({ title, value, icon, accent = false, trailing }) => (
  <div className={`card-handmade p-4 ${accent ? "bg-parchment" : "bg-white"}`}>
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm text-muted">{title}</div>
        <div className="mt-1 text-2xl font-bold">{value}</div>
        {trailing ? <div className="mt-1 text-xs">{trailing}</div> : null}
      </div>
      <div className="rounded-xl bg-primary/30 p-3 text-ink">{icon}</div>
    </div>
  </div>
);

// Lightweight SVG line sparkline (no external deps)
const Sparkline = ({ values = [], stroke = "#8d6748" }) => {
  const { points, area } = useMemo(() => {
    const maxW = 100;
    const maxH = 40;
    const n = values.length;
    if (n === 0) return { points: "", area: "" };
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const stepX = maxW / Math.max(1, n - 1);
    const coords = values.map((v, i) => {
      const x = i * stepX;
      const y = maxH - ((v - min) / range) * maxH;
      return [x, y];
    });
    const pts = coords.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
    const areaPts = `${pts} ${maxW},${maxH} 0,${maxH}`;
    return { points: pts, area: areaPts };
  }, [values]);

  return (
    <svg viewBox="0 0 100 40" className="h-24 w-full">
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {area && <polygon points={area} fill="url(#sparkFill)" />}
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        points={points}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

const TrendBadge = ({ current = 0, prev = 0 }) => {
  const diff = current - prev;
  const noPrev = !prev && prev !== 0;
  const pct = prev ? Math.round((diff / prev) * 100) : 0;
  const up = diff > 0;
  const down = diff < 0;
  const cls = up
    ? "text-green-700 bg-green-50 border-green-300"
    : down
      ? "text-red-700 bg-red-50 border-red-300"
      : "text-muted bg-white border-gray-200";
  return (
    <span className={`chip inline-flex items-center gap-1 ${cls}`}>
      {up ? <FaArrowTrendUp /> : down ? <FaArrowTrendDown /> : null}
      {noPrev ? "–" : `${up ? "+" : ""}${pct}%`}
    </span>
  );
};

const statusChipClass = (status = "") => {
  const s = String(status).toLowerCase();
  if (["paid", "completed", "delivered"].some((k) => s.includes(k))) {
    return "bg-green-50 border-green-300 text-green-700";
  }
  if (["pending", "processing"].some((k) => s.includes(k))) {
    return "bg-amber-50 border-amber-300 text-amber-700";
  }
  if (["cancel", "failed"].some((k) => s.includes(k))) {
    return "bg-red-50 border-red-300 text-red-700";
  }
  return "";
};

const RecentOrders = ({ items = [] }) => (
  <div className="card-handmade p-4">
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-lg font-semibold">Đơn hàng gần đây</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-muted">
            <th className="p-2">Mã</th>
            <th className="p-2">Khách</th>
            <th className="p-2">Tổng</th>
            <th className="p-2">Trạng thái</th>
            <th className="p-2">Ngày</th>
          </tr>
        </thead>
        <tbody>
          {items.map((o) => (
            <tr key={o._id} className="border-t hover:bg-parchment/40">
              <td className="p-2">{o._id.slice(-8)}</td>
              <td className="p-2">{o.user?.name || "Ẩn danh"}</td>
              <td className="p-2">{numberFormat(o.totalAmount)}</td>
              <td className="p-2">
                <span className={`capitalize ${statusChipClass(o.status)}`}>{o.status}</span>
              </td>
              <td className="p-2">
                {o.createdAt ? new Date(o.createdAt).toLocaleDateString("vi-VN") : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const Dashboard = () => {
  const [summary, setSummary] = useState({ totalOrders: 0, totalRevenue: 0 });
  const [daily, setDaily] = useState([]); // full sorted series: [{date, totalRevenue}]
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(14); // days

  const refresh = async () => {
    setLoading(true);
    try {
      // Summary
      const s = await api.get("/orders/stats");
      setSummary({
        totalOrders: s.data?.totalOrders || 0,
        totalRevenue: s.data?.totalRevenue || 0,
      });

      // Daily revenue trend
      const d = await api.get("/orders/stats/daily");
      const sorted = (d.data || []).sort((a, b) => (a._id > b._id ? 1 : -1));
      const series = sorted.map((x) => ({
        date: x._id,
        totalRevenue: x.totalRevenue || 0,
      }));
      setDaily(series);

      // Recent orders (top 5)
      const r = await api.get("/orders");
      const five = (r.data || []).slice(0, 5);
      setRecent(five);
    } catch {
      // ignore for dashboard visuals
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const displayDaily = useMemo(() => daily.slice(-period), [daily, period]);
  const revenueValues = displayDaily.map((d) => d.totalRevenue);
  const revenueSumThisMonth = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return daily
      .filter((d) => d.date.startsWith(ym))
      .reduce((acc, x) => acc + x.totalRevenue, 0);
  }, [daily]);
  const lastDayRevenue = daily.at(-1)?.totalRevenue || 0;
  const prevDayRevenue = daily.at(-2)?.totalRevenue || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bảng điều khiển</h1>
          <p className="text-muted mt-1 text-sm">Tổng quan doanh thu và đơn hàng gần đây</p>
        </div>
        <button className="btn-outline flex items-center gap-2" onClick={refresh}>
          <FaRotateRight /> Làm mới
        </button>
      </div>

      <div className="card-handmade bg-parchment/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-muted">Khoảng thời gian</div>
          <div className="flex gap-2">
            {[7, 14, 30].map((p) => (
              <button
                key={p}
                className={`chip ${period === p ? "chip-active" : ""}`}
                onClick={() => setPeriod(p)}
              >
                {p} ngày
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card-handmade p-4">
              <div className="flex items-center justify-between">
                <div className="w-24 h-3 rounded bg-parchment animate-pulse" />
                <div className="h-10 w-10 rounded-xl bg-parchment animate-pulse" />
              </div>
              <div className="mt-3 h-6 w-32 rounded bg-parchment animate-pulse" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              title="Tổng đơn (đã thanh toán)"
              value={numberFormat(summary.totalOrders)}
              icon={<FaReceipt className="h-5 w-5" />}
            />
            <StatCard
              title="Tổng doanh thu"
              value={`${numberFormat(summary.totalRevenue)} đ`}
              icon={<FaMoneyBillTrendUp className="h-5 w-5" />}
              accent
              trailing={<span className="text-muted">Cộng dồn</span>}
            />
            <StatCard
              title="Doanh thu tháng này"
              value={`${numberFormat(revenueSumThisMonth)} đ`}
              icon={<FaMoneyBillTrendUp className="h-5 w-5" />}
              trailing={<span className="text-muted">Theo tháng hiện tại</span>}
            />
            <StatCard
              title="Ngày gần nhất"
              value={`${numberFormat(lastDayRevenue)} đ`}
              icon={<FaMoneyBillTrendUp className="h-5 w-5" />}
              trailing={<TrendBadge current={lastDayRevenue} prev={prevDayRevenue} />}
            />
          </>
        )}
      </div>

      {/* Revenue trend */}
      <div className="card-handmade p-4">
        <div className="mb-2 flex items-end justify-between">
          <div>
            <h3 className="text-lg font-semibold">Xu hướng doanh thu ({period} ngày)</h3>
            <p className="text-muted text-sm">Tổng doanh thu theo ngày (đơn đã thanh toán)</p>
          </div>
          <div className="text-right">
            <div className="text-sm">Gần nhất</div>
            <div className="text-xl font-semibold">{numberFormat(revenueValues.at(-1) || 0)} đ</div>
          </div>
        </div>
        {loading ? (
          <div className="h-24 animate-pulse rounded bg-parchment" />
        ) : revenueValues.length ? (
          <Sparkline values={revenueValues} />
        ) : (
          <div className="text-muted">Chưa có dữ liệu</div>
        )}
        <div className="mt-2 grid grid-cols-2 text-xs text-muted">
          <span>{displayDaily[0]?.date || ""}</span>
          <span className="text-right">{displayDaily.at(-1)?.date || ""}</span>
        </div>
      </div>

      {/* Recent orders */}
      <RecentOrders items={recent} />
    </div>
  );
};

export default Dashboard;
