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

  // Madde 18: sipariş arabaya verilmeden kuryenin işi başlamaz. Arabaya
  // verilenler "işlem gören" listesinde, verilmeyenler hazırlıkta bekler.
  const inProgress = deliveries.filter((d) => d.dispatchedAt !== null);
  const waiting = deliveries.filter((d) => d.dispatchedAt === null);

  return (
    <>
      <PanelHeader
        title="Teslimatlarım"
        description="Sana atanan aktif teslimatlar. Adrese vardığında teslim onayını buradan ver."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="İşlem gören"
          value={String(inProgress.length)}
          icon="truck"
          accent={inProgress.length > 0}
          hint="Arabaya verilmiş, taşınmayı bekleyen"
        />
        <StatCard
          label="Hazırlıkta"
          value={String(waiting.length)}
          icon="clock"
          hint={`Çiçekçi henüz arabaya vermedi · ${onTheWay} tanesi yolda`}
        />
        <StatCard
          label="Bugün teslim edilen"
          value={String(deliveredToday)}
          icon="check"
          hint="Bugün tamamladığın teslimat"
        />
      </div>

      <h2 className="mb-1 mt-8 text-[15px] font-semibold">
        İşlem gören teslimatlar
      </h2>
      <p className="mb-3 text-[12.5px] text-muted">
        Çiçekçinin arabaya verdiği siparişler. Boşuna yola çıkmamak için önce
        buraya bak.
      </p>

      {deliveries.length === 0 ? (
        <EmptyState
          title="Şu an açık teslimatın yok"
          description="Operasyon ekibi sana teslimat atadığında burada listelenir ve rozet üzerinde sayısı görünür."
          action={{ href: "/kurye/gecmis", label: "Geçmiş teslimatlar" }}
        />
      ) : inProgress.length === 0 ? (
        <EmptyState
          compact
          title="Arabaya verilmiş sipariş yok"
          description="Sana atanan siparişler çiçekçinin hazırlığını bekliyor. Arabaya verildiğinde bu listeye düşerler."
        />
      ) : (
        <ul className="space-y-4">
          {inProgress.map((delivery) => {
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

      {/* --------------------- Hazırlık bekleyenler --------------------- */}
      {waiting.length > 0 && (
        <>
          <h2 className="mb-1 mt-10 text-[15px] font-semibold">
            Çiçekçi hazırlığında
          </h2>
          <p className="mb-3 text-[12.5px] text-muted">
            Sana atandı ama henüz arabaya verilmedi. Çiçekçi hazırlığı bitirince
            yukarıdaki listeye geçer.
          </p>

          <ul className="space-y-2.5">
            {waiting.map((delivery) => (
              <li
                key={delivery.id}
                className="card flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <Link
                    href={`/kurye/${delivery.order.orderNo}`}
                    className="mono text-[13px] font-semibold text-plum-950 hover:underline"
                  >
                    {delivery.order.orderNo}
                  </Link>
                  <span className="text-[12.5px] text-muted">
                    {delivery.order.recipientName} ·{" "}
                    {delivery.order.deliveryDistrict
                      ? `${delivery.order.deliveryDistrict}, `
                      : ""}
                    {delivery.order.deliveryCity}
                  </span>
                  <span className="tabular text-[12px] text-faint">
                    {formatDate(delivery.order.deliveryDate)} ·{" "}
                    {delivery.order.deliverySlot}
                  </span>
                </div>
                <span className="flex items-center gap-2 text-[12px] font-medium text-muted">
                  <Icon name="clock" size={14} className="text-plum-400" />
                  Arabaya verilmedi
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
