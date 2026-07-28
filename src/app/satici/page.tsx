import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateShort, formatPercent, formatPrice } from "@/lib/format";
import { summarizeEarnings } from "@/lib/pricing";
import { PanelHeader } from "@/components/panel/PanelShell";
import { StatCard } from "@/components/panel/StatCard";
import { OrderStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Satıcı paneli" };

export default async function SellerDashboard() {
  const seller = await getCurrentSeller();
  if (!seller) return null;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [todayOrders, pendingOrders, paidItems, lowStock, recentOrders] =
    await Promise.all([
      db.order.count({
        where: {
          createdAt: { gte: startOfToday },
          items: { some: { sellerId: seller.id } },
        },
      }),
      db.order.count({
        where: {
          items: { some: { sellerId: seller.id } },
          status: { in: ["ONAYLANDI", "HAZIRLANIYOR"] },
        },
      }),
      db.orderItem.findMany({
        where: {
          sellerId: seller.id,
          status: { not: "IPTAL" },
          order: { paymentStatus: "ODENDI" },
        },
        select: { unitPrice: true, quantity: true, commissionRate: true },
      }),
      db.product.findMany({
        where: { sellerId: seller.id, stock: { lte: 5 } },
        orderBy: { stock: "asc" },
        take: 6,
      }),
      db.order.findMany({
        where: { items: { some: { sellerId: seller.id } } },
        include: { items: { where: { sellerId: seller.id } } },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
    ]);

  const earnings = summarizeEarnings(paidItems);

  return (
    <>
      <PanelHeader
        title="Genel bakış"
        description={`${seller.storeName} mağazasının bugünkü durumu. Komisyon oranın ${formatPercent(seller.commissionRate)}.`}
        actions={
          <Link href="/satici/urunler/yeni" className="btn btn-primary btn-sm">
            <Icon name="plus" size={15} />
            Ürün ekle
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Bugünkü sipariş"
          value={String(todayOrders)}
          icon="orders"
          hint="Bugün mağazana düşen sipariş sayısı"
        />
        <StatCard
          label="Bekleyen sipariş"
          value={String(pendingOrders)}
          icon="clock"
          accent={pendingOrders > 0}
          hint="Hazırlanmayı veya yola çıkmayı bekleyen"
        />
        <StatCard
          label="Toplam kazanç"
          value={formatPrice(earnings.net)}
          icon="wallet"
          hint={`${formatPrice(earnings.commission)} komisyon düşüldü`}
        />
        <StatCard
          label="Düşük stok"
          value={String(lowStock.length)}
          icon="alert"
          hint="5 adet ve altında kalan ürün"
        />
      </div>

      {/* items-start: kartlar birbirinin boyuna gerilmesin. Stok uyarısında tek
          satır varken kart, yanındaki tablo kadar uzayıp boş duruyordu. */}
      <div className="mt-8 grid items-start gap-6 xl:grid-cols-[1.6fr_1fr]">
        {/* ---------------------------- Son siparişler --------------------------- */}
        <section className="card overflow-hidden">
          <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5">
            <h2 className="text-[15px] font-semibold">Son siparişler</h2>
            <Link
              href="/satici/siparisler"
              className="link-underline text-[12.5px] font-semibold text-plum-800"
            >
              Tümü →
            </Link>
          </header>

          {recentOrders.length === 0 ? (
            <div className="p-4">
              <EmptyState
                compact
                title="Henüz sipariş yok"
                description="Vitrindeki ürünlerinden sipariş geldiğinde burada görünür."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sipariş</th>
                    <th>Tarih</th>
                    <th>Kalem</th>
                    <th>Tutarın</th>
                    <th>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => {
                    const own = summarizeEarnings(order.items);
                    return (
                      <tr key={order.id}>
                        <td>
                          <Link
                            href={`/satici/siparisler/${order.orderNo}`}
                            className="mono whitespace-nowrap font-semibold text-plum-900 hover:underline"
                          >
                            {order.orderNo}
                          </Link>
                        </td>
                        <td className="tabular text-muted">
                          {formatDateShort(order.createdAt)}
                        </td>
                        <td className="tabular text-muted">
                          {order.items.length}
                        </td>
                        <td className="tabular font-semibold">
                          {formatPrice(own.gross)}
                        </td>
                        <td>
                          <OrderStatusBadge
                            status={order.items[0]?.status ?? order.status}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ------------------------------ Düşük stok ---------------------------- */}
        <section className="card overflow-hidden">
          <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5">
            <h2 className="text-[15px] font-semibold">Stok uyarısı</h2>
            <Link
              href="/satici/urunler"
              className="link-underline text-[12.5px] font-semibold text-plum-800"
            >
              Ürünlerim →
            </Link>
          </header>

          {lowStock.length === 0 ? (
            <div className="p-4">
              <EmptyState
                compact
                title="Stoklar yeterli"
                description="5 adedin altına düşen ürünün yok."
              />
            </div>
          ) : (
            <ul className="divide-y divide-[var(--color-line)]">
              {lowStock.map((product) => (
                <li
                  key={product.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium">
                      {product.name}
                    </p>
                    <p className="tabular text-[12px] text-muted">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                  <span
                    className={`tabular rounded-sm px-2 py-1 text-[11px] font-bold ${
                      product.stock === 0
                        ? "bg-[#fbe0dd] text-[#9c2f2a]"
                        : "bg-[#fbecd2] text-[#94640f]"
                    }`}
                  >
                    {product.stock === 0 ? "Tükendi" : `${product.stock} adet`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
