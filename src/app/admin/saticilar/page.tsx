import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { summarizeEarnings } from "@/lib/pricing";
import { PanelHeader } from "@/components/panel/PanelShell";
import {
  CommissionEditor,
  SellerStatusToggle,
} from "@/components/panel/AdminControls";
import { LateScanButton } from "@/components/panel/SellerControls";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { scoreBand } from "@/lib/seller-score";

export const metadata: Metadata = { title: "Satıcı yönetimi" };

export default async function AdminSellersPage() {
  const sellers = await db.seller.findMany({
    include: {
      user: true,
      accountManager: true,
      _count: { select: { products: true, areas: true } },
      items: {
        where: { status: { not: "IPTAL" }, order: { paymentStatus: "ODENDI" } },
        select: { unitPrice: true, quantity: true, commissionRate: true },
      },
    },
    orderBy: [{ status: "asc" }, { storeName: "asc" }],
  });

  return (
    <>
      <PanelHeader
        title="Satıcı yönetimi"
        description="Komisyon oranı satır üzerinde değiştirilir. Bölge eşleşmesi, kota, puan ve sorumlu ataması için bayinin künyesini aç."
        actions={<LateScanButton />}
      />

      {sellers.length === 0 ? (
        <EmptyState
          title="Kayıtlı satıcı yok"
          description="Satıcılar başvuru yaptığında burada listelenir."
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mağaza</th>
                  <th>Şehir</th>
                  <th>Sorumlu</th>
                  <th>Bölge</th>
                  <th>Puan</th>
                  <th>Ürün</th>
                  <th>Ciro</th>
                  <th>Platform geliri</th>
                  <th>Komisyon</th>
                  <th>Durum</th>
                  <th className="text-right">Künye</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((seller) => {
                  const totals = summarizeEarnings(seller.items);

                  return (
                    <tr key={seller.id}>
                      <td>
                        {seller.status === "APPROVED" ? (
                          <Link
                            href={`/magaza/${seller.slug}`}
                            className="font-medium text-plum-900 hover:underline"
                          >
                            {seller.storeName}
                          </Link>
                        ) : (
                          <span className="font-medium">
                            {seller.storeName}
                          </span>
                        )}
                      </td>
                      <td className="text-muted">
                        {seller.city}
                        {!seller.acceptingOrders && (
                          <span className="mt-1 block text-[11px] font-semibold text-[#9c2f2a]">
                            Sipariş alımı kapalı
                          </span>
                        )}
                      </td>
                      <td className="text-muted">
                        {seller.accountManager?.name ?? "—"}
                        <span className="block text-[11px] text-faint">
                          {seller.user.name}
                        </span>
                      </td>
                      <td className="tabular text-muted">
                        {seller._count.areas}
                      </td>
                      <td>
                        {(() => {
                          const band = scoreBand(seller.score);
                          return (
                            <Badge tone={band.tone} dot>
                              {seller.score}
                            </Badge>
                          );
                        })()}
                      </td>
                      <td className="tabular">{seller._count.products}</td>
                      <td className="tabular font-semibold">
                        {formatPrice(totals.gross)}
                      </td>
                      <td className="tabular font-semibold text-bloom-700">
                        {formatPrice(totals.commission)}
                      </td>
                      <td>
                        <CommissionEditor
                          sellerId={seller.id}
                          rate={seller.commissionRate}
                        />
                      </td>
                      <td>
                        <SellerStatusToggle
                          sellerId={seller.id}
                          status={seller.status}
                        />
                      </td>
                      <td>
                        <div className="flex justify-end">
                          <Link
                            href={`/admin/saticilar/${seller.id}`}
                            className="btn btn-outline btn-sm"
                          >
                            <Icon name="store" size={14} />
                            A&ccedil;
                          </Link>
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
