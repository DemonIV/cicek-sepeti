import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { formatDateShort, formatPrice } from "@/lib/format";
import {
  ORDER_STATUSES,
  ORDER_STATUS_META,
  type OrderStatus,
} from "@/lib/order-status";
import { PanelHeader } from "@/components/panel/PanelShell";
import { FilterChip } from "@/components/panel/FilterChip";
import { CourierAssigner } from "@/components/panel/AdminControls";
import { OrderStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Tüm siparişler" };

type Search = Promise<{ durum?: string; sehir?: string; q?: string }>;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const { durum, sehir, q } = await searchParams;
  const statusFilter = ORDER_STATUSES.includes(durum as OrderStatus)
    ? (durum as OrderStatus)
    : null;

  const where = {
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(sehir ? { deliveryCity: sehir } : {}),
    ...(q
      ? {
          OR: [
            { orderNo: { contains: q } },
            { recipientName: { contains: q } },
            { customer: { name: { contains: q } } },
          ],
        }
      : {}),
  };

  const [orders, couriers, cities, counts] = await Promise.all([
    db.order.findMany({
      where,
      include: {
        items: true,
        customer: true,
        delivery: { include: { courier: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
    db.user.findMany({ where: { role: "COURIER" }, orderBy: { name: "asc" } }),
    db.order.findMany({
      select: { deliveryCity: true },
      distinct: ["deliveryCity"],
    }),
    db.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const countOf = (status: OrderStatus) =>
    counts.find((row) => row.status === status)?._count._all ?? 0;

  const buildHref = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams();
    const base = {
      durum: statusFilter ?? null,
      sehir: sehir ?? null,
      q: q ?? null,
    };
    for (const [key, value] of Object.entries({ ...base, ...patch })) {
      if (value) params.set(key, value);
    }
    const query = params.toString();
    return query ? `/admin/siparisler?${query}` : "/admin/siparisler";
  };

  return (
    <>
      <PanelHeader
        title="Tüm siparişler"
        description="Platformdaki tüm siparişler. Kurye atamasını satır üzerinden yapabilirsin."
        actions={
          <form action="/admin/siparisler" className="relative">
            {statusFilter && (
              <input type="hidden" name="durum" value={statusFilter} />
            )}
            <Icon
              name="search"
              size={15}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-faint"
            />
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Sipariş no, alıcı, müşteri…"
              aria-label="Sipariş ara"
              className="field py-1.5 pl-8 text-[13px] sm:w-64"
            />
          </form>
        }
      />

      <div className="mb-3 flex flex-wrap gap-2">
        <FilterChip
          href={buildHref({ durum: null })}
          label="Tümü"
          active={!statusFilter}
        />
        {ORDER_STATUSES.map((status) => (
          <FilterChip
            key={status}
            href={buildHref({ durum: status })}
            label={ORDER_STATUS_META[status].label}
            count={countOf(status)}
            active={statusFilter === status}
          />
        ))}
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <FilterChip
          href={buildHref({ sehir: null })}
          label="Tüm şehirler"
          active={!sehir}
        />
        {cities.map((row) => (
          <FilterChip
            key={row.deliveryCity}
            href={buildHref({ sehir: row.deliveryCity })}
            label={row.deliveryCity}
            active={sehir === row.deliveryCity}
          />
        ))}
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="Bu filtrede sipariş yok"
          description="Filtreleri gevşetip tekrar dene."
          action={{ href: "/admin/siparisler", label: "Filtreleri temizle" }}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sipariş</th>
                  <th>Tarih</th>
                  <th>Müşteri</th>
                  <th>Alıcı / şehir</th>
                  <th>Satıcı</th>
                  <th>Tutar</th>
                  <th>Durum</th>
                  <th>Kurye</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const sellerCount = new Set(
                    order.items.map((i) => i.sellerId),
                  ).size;
                  const canAssign =
                    order.status !== "IPTAL" && order.status !== "BEKLEMEDE";

                  return (
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
                      <td>
                        <p className="font-medium">{order.recipientName}</p>
                        <p className="text-[12px] text-muted">
                          {order.deliveryCity}
                        </p>
                      </td>
                      <td>
                        <span
                          className={
                            sellerCount > 1
                              ? "font-semibold text-bloom-700"
                              : "text-muted"
                          }
                        >
                          {sellerCount > 1
                            ? `${sellerCount} satıcı`
                            : "Tek satıcı"}
                        </span>
                      </td>
                      <td className="tabular font-semibold">
                        {formatPrice(order.total)}
                      </td>
                      <td>
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td>
                        {canAssign ? (
                          <CourierAssigner
                            compact
                            orderId={order.id}
                            courierId={order.delivery?.courierId ?? null}
                            couriers={couriers.map((c) => ({
                              id: c.id,
                              name: c.name,
                              city: null,
                            }))}
                          />
                        ) : (
                          <span className="text-[12px] text-faint">—</span>
                        )}
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
