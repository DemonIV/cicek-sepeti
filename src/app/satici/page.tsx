import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateShort, formatPercent, formatPrice } from "@/lib/format";
import { summarizeEarnings } from "@/lib/pricing";
import { scoreBand } from "@/lib/seller-score";
import { sellerQuotaUsage } from "@/lib/seller-quota";
import { PanelHeader } from "@/components/panel/PanelShell";
import { StatCard } from "@/components/panel/StatCard";
import { Badge, OrderStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Satıcı paneli" };

export default async function SellerDashboard() {
  const seller = await getCurrentSeller();
  if (!seller) return null;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    todayOrders,
    pendingOrders,
    paidItems,
    lowStock,
    recentOrders,
    manager,
    scoreEvents,
    areaCount,
    quota,
  ] = await Promise.all([
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
      // Sorumlu kişi (madde 21)
      seller.accountManagerId
        ? db.user.findUnique({ where: { id: seller.accountManagerId } })
        : null,
      // Puan hareketleri (madde 17)
      db.sellerScoreEvent.findMany({
        where: { sellerId: seller.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      // Hizmet verilen mahalle sayısı (madde 15)
      db.sellerArea.count({ where: { sellerId: seller.id } }),
      // Kota kullanımı (madde 19) — sayımın tanımı `lib/seller-quota.ts`'te;
      // ödeme adımındaki engel de aynı fonksiyondan geçer.
      sellerQuotaUsage(seller, startOfToday),
    ]);

  const earnings = summarizeEarnings(paidItems);
  const band = scoreBand(seller.score);
  const dailyUsed = quota.daily.limit
    ? Math.min(100, Math.round((quota.daily.used / quota.daily.limit) * 100))
    : 0;
  const activeUsed = quota.active.limit
    ? Math.min(100, Math.round((quota.active.used / quota.active.limit) * 100))
    : 0;

  return (
    <>
      <PanelHeader
        title="Genel bakış"
        description={`${seller.storeName} mağazasının bugünkü durumu. Komisyon oranın ${formatPercent(seller.commissionRate)}.`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={band.tone} dot>
              Hizmet puanı {seller.score} · {band.label}
            </Badge>
            {seller.acceptingOrders ? (
              <Badge tone="leaf" dot>
                Sipariş alımı açık
              </Badge>
            ) : (
              <Badge tone="danger" dot>
                Sipariş alımı durduruldu
              </Badge>
            )}
          </div>
        }
      />

      {/* Sipariş alımı kapalıysa bunu ilk satırda söyle (madde 16). */}
      {!seller.acceptingOrders && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-[#f2c6c2] bg-[#fbe0dd] px-4 py-3.5">
          <Icon name="alert" size={18} className="mt-0.5 flex-none text-[#9c2f2a]" />
          <p className="text-[13px] leading-relaxed text-[#9c2f2a]">
            <strong className="font-semibold">
              Mağazan şu anda sipariş almıyor.
            </strong>{" "}
            {seller.pauseReason ?? "Operasyon ekibi tarafından durduruldu."}{" "}
            Ürünlerin vitrinde görünmeye devam eder ama sepete eklenemez.
            Yeniden açmak için sorumlunla görüş.
          </p>
        </div>
      )}

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

      {/* ------------------- Sorumlu kişi, kota ve puan -------------------- */}
      <div className="mt-6 grid items-start gap-4 lg:grid-cols-3">
        {/* Sorumlu kişi (madde 21) */}
        <section className="card card-pad">
          <div className="flex items-center gap-2.5">
            <Icon name="user" size={16} className="text-plum-500" />
            <h2 className="text-[15px] font-semibold">Sorumlun</h2>
          </div>
          {manager ? (
            <div className="mt-3">
              <p className="text-[15px] font-semibold text-plum-950">
                {manager.name}
              </p>
              <p className="text-[12.5px] text-muted">
                {manager.title ?? "Operasyon ekibi"}
              </p>
              {manager.phone && (
                <a
                  href={`tel:${manager.phone.replace(/\s/g, "")}`}
                  className="mono mt-3 inline-flex items-center gap-2 rounded-md border border-line px-2.5 py-1.5 text-[12.5px] font-semibold text-plum-900 hover:border-plum-300"
                >
                  <Icon name="phone" size={14} />
                  {manager.phone}
                </a>
              )}
              <p className="mt-3 text-[11.5px] leading-relaxed text-faint">
                Ürün, fiyat veya bölge değişikliği gerektiğinde arayacağın kişi.
              </p>
            </div>
          ) : (
            <p className="mt-3 text-[13px] text-muted">
              Henüz bir sorumlu atanmadı. Operasyon ekibi atadığında adı ve
              numarası burada görünür.
            </p>
          )}
        </section>

        {/* Kotalar (madde 19) */}
        <section className="card card-pad">
          <div className="flex items-center gap-2.5">
            <Icon name="chart" size={16} className="text-plum-500" />
            <h2 className="text-[15px] font-semibold">Kotan</h2>
          </div>

          <div className="mt-3 space-y-4">
            <QuotaBar
              label="Bugünkü teslimat"
              used={quota.daily.used}
              quota={seller.dailyQuota}
              percent={dailyUsed}
            />
            <QuotaBar
              label="Açık sipariş"
              used={quota.active.used}
              quota={seller.activeQuota}
              percent={activeUsed}
            />
          </div>

          {quota.daily.full || quota.active.full ? (
            <p className="mt-3 rounded-md border border-[#f2c6c2] bg-[#fbe0dd] px-3 py-2 text-[11.5px] font-semibold leading-relaxed text-[#9c2f2a]">
              {quota.daily.full
                ? "Bugünün teslimat kotası doldu — bu güne yeni sipariş alınmıyor."
                : "Açık sipariş kotan doldu — teslimatlar tamamlanana kadar yeni sipariş alınmıyor."}
            </p>
          ) : (
            <p className="mt-3 text-[11.5px] leading-relaxed text-faint">
              Kota dolduğunda o güne yeni sipariş alınmaz; müşteri ödeme adımında
              başka bir teslimat gününe yönlendirilir.
            </p>
          )}
        </section>

        {/* Puan hareketleri (madde 17) */}
        <section className="card card-pad">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Icon name="shield" size={16} className="text-plum-500" />
              <h2 className="text-[15px] font-semibold">Hizmet puanın</h2>
            </div>
            <span className="tabular font-display text-[1.5rem] font-semibold leading-none text-plum-950">
              {seller.score}
            </span>
          </div>

          {scoreEvents.length === 0 ? (
            <p className="mt-3 text-[13px] text-muted">
              Puanını düşüren bir olay yok. 100 puanla devam ediyorsun.
            </p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {scoreEvents.map((event) => (
                <li key={event.id} className="flex gap-2.5 text-[12.5px]">
                  <span
                    className={`tabular mt-px w-8 flex-none text-right font-mono font-bold ${
                      event.delta < 0 ? "text-[#9c2f2a]" : "text-plum-700"
                    }`}
                  >
                    {event.delta > 0 ? `+${event.delta}` : event.delta}
                  </span>
                  <span className="min-w-0">
                    <span className="block leading-snug text-plum-900">
                      {event.reason}
                    </span>
                    <span className="block text-[11.5px] text-faint">
                      {formatDateShort(event.createdAt)}
                      {event.orderNo ? ` · ${event.orderNo}` : ""}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-3 text-[11.5px] leading-relaxed text-faint">
            {areaCount} mahalleye hizmet veriyorsun. Geciken her sipariş 5 puan
            düşürür.
          </p>
        </section>
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

/** Kota kullanımı çubuğu — kota tanımlı değilse "sınırsız" yazar. */
function QuotaBar({
  label,
  used,
  quota,
  percent,
}: {
  label: string;
  used: number;
  quota: number | null;
  percent: number;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[12.5px] font-medium text-plum-900">{label}</span>
        <span className="tabular font-mono text-[12px] text-muted">
          {quota ? `${used} / ${quota}` : `${used} · sınırsız`}
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-plum-100">
        <div
          className={`h-full rounded-full ${
            percent >= 90 ? "bg-bloom-600" : "bg-plum-500"
          }`}
          style={{ width: quota ? `${Math.max(4, percent)}%` : "0%" }}
        />
      </div>
    </div>
  );
}
