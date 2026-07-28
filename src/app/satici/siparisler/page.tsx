import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateShort, formatPrice } from "@/lib/format";
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
import { SellerOrderActions } from "@/components/panel/SellerOrderActions";
import { FilterChip } from "@/components/panel/FilterChip";

export const metadata: Metadata = { title: "Siparişlerim" };

type Search = Promise<{ durum?: string }>;

export default async function SellerOrdersPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const seller = await getCurrentSeller();
  if (!seller) return null;

  const { durum } = await searchParams;
  const statusFilter = ORDER_STATUSES.includes(durum as OrderStatus)
    ? (durum as OrderStatus)
    : null;

  const orders = await db.order.findMany({
    where: {
      items: {
        some: {
          sellerId: seller.id,
          ...(statusFilter ? { status: statusFilter } : {}),
        },
      },
    },
    include: { items: { where: { sellerId: seller.id } }, delivery: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PanelHeader
        title="Siparişlerim"
        description="Yalnızca senin mağazana ait kalemler listelenir. Diğer satıcıların kalemleri sana görünmez."
      />

      <nav className="scroll-row mb-5">
        <FilterChip
          href="/satici/siparisler"
          label="Tümü"
          active={!statusFilter}
        />
        {ORDER_STATUSES.filter((s) => s !== "BEKLEMEDE").map((status) => (
          <FilterChip
            key={status}
            href={`/satici/siparisler?durum=${status}`}
            label={ORDER_STATUS_META[status].label}
            active={statusFilter === status}
          />
        ))}
      </nav>

      {orders.length === 0 ? (
        <EmptyState
          title="Bu filtrede sipariş yok"
          description="Farklı bir durum seç ya da tümünü listele."
          action={{ href: "/satici/siparisler", label: "Tüm siparişler" }}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sipariş</th>
                  <th>Tarih</th>
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
                      <td className="tabular whitespace-nowrap text-muted">
                        {formatDateShort(order.createdAt)}
                      </td>
                      <td>
                        <p className="font-medium">{order.recipientName}</p>
                        <p className="text-[12px] text-muted">
                          {order.deliveryCity}
                        </p>
                      </td>
                      <td className="tabular text-muted">
                        {order.items.length}
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
