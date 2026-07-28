import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import {
  formatDate,
  formatDateTime,
  formatPercent,
  formatPrice,
} from "@/lib/format";
import { allowedActions, type OrderStatus } from "@/lib/order-status";
import {
  lineCommission,
  lineEarning,
  lineTotal,
  summarizeEarnings,
} from "@/lib/pricing";
import { PanelHeader } from "@/components/panel/PanelShell";
import {
  AdminOrderActions,
  CourierAssigner,
} from "@/components/panel/AdminControls";
import {
  DeliveryStatusBadge,
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/ui/Badge";
import { GiftNoteCard } from "@/components/ui/GiftNote";
import { ProductImage } from "@/components/ui/ProductImage";

type Params = Promise<{ orderNo: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { orderNo } = await params;
  return { title: `Sipariş ${orderNo}` };
}

export default async function AdminOrderDetail({ params }: { params: Params }) {
  const { orderNo } = await params;

  const [order, couriers] = await Promise.all([
    db.order.findUnique({
      where: { orderNo },
      include: {
        items: { include: { seller: true } },
        delivery: { include: { courier: true } },
        customer: true,
        events: { orderBy: { createdAt: "desc" } },
      },
    }),
    db.user.findMany({ where: { role: "COURIER" }, orderBy: { name: "asc" } }),
  ]);

  if (!order) notFound();

  const totals = summarizeEarnings(order.items);
  const actions = allowedActions("ADMIN", order.status as OrderStatus);

  const groups = order.items.reduce<
    {
      sellerId: string;
      storeName: string;
      city: string;
      items: typeof order.items;
    }[]
  >((acc, item) => {
    const existing = acc.find((g) => g.sellerId === item.sellerId);
    if (existing) existing.items.push(item);
    else
      acc.push({
        sellerId: item.sellerId,
        storeName: item.seller.storeName,
        city: item.seller.city,
        items: [item],
      });
    return acc;
  }, []);

  return (
    <>
      <Link
        href="/admin/siparisler"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-plum-800"
      >
        ← Tüm siparişler
      </Link>

      <PanelHeader
        title={order.orderNo}
        description={`${formatDateTime(order.createdAt)} · ${order.customer.name} (${order.customer.email})`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <PaymentStatusBadge status={order.paymentStatus} />
            <OrderStatusBadge status={order.status} />
          </div>
        }
      />

      <section className="mb-6 grid gap-4 rounded-lg border border-line bg-surface px-5 py-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-[13.5px] font-semibold text-plum-950">
            Operasyon işlemleri
          </p>
          <p className="mt-0.5 text-[12.5px] text-muted">
            Durumu ilerlet veya teslimatı bir kuryeye ata.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {order.status !== "IPTAL" && order.status !== "BEKLEMEDE" && (
            <CourierAssigner
              orderId={order.id}
              courierId={order.delivery?.courierId ?? null}
              couriers={couriers.map((c) => ({
                id: c.id,
                name: c.name,
                city: null,
              }))}
            />
          )}
          <AdminOrderActions orderId={order.id} actions={actions} />
        </div>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.sellerId} className="card overflow-hidden">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-plum-50/70 px-4 py-3">
                <div>
                  <p className="text-[13.5px] font-semibold text-plum-950">
                    {group.storeName}
                  </p>
                  <p className="text-[12px] text-muted">{group.city}</p>
                </div>
                <OrderStatusBadge status={group.items[0].status} />
              </header>

              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Ürün</th>
                      <th>Adet</th>
                      <th>Tutar</th>
                      <th>Komisyon</th>
                      <th>Satıcıya</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="relative size-10 flex-none overflow-hidden rounded-md bg-plum-50">
                              <ProductImage
                                src={item.productImage}
                                alt={item.productName}
                                sizes="40px"
                              />
                            </div>
                            <span className="font-medium">
                              {item.productName}
                            </span>
                          </div>
                        </td>
                        <td className="tabular">{item.quantity}</td>
                        <td className="tabular font-semibold">
                          {formatPrice(lineTotal(item))}
                        </td>
                        <td className="tabular text-bloom-700">
                          {formatPrice(lineCommission(item))}
                          <span className="ml-1 text-[11px] text-muted">
                            ({formatPercent(item.commissionRate)})
                          </span>
                        </td>
                        <td className="tabular text-plum-700">
                          {formatPrice(lineEarning(item))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}

          <section className="card card-pad">
            <h2 className="text-[15px] font-semibold">Sipariş geçmişi</h2>
            <ol className="mt-3 space-y-2.5">
              {order.events.map((event) => (
                <li key={event.id} className="flex gap-3 text-[13px]">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-plum-400" />
                  <span className="min-w-0">
                    <span className="font-medium text-plum-950">
                      {event.label}
                    </span>
                    <span className="block text-[12px] text-muted">
                      {formatDateTime(event.createdAt)} · {event.actor}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-5">
          <div className="card card-pad">
            <h2 className="text-[15px] font-semibold">Finansal özet</h2>
            <dl className="mt-3 space-y-2 text-[13px]">
              <Row term="Ürün toplamı" value={formatPrice(order.subtotal)} />
              <Row
                term="Teslimat"
                value={
                  order.shippingFee === 0
                    ? "Ücretsiz"
                    : formatPrice(order.shippingFee)
                }
              />
              <Row
                term="Tahsil edilen"
                value={formatPrice(order.total)}
                strong
              />
              <div className="border-t border-line pt-2" />
              <Row
                term="Platform komisyonu"
                value={formatPrice(totals.commission)}
              />
              <Row term="Satıcılara ödenecek" value={formatPrice(totals.net)} />
            </dl>
          </div>

          <div className="card card-pad">
            <h2 className="text-[15px] font-semibold">Teslimat</h2>
            <dl className="mt-3 space-y-3 text-[13px]">
              <div>
                <dt className="text-[12px] text-muted">Alıcı</dt>
                <dd className="font-medium">{order.recipientName}</dd>
                <dd className="mono text-[12.5px] text-muted">
                  {order.recipientPhone}
                </dd>
              </div>
              <div>
                <dt className="text-[12px] text-muted">Adres</dt>
                <dd className="leading-snug">{order.deliveryAddress}</dd>
                <dd className="text-[12.5px] text-muted">
                  {order.deliveryCity}
                </dd>
              </div>
              <div>
                <dt className="text-[12px] text-muted">Zaman</dt>
                <dd className="font-medium">
                  {formatDate(order.deliveryDate)}
                </dd>
                <dd className="tabular text-[12.5px] text-muted">
                  {order.deliverySlot}
                </dd>
              </div>
              {order.delivery && (
                <div>
                  <dt className="mb-1 text-[12px] text-muted">Kurye</dt>
                  <dd className="flex flex-wrap items-center gap-2">
                    <DeliveryStatusBadge status={order.delivery.status} />
                    {order.delivery.courier && (
                      <span className="text-[12.5px] font-medium">
                        {order.delivery.courier.name}
                      </span>
                    )}
                  </dd>
                </div>
              )}
              {order.cancelReason && (
                <div>
                  <dt className="text-[12px] text-muted">İptal nedeni</dt>
                  <dd className="text-[12.5px]">{order.cancelReason}</dd>
                </div>
              )}
            </dl>
          </div>

          {order.giftNote && (
            <div className="px-2 py-1">
              <GiftNoteCard
                text={order.giftNote}
                from={`${order.customer.name}'den`}
              />
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

function Row({
  term,
  value,
  strong = false,
}: {
  term: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{term}</dt>
      <dd
        className={`tabular ${strong ? "text-[15px] font-bold" : "font-medium"}`}
      >
        {value}
      </dd>
    </div>
  );
}
