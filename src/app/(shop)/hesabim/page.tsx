import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateShort, formatPrice } from "@/lib/format";
import { OrderStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductImage } from "@/components/ui/ProductImage";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Siparişlerim" };

export default async function MyOrdersPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const orders = await db.order.findMany({
    where: { customerId: user.id },
    include: { items: { include: { seller: true } } },
    orderBy: { createdAt: "desc" },
  });

  if (orders.length === 0) {
    return (
      <EmptyState
        title="Henüz siparişin yok"
        description="İlk siparişini verdiğinde burada listelenir ve durumunu adım adım takip edebilirsin."
        action={{ href: "/urunler", label: "Çiçeklere göz at" }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const sellerCount = new Set(order.items.map((i) => i.sellerId)).size;

        return (
          <article key={order.id} className="card overflow-hidden">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-plum-50/70 px-4 py-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <Link
                  href={`/siparis/${order.orderNo}`}
                  className="mono text-[13px] font-semibold text-plum-950 hover:underline"
                >
                  {order.orderNo}
                </Link>
                <span className="tabular text-[12px] text-muted">
                  {formatDateShort(order.createdAt)}
                </span>
                {sellerCount > 1 && (
                  <span className="flex items-center gap-1 text-[12px] text-muted">
                    <Icon name="store" size={13} />
                    {sellerCount} çiçekçi
                  </span>
                )}
              </div>
              <OrderStatusBadge status={order.status} />
            </header>

            <div className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex -space-x-3">
                  {order.items.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="relative size-14 flex-none overflow-hidden rounded-md border-2 border-surface bg-plum-50"
                    >
                      <ProductImage
                        src={item.productImage}
                        alt={item.productName}
                        sizes="56px"
                      />
                    </div>
                  ))}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-medium">
                    {order.items[0]?.productName}
                    {order.items.length > 1 && (
                      <span className="text-muted">
                        {" "}
                        ve {order.items.length - 1} ürün daha
                      </span>
                    )}
                  </p>
                  <p className="truncate text-[12px] text-muted">
                    {order.recipientName} · {order.deliveryCity}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <p className="tabular font-display text-lg font-semibold">
                  {formatPrice(order.total)}
                </p>
                <Link
                  href={`/siparis/${order.orderNo}`}
                  className="btn btn-outline btn-sm"
                >
                  Takip et
                </Link>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
