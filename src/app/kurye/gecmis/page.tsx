import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime, formatPrice } from "@/lib/format";
import { PanelHeader } from "@/components/panel/PanelShell";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Teslimat geçmişi" };

export default async function CourierHistoryPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const deliveries = await db.delivery.findMany({
    where: { courierId: user.id, status: "TESLIM_EDILDI" },
    include: { order: true },
    orderBy: { deliveredAt: "desc" },
  });

  return (
    <>
      <PanelHeader
        title="Teslimat geçmişi"
        description="Tamamladığın teslimatlar. Toplam kayıt sayısı performans raporlarına yansır."
      />

      {deliveries.length === 0 ? (
        <EmptyState
          title="Henüz tamamlanmış teslimatın yok"
          description="Bir teslimatı 'Teslim edildi' olarak işaretlediğinde burada arşivlenir."
          action={{ href: "/kurye", label: "Aktif teslimatlar" }}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sipariş</th>
                  <th>Alıcı</th>
                  <th>Şehir</th>
                  <th>Teslim zamanı</th>
                  <th>Tutar</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((delivery) => (
                  <tr key={delivery.id}>
                    <td>
                      <Link
                        href={`/kurye/${delivery.order.orderNo}`}
                        className="mono whitespace-nowrap font-semibold text-plum-900 hover:underline"
                      >
                        {delivery.order.orderNo}
                      </Link>
                    </td>
                    <td className="font-medium">
                      {delivery.order.recipientName}
                    </td>
                    <td className="text-muted">
                      {delivery.order.deliveryCity}
                    </td>
                    <td className="tabular whitespace-nowrap text-muted">
                      {delivery.deliveredAt
                        ? formatDateTime(delivery.deliveredAt)
                        : "—"}
                    </td>
                    <td className="tabular font-semibold">
                      {formatPrice(delivery.order.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
