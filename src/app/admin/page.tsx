import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { REVENUE_FILTER, last7DaysOrders } from "@/lib/orders";
import { formatDateShort, formatPrice } from "@/lib/format";
import { PanelHeader } from "@/components/panel/PanelShell";
import { StatCard } from "@/components/panel/StatCard";
import { OrdersChart, type ChartDay } from "@/components/panel/OrdersChart";
import { OrderStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Admin paneli" };

const weekdayShort = new Intl.DateTimeFormat("tr-TR", {
  weekday: "short",
  timeZone: "Europe/Istanbul",
});
const dayLong = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  weekday: "long",
  timeZone: "Europe/Istanbul",
});

export default async function AdminDashboard() {
  const [
    revenue,
    orderCount,
    activeSellers,
    pendingSellers,
    days,
    recentOrders,
    topSellers,
  ] = await Promise.all([
    db.order.aggregate({ where: REVENUE_FILTER, _sum: { total: true } }),
    db.order.count(),
    db.seller.count({ where: { status: "APPROVED" } }),
    db.seller.count({ where: { status: "PENDING" } }),
    last7DaysOrders(),
    db.order.findMany({
      include: {
        items: true,
        customer: true,
        delivery: { include: { courier: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    db.orderItem.groupBy({
      by: ["sellerId"],
      where: { status: { not: "IPTAL" }, order: { paymentStatus: "ODENDI" } },
      _sum: { unitPrice: true },
      _count: { _all: true },
    }),
  ]);

  const sellers = await db.seller.findMany({
    where: { id: { in: topSellers.map((s) => s.sellerId) } },
  });

  const ranked = topSellers
    .map((row) => ({
      seller: sellers.find((s) => s.id === row.sellerId),
      items: row._count._all,
    }))
    .filter((row) => row.seller)
    .sort((a, b) => b.items - a.items)
    .slice(0, 5);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const chartDays: ChartDay[] = days.map((day) => ({
    key: day.key,
    label: weekdayShort.format(day.date).replace(".", ""),
    fullLabel: dayLong.format(day.date),
    count: day.count,
    revenue: day.revenue,
    isToday: day.date.getTime() === today.getTime(),
  }));

  const weekTotal = days.reduce((sum, day) => sum + day.count, 0);
  const weekRevenue = days.reduce((sum, day) => sum + day.revenue, 0);

  return (
    <>
      <PanelHeader
        title="Genel bakış"
        description="Platformun güncel durumu: ciro, sipariş hacmi ve satıcı sağlığı."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Toplam ciro"
          value={formatPrice(revenue._sum.total ?? 0)}
          icon="chart"
          accent
          hint="Ödemesi alınmış, iptal edilmemiş siparişler"
        />
        <StatCard
          label="Toplam sipariş"
          value={String(orderCount)}
          icon="orders"
          hint="İptaller dahil tüm kayıtlar"
        />
        <StatCard
          label="Aktif satıcı"
          value={String(activeSellers)}
          icon="store"
          hint={`${pendingSellers} başvuru onay bekliyor`}
        />
        <StatCard
          label="Son 7 gün"
          value={String(weekTotal)}
          icon="clock"
          hint={`${formatPrice(weekRevenue)} ciro`}
        />
      </div>

      <div className="mt-8 grid items-start gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* --------------------------------- Grafik ---------------------------- */}
        <section className="card card-pad">
          <header className="mb-6">
            <h2 className="text-[15px] font-semibold">Son 7 gün</h2>
            <p className="mt-0.5 text-[12.5px] text-muted">
              Günlük sipariş sayısı. Ciro için bir güne gel.
            </p>
          </header>

          <OrdersChart days={chartDays} />
        </section>

        {/* ------------------------------ Satıcı sırası ------------------------ */}
        <section className="card overflow-hidden">
          <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5">
            <h2 className="text-[15px] font-semibold">
              En çok satan mağazalar
            </h2>
            <Link
              href="/admin/saticilar"
              className="link-underline text-[12.5px] font-semibold text-plum-800"
            >
              Tümü →
            </Link>
          </header>

          {ranked.length === 0 ? (
            <div className="p-4">
              <EmptyState
                compact
                title="Veri yok"
                description="Henüz satış kaydı yok."
              />
            </div>
          ) : (
            <ol className="divide-y divide-[var(--color-line)]">
              {ranked.map((row, index) => (
                <li
                  key={row.seller!.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <span className="tabular w-5 font-mono text-[11px] font-bold text-faint">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">
                      {row.seller!.storeName}
                    </p>
                    <p className="text-[12px] text-muted">{row.seller!.city}</p>
                  </div>
                  <span className="tabular text-[12.5px] font-semibold">
                    {row.items} kalem
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {/* ------------------------------ Son siparişler -------------------------- */}
      <section className="card mt-6 overflow-hidden">
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5">
          <h2 className="text-[15px] font-semibold">Son siparişler</h2>
          <Link
            href="/admin/siparisler"
            className="link-underline text-[12.5px] font-semibold text-plum-800"
          >
            Tüm siparişler →
          </Link>
        </header>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Sipariş</th>
                <th>Tarih</th>
                <th>Müşteri</th>
                <th>Şehir</th>
                <th>Kalem</th>
                <th>Tutar</th>
                <th>Kurye</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link
                      href={`/admin/siparisler/${order.orderNo}`}
                      className="mono whitespace-nowrap font-semibold text-plum-900 hover:underline"
                    >
                      {order.orderNo}
                    </Link>
                  </td>
                  <td className="tabular whitespace-nowrap text-muted">
                    {formatDateShort(order.createdAt)}
                  </td>
                  <td>{order.customer.name}</td>
                  <td className="text-muted">{order.deliveryCity}</td>
                  <td className="tabular text-muted">{order.items.length}</td>
                  <td className="tabular font-semibold">
                    {formatPrice(order.total)}
                  </td>
                  <td className="text-muted">
                    {order.delivery?.courier?.name ?? (
                      <span className="text-bloom-600">Atanmadı</span>
                    )}
                  </td>
                  <td>
                    <OrderStatusBadge status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
