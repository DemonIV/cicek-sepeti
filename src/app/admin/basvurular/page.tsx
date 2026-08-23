import type { Metadata } from "next";
import { db } from "@/lib/db";
import { formatDate, formatPercent, relativeTime } from "@/lib/format";
import { PanelHeader } from "@/components/panel/PanelShell";
import { SellerApplicationActions } from "@/components/panel/AdminControls";
import { SellerStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ImageFallback, ProductImage } from "@/components/ui/ProductImage";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Satıcı başvuruları" };

export default async function ApplicationsPage() {
  const [pending, decided] = await Promise.all([
    db.seller.findMany({
      where: { status: "PENDING" },
      include: { user: true, _count: { select: { products: true } } },
      orderBy: { appliedAt: "asc" },
    }),
    db.seller.findMany({
      where: { status: { in: ["APPROVED", "REJECTED"] } },
      include: { user: true },
      orderBy: { appliedAt: "desc" },
      take: 8,
    }),
  ]);

  return (
    <>
      <PanelHeader
        title="Satıcı başvuruları"
        description="Onaylanan mağazaların ürünleri vitrine çıkar ve sipariş almaya başlar. Reddedilenler panele giremez."
      />

      {pending.length === 0 ? (
        <EmptyState
          title="Bekleyen başvuru yok"
          description="Yeni bir çiçekçi başvurduğunda burada listelenir ve yan menüde sayısı görünür."
          action={{ href: "/admin/saticilar", label: "Satıcı yönetimine git" }}
        />
      ) : (
        <div className="space-y-4">
          {pending.map((seller) => (
            <article key={seller.id} className="card overflow-hidden">
              <div className="grid gap-0 md:grid-cols-[14rem_1fr]">
                <div className="relative aspect-[16/9] bg-plum-50 md:aspect-auto md:min-h-[11rem]">
                  {/* Vitrinden gelen başvurunun kapak görseli olmaz;
                      kırık kare yerine yerel çizim düşer. */}
                  {seller.coverUrl ? (
                    <ProductImage
                      src={seller.coverUrl}
                      alt={seller.storeName}
                      sizes="224px"
                    />
                  ) : (
                    <ImageFallback />
                  )}
                </div>

                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-plum-950">
                        {seller.storeName}
                      </h2>
                      <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted">
                        <Icon name="pin" size={14} />
                        {seller.district ? `${seller.district}, ` : ""}
                        {seller.city}
                      </p>
                    </div>
                    <SellerStatusBadge status={seller.status} />
                  </div>

                  <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-muted">
                    {seller.about}
                  </p>

                  <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 border-t border-line pt-4 text-[13px]">
                    <Detail term="Yetkili" value={seller.user.name} />
                    <Detail term="E-posta" value={seller.user.email} />
                    <Detail term="Telefon" value={seller.phone ?? "—"} />
                    <Detail
                      term="Komisyon"
                      value={formatPercent(seller.commissionRate)}
                    />
                    <Detail
                      term="Hazır ürün"
                      value={`${seller._count.products} adet`}
                    />
                    <Detail
                      term="Başvuru"
                      value={`${formatDate(seller.appliedAt)} (${relativeTime(seller.appliedAt)})`}
                    />
                  </dl>

                  <div className="mt-5">
                    <SellerApplicationActions sellerId={seller.id} />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <h2 className="mb-3 mt-10 text-[15px] font-semibold">
        Sonuçlanmış başvurular
      </h2>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mağaza</th>
                <th>Şehir</th>
                <th>Yetkili</th>
                <th>Başvuru tarihi</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {decided.map((seller) => (
                <tr key={seller.id}>
                  <td className="font-medium">{seller.storeName}</td>
                  <td className="text-muted">{seller.city}</td>
                  <td className="text-muted">{seller.user.name}</td>
                  <td className="tabular whitespace-nowrap text-muted">
                    {formatDate(seller.appliedAt)}
                  </td>
                  <td>
                    <SellerStatusBadge status={seller.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function Detail({ term, value }: { term: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-faint">
        {term}
      </dt>
      <dd className="mt-0.5 font-medium text-plum-950">{value}</dd>
    </div>
  );
}
