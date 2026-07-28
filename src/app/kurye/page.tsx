import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/format";
import { allowedActions, type OrderStatus } from "@/lib/order-status";
import { PanelHeader } from "@/components/panel/PanelShell";
import { StatCard } from "@/components/panel/StatCard";
import { CourierActions } from "@/components/panel/CourierActions";
import { DeliveryStatusBadge, OrderStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Teslimatlarım" };

export default async function CourierDeliveriesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [deliveries, deliveredToday] = await Promise.all([
    db.delivery.findMany({
      where: { courierId: user.id, status: { in: ["ATANDI", "YOLDA"] } },
      include: { order: { include: { items: true } } },
      orderBy: { assignedAt: "asc" },
    }),
    db.delivery.count({
      where: {
        courierId: user.id,
        status: "TESLIM_EDILDI",
        deliveredAt: { gte: startOfToday },
      },
    }),
  ]);

  const onTheWay = deliveries.filter((d) => d.status === "YOLDA").length;

  return (
    <>
      <PanelHeader
        title="Teslimatlarım"
        description="Sana atanan aktif teslimatlar. Adrese vardığında teslim onayını buradan ver."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Bekleyen teslimat"
          value={String(deliveries.length)}
          icon="truck"
          accent={deliveries.length > 0}
          hint="Alınacak ve yoldaki toplam"
        />
        <StatCard
          label="Yolda"
          value={String(onTheWay)}
          icon="clock"
          hint="Çiçekçiden alındı, adrese gidiyor"
        />
        <StatCard
          label="Bugün teslim edilen"
          value={String(deliveredToday)}
          icon="check"
          hint="Bugün tamamladığın teslimat"
        />
      </div>

      <h2 className="mb-3 mt-8 text-[15px] font-semibold">Teslimat listesi</h2>

      {deliveries.length === 0 ? (
        <EmptyState
          title="Şu an açık teslimatın yok"
          description="Operasyon ekibi sana teslimat atadığında burada listelenir ve rozet üzerinde sayısı görünür."
          action={{ href: "/kurye/gecmis", label: "Geçmiş teslimatlar" }}
        />
      ) : (
        <ul className="space-y-4">
          {deliveries.map((delivery) => {
            const order = delivery.order;
            const actions = allowedActions(
              "COURIER",
              order.status as OrderStatus,
            );

            return (
              <li key={delivery.id} className="card overflow-hidden">
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-plum-50/70 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <Link
                      href={`/kurye/${order.orderNo}`}
                      className="mono text-[13px] font-semibold text-plum-950 hover:underline"
                    >
                      {order.orderNo}
                    </Link>
                    <span className="tabular text-[12px] text-muted">
                      {formatDate(order.deliveryDate)} · {order.deliverySlot}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DeliveryStatusBadge status={delivery.status} />
                    <OrderStatusBadge status={order.status} />
                  </div>
                </header>

                <div className="grid gap-4 p-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex gap-2.5">
                      <Icon
                        name="user"
                        size={16}
                        className="mt-0.5 text-plum-400"
                      />
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-semibold">
                          {order.recipientName}
                        </p>
                        <a
                          href={`tel:${order.recipientPhone.replace(/\s/g, "")}`}
                          className="mono text-[12.5px] text-bloom-600 hover:underline"
                        >
                          {order.recipientPhone}
                        </a>
                      </div>
                    </div>

                    <div className="flex gap-2.5">
                      <Icon
                        name="pin"
                        size={16}
                        className="mt-0.5 text-plum-400"
                      />
                      <div className="min-w-0">
                        <p className="text-[13px] leading-snug">
                          {order.deliveryAddress}
                        </p>
                        <p className="text-[12px] text-muted">
                          {order.deliveryCity}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 md:justify-end">
                    <p className="tabular text-[12.5px] text-muted">
                      {order.items.length} kalem · {formatPrice(order.total)}
                    </p>
                    <Link
                      href={`/kurye/${order.orderNo}`}
                      className="btn btn-outline btn-sm"
                    >
                      Detay
                    </Link>
                    <CourierActions orderId={order.id} actions={actions} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
