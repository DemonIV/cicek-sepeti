import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateShort, formatPercent, formatPrice } from "@/lib/format";
import {
  lineCommission,
  lineEarning,
  lineTotal,
  summarizeEarnings,
} from "@/lib/pricing";
import { PanelHeader } from "@/components/panel/PanelShell";
import { StatCard } from "@/components/panel/StatCard";
import { OrderStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Kazançlarım" };

export default async function SellerEarningsPage() {
  const seller = await getCurrentSeller();
  if (!seller) return null;

  const items = await db.orderItem.findMany({
    where: {
      sellerId: seller.id,
      status: { not: "IPTAL" },
      order: { paymentStatus: "ODENDI" },
    },
    include: { order: true },
    orderBy: { order: { createdAt: "desc" } },
  });

  const all = summarizeEarnings(items);
  const delivered = summarizeEarnings(
    items.filter((i) => i.status === "TESLIM_EDILDI"),
  );
  const pending = summarizeEarnings(
    items.filter((i) => i.status !== "TESLIM_EDILDI"),
  );

  return (
    <>
      <PanelHeader
        title="Kazançlarım"
        description={`Komisyon oranın ${formatPercent(seller.commissionRate)}. Kazanç = kalem tutarı − (kalem tutarı × komisyon oranı).`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Toplam ciro"
          value={formatPrice(all.gross)}
          icon="chart"
          hint="Ödemesi alınmış tüm kalemler"
        />
        <StatCard
          label="Platform komisyonu"
          value={formatPrice(all.commission)}
          icon="tag"
          hint={`Ortalama ${formatPercent(seller.commissionRate)}`}
        />
        <StatCard
          label="Net kazancın"
          value={formatPrice(all.net)}
          icon="wallet"
          accent
          hint="Komisyon düşülmüş toplam"
        />
        <StatCard
          label="Yolda olan kazanç"
          value={formatPrice(pending.net)}
          icon="clock"
          hint="Teslim edilmemiş siparişlerden"
        />
      </div>

      <div className="mt-6 rounded-lg border border-line bg-surface px-5 py-4">
        <p className="text-[13px] leading-relaxed text-muted">
          Teslim edilen siparişlerden hak edişin{" "}
          <strong className="tabular font-semibold text-plum-800">
            {formatPrice(delivered.net)}
          </strong>
          . Hak ediş, gerçek sistemde haftalık olarak banka hesabına aktarılır;
          bu demoda ödeme aktarımı simüle edilmemiştir.
        </p>
      </div>

      <h2 className="mb-3 mt-8 text-[15px] font-semibold">Kalem bazlı döküm</h2>

      {items.length === 0 ? (
        <EmptyState
          title="Henüz kazanç kaydın yok"
          description="Ödemesi tamamlanmış ilk siparişin geldiğinde burada satır satır görürsün."
          action={{ href: "/satici/urunler", label: "Ürünlerime git" }}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sipariş</th>
                  <th>Tarih</th>
                  <th>Ürün</th>
                  <th>Adet</th>
                  <th>Tutar</th>
                  <th>Komisyon</th>
                  <th>Kazanç</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Link
                        href={`/satici/siparisler/${item.order.orderNo}`}
                        className="mono whitespace-nowrap font-semibold text-plum-900 hover:underline"
                      >
                        {item.order.orderNo}
                      </Link>
                    </td>
                    <td className="tabular whitespace-nowrap text-muted">
                      {formatDateShort(item.order.createdAt)}
                    </td>
                    <td className="max-w-[16rem] truncate">
                      {item.productName}
                    </td>
                    <td className="tabular">{item.quantity}</td>
                    <td className="tabular">{formatPrice(lineTotal(item))}</td>
                    <td className="tabular text-muted">
                      −{formatPrice(lineCommission(item))}
                    </td>
                    <td className="tabular font-semibold text-plum-700">
                      {formatPrice(lineEarning(item))}
                    </td>
                    <td>
                      <OrderStatusBadge status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-plum-50">
                  <td
                    colSpan={4}
                    className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted"
                  >
                    Genel toplam
                  </td>
                  <td className="tabular px-4 py-3 font-semibold">
                    {formatPrice(all.gross)}
                  </td>
                  <td className="tabular px-4 py-3 text-muted">
                    −{formatPrice(all.commission)}
                  </td>
                  <td className="tabular px-4 py-3 text-[15px] font-bold text-plum-800">
                    {formatPrice(all.net)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
