import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatDateShort, formatPrice, formatWeekday } from "@/lib/format";
import {
  ORDER_STATUSES,
  ORDER_STATUS_META,
  allowedActions,
  deriveOrderStatus,
  type OrderStatus,
} from "@/lib/order-status";
import { summarizeEarnings } from "@/lib/pricing";
import { PanelHeader } from "@/components/panel/PanelShell";
import { OrderStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { SellerOrderActions } from "@/components/panel/SellerOrderActions";
import { FilterChip } from "@/components/panel/FilterChip";

export const metadata: Metadata = { title: "Siparişlerim" };

type Search = Promise<{ durum?: string; gun?: string; tarih?: string }>;

/** "2026-08-21" — İstanbul saatine göre gün anahtarı. */
const dayKey = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(date);

const startOfDay = (key: string) => new Date(`${key}T00:00:00`);
const endOfDay = (key: string) => new Date(`${key}T23:59:59.999`);

/**
 * Satıcının sipariş listesi.
 *
 * 21 Ağustos 2026'da tarih boyutu eklendi (madde 3): liste **bugün teslim
 * edilecek** siparişlerle açılır, çünkü çiçekçinin sabah ilk sorusu budur.
 * Bugünü sistem kendi bulur; başka bir güne bakmak isteyen üstteki şeritten
 * seçer ya da takvimden tarih girer.
 */
export default async function SellerOrdersPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const seller = await getCurrentSeller();
  if (!seller) return null;

  const { durum, gun, tarih } = await searchParams;
  const statusFilter = ORDER_STATUSES.includes(durum as OrderStatus)
    ? (durum as OrderStatus)
    : null;

  const now = new Date();
  const todayKey = dayKey(now);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowKey = dayKey(tomorrow);

  // Belirli bir tarih girildiyse gün şeridi onu izler.
  const explicitDay = /^\d{4}-\d{2}-\d{2}$/.test(tarih ?? "") ? tarih! : null;
  const dayFilter = explicitDay ? "tarih" : (gun ?? "bugun");

  let dateWhere: object = {};
  let dayTitle = "";

  if (dayFilter === "bugun") {
    dateWhere = { deliveryDate: { gte: startOfDay(todayKey), lte: endOfDay(todayKey) } };
    dayTitle = `Bugün · ${formatDate(now)} ${formatWeekday(now)}`;
  } else if (dayFilter === "yarin") {
    dateWhere = {
      deliveryDate: { gte: startOfDay(tomorrowKey), lte: endOfDay(tomorrowKey) },
    };
    dayTitle = `Yarın · ${formatDate(tomorrow)} ${formatWeekday(tomorrow)}`;
  } else if (dayFilter === "hafta") {
    const weekEnd = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
    dateWhere = {
      deliveryDate: { gte: startOfDay(todayKey), lte: endOfDay(dayKey(weekEnd)) },
    };
    dayTitle = `Önümüzdeki 7 gün · ${formatDateShort(now)} – ${formatDateShort(weekEnd)}`;
  } else if (dayFilter === "tarih" && explicitDay) {
    const picked = startOfDay(explicitDay);
    dateWhere = {
      deliveryDate: { gte: picked, lte: endOfDay(explicitDay) },
    };
    dayTitle = `${formatDate(picked)} ${formatWeekday(picked)}`;
  } else {
    dayTitle = "Tüm tarihler";
  }

  const [orders, todayCount, tomorrowCount] = await Promise.all([
    db.order.findMany({
      where: {
        items: {
          some: {
            sellerId: seller.id,
            ...(statusFilter ? { status: statusFilter } : {}),
          },
        },
        ...dateWhere,
      },
      include: { items: { where: { sellerId: seller.id } }, delivery: true },
      orderBy: [{ deliveryDate: "asc" }, { createdAt: "desc" }],
    }),
    db.order.count({
      where: {
        items: { some: { sellerId: seller.id } },
        deliveryDate: { gte: startOfDay(todayKey), lte: endOfDay(todayKey) },
      },
    }),
    db.order.count({
      where: {
        items: { some: { sellerId: seller.id } },
        deliveryDate: { gte: startOfDay(tomorrowKey), lte: endOfDay(tomorrowKey) },
      },
    }),
  ]);

  const dayHref = (value: string) =>
    `/satici/siparisler?gun=${value}${statusFilter ? `&durum=${statusFilter}` : ""}`;

  return (
    <>
      <PanelHeader
        title="Siparişlerim"
        description="Yalnızca senin mağazana ait kalemler listelenir. Diğer bayilerin kalemleri sana görünmez."
      />

      {/* --------------------------- Gün şeridi --------------------------- */}
      <div className="card mb-5 flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-3">
          <Icon name="clock" size={18} className="text-bloom-600" />
          <div>
            <p className="text-[15px] font-semibold text-plum-950">{dayTitle}</p>
            <p className="text-[12.5px] text-muted">
              {orders.length} sipariş listeleniyor · teslimat tarihine göre
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FilterChip
            href={dayHref("bugun")}
            label={`Bugün${todayCount ? ` (${todayCount})` : ""}`}
            active={dayFilter === "bugun"}
          />
          <FilterChip
            href={dayHref("yarin")}
            label={`Yarın${tomorrowCount ? ` (${tomorrowCount})` : ""}`}
            active={dayFilter === "yarin"}
          />
          <FilterChip
            href={dayHref("hafta")}
            label="7 gün"
            active={dayFilter === "hafta"}
          />
          <FilterChip
            href={dayHref("tumu")}
            label="Tümü"
            active={dayFilter === "tumu"}
          />

          <form action="/satici/siparisler" className="flex items-center gap-2">
            {statusFilter && (
              <input type="hidden" name="durum" value={statusFilter} />
            )}
            <input
              type="date"
              name="tarih"
              defaultValue={explicitDay ?? todayKey}
              aria-label="Teslimat tarihi seç"
              className="field py-1.5 text-[13px]"
            />
            <button type="submit" className="btn btn-outline btn-sm">
              Göster
            </button>
          </form>
        </div>
      </div>

      <nav className="scroll-row mb-5">
        <FilterChip
          href={`/satici/siparisler?gun=${dayFilter}`}
          label="Tüm durumlar"
          active={!statusFilter}
        />
        {ORDER_STATUSES.filter((s) => s !== "BEKLEMEDE").map((status) => (
          <FilterChip
            key={status}
            href={`/satici/siparisler?durum=${status}&gun=${dayFilter}`}
            label={ORDER_STATUS_META[status].label}
            active={statusFilter === status}
          />
        ))}
      </nav>

      {orders.length === 0 ? (
        <EmptyState
          title="Bu tarihte sipariş yok"
          description="Başka bir gün seçebilir ya da tüm tarihleri listeleyebilirsin."
          action={{ href: dayHref("tumu"), label: "Tüm tarihleri göster" }}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sipariş</th>
                  <th>Teslimat</th>
                  <th>Alıcı</th>
                  <th>Kalemlerin</th>
                  <th>Tutar</th>
                  <th>Kazancın</th>
                  <th>Durum</th>
                  <th className="text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const own = summarizeEarnings(order.items);
                  const ownStatus = deriveOrderStatus(
                    order.items.map((i) => i.status as OrderStatus),
                  );
                  const actions =
                    order.paymentStatus === "ODENDI"
                      ? allowedActions("SELLER", ownStatus)
                      : [];
                  const isToday = dayKey(order.deliveryDate) === todayKey;
                  const addOnCount = order.items.filter((i) => i.isAddOn).length;

                  return (
                    <tr key={order.id}>
                      <td>
                        <Link
                          href={`/satici/siparisler/${order.orderNo}`}
                          className="mono whitespace-nowrap font-semibold text-plum-900 hover:underline"
                        >
                          {order.orderNo}
                        </Link>
                        <p className="text-[11.5px] text-faint">
                          {formatDateShort(order.createdAt)} tarihinde verildi
                        </p>
                      </td>
                      <td className="whitespace-nowrap">
                        <p
                          className={`tabular font-semibold ${
                            isToday ? "text-bloom-700" : "text-plum-900"
                          }`}
                        >
                          {isToday ? "Bugün" : formatDateShort(order.deliveryDate)}
                        </p>
                        <p className="tabular text-[11.5px] text-muted">
                          {order.deliverySlot}
                        </p>
                      </td>
                      <td>
                        <p className="font-medium">{order.recipientName}</p>
                        <p className="text-[12px] text-muted">
                          {order.deliveryDistrict
                            ? `${order.deliveryDistrict}, ${order.deliveryCity}`
                            : order.deliveryCity}
                        </p>
                      </td>
                      <td className="tabular text-muted">
                        {order.items.length}
                        {addOnCount > 0 && (
                          <span className="ml-1 text-[11px] text-plum-500">
                            ({addOnCount} ek)
                          </span>
                        )}
                      </td>
                      <td className="tabular font-semibold">
                        {formatPrice(own.gross)}
                      </td>
                      <td className="tabular font-semibold text-plum-700">
                        {formatPrice(own.net)}
                      </td>
                      <td>
                        <OrderStatusBadge status={ownStatus} />
                      </td>
                      <td>
                        <div className="flex justify-end">
                          <SellerOrderActions
                            orderId={order.id}
                            actions={actions}
                            dispatched={Boolean(order.delivery?.dispatchedAt)}
                            canDispatch={
                              ownStatus === "HAZIRLANIYOR" &&
                              order.paymentStatus === "ODENDI"
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
