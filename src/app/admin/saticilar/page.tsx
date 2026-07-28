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
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Satıcı yönetimi" };

export default async function AdminSellersPage() {
  const sellers = await db.seller.findMany({
    include: {
      user: true,
      _count: { select: { products: true } },
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
        description="Komisyon oranı satır üzerinde değiştirilir. Değişiklik yalnızca yeni siparişlere uygulanır; geçmiş kalemler kendi oranını korur."
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
                  <th>Yetkili</th>
                  <th>Ürün</th>
                  <th>Ciro</th>
                  <th>Platform geliri</th>
                  <th>Komisyon</th>
                  <th>Durum</th>
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
                      <td className="text-muted">{seller.city}</td>
                      <td className="text-muted">{seller.user.name}</td>
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
