import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { formatDateTime, formatPrice } from "@/lib/format";
import {
  PRODUCT_REQUEST_STATUS_META,
  type ProductRequestStatus,
} from "@/lib/enums";
import { PanelHeader } from "@/components/panel/PanelShell";
import { FilterChip } from "@/components/panel/FilterChip";
import { ProductRequestReview } from "@/components/panel/ProductRequestControls";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { ProductImage } from "@/components/ui/ProductImage";

export const metadata: Metadata = { title: "Ürün başvuruları" };

type Search = Promise<{ durum?: string }>;

const TABS = [
  { key: "bekleyen", label: "Bekleyen", status: "BEKLIYOR" },
  { key: "onaylanan", label: "Onaylanan", status: "ONAYLANDI" },
  { key: "reddedilen", label: "Reddedilen", status: "REDDEDILDI" },
  { key: "tumu", label: "Tümü", status: null },
] as const;

/**
 * Bayilerin ürün başvuruları.
 *
 * Bayi ürünü kendi panelinden önerir; ürün ancak burada onaylanınca oluşur ve
 * vitrine çıkar. Böylece madde 4'teki "ürün bilgisi tek elden yönetilir" kuralı
 * korunur: onaydan sonraki her düzenleme yine operasyondan geçer.
 */
export default async function ProductRequestsPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const { durum } = await searchParams;
  const active = TABS.find((tab) => tab.key === durum) ?? TABS[0];

  const [requests, waitingCount] = await Promise.all([
    db.productRequest.findMany({
      where: active.status ? { status: active.status } : {},
      include: { seller: true, category: true },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 100,
    }),
    db.productRequest.count({ where: { status: "BEKLIYOR" } }),
  ]);

  return (
    <>
      <PanelHeader
        title="Ürün başvuruları"
        description="Bayilerin mağazalarına eklemek istediği ürünler. Onayladığın ürün doğrudan vitrine çıkar; reddedersen sebep bayinin panelinde görünür."
        actions={
          <Link href="/admin/urunler" className="btn btn-outline btn-sm">
            Ürün yönetimi
          </Link>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {TABS.map((tab) => (
          <FilterChip
            key={tab.key}
            href={
              tab.key === "bekleyen"
                ? "/admin/urunler/basvurular"
                : `/admin/urunler/basvurular?durum=${tab.key}`
            }
            active={active.key === tab.key}
            label={tab.label}
            count={tab.key === "bekleyen" ? waitingCount : undefined}
          />
        ))}
      </div>

      {requests.length === 0 ? (
        <EmptyState
          title={
            active.status === "BEKLIYOR"
              ? "Onay bekleyen başvuru yok"
              : "Bu filtreyle eşleşen başvuru yok"
          }
          description="Bayiler yeni ürünlerini kendi panellerindeki “Yeni ürün başvurusu” ekranından gönderir; gelen başvurular burada listelenir."
        />
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const meta =
              PRODUCT_REQUEST_STATUS_META[request.status as ProductRequestStatus];
            const gallery = request.galleryUrls
              .split(/\r?\n/)
              .map((line) => line.trim())
              .filter(Boolean);

            return (
              <article key={request.id} className="card card-pad">
                <div className="flex flex-col gap-5 lg:flex-row">
                  <div className="relative aspect-square w-full flex-none overflow-hidden rounded-lg bg-plum-50 sm:w-40">
                    <ProductImage
                      src={request.imageUrl}
                      alt={request.name}
                      sizes="160px"
                    />
                  </div>

                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-[16px] font-semibold text-plum-950">
                            {request.name}
                          </h2>
                          {meta && (
                            <Badge tone={meta.tone} dot>
                              {meta.label}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-[12.5px] text-muted">
                          <Link
                            href={`/admin/saticilar/${request.seller.id}`}
                            className="font-medium text-plum-800 hover:underline"
                          >
                            {request.seller.storeName}
                          </Link>{" "}
                          · {request.seller.city} · {request.category.name} ·{" "}
                          {formatDateTime(request.createdAt)}
                        </p>
                      </div>

                      <p className="tabular font-display text-[1.35rem] font-semibold text-bloom-700">
                        {formatPrice(request.price)}
                      </p>
                    </div>

                    <p className="text-[13px] leading-relaxed text-muted">
                      {request.description}
                    </p>

                    <dl className="flex flex-wrap gap-x-6 gap-y-1.5 text-[12.5px]">
                      <div className="flex gap-1.5">
                        <dt className="text-faint">Stok:</dt>
                        <dd className="tabular font-medium">{request.stock}</dd>
                      </div>
                      <div className="flex gap-1.5">
                        <dt className="text-faint">Ek görsel:</dt>
                        <dd className="tabular font-medium">{gallery.length}</dd>
                      </div>
                      <div className="flex gap-1.5">
                        <dt className="text-faint">Video:</dt>
                        <dd className="font-medium">
                          {request.videoUrl ? "var" : "yok"}
                        </dd>
                      </div>
                    </dl>

                    {gallery.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {gallery.slice(0, 5).map((url) => (
                          <div
                            key={url}
                            className="relative size-14 overflow-hidden rounded-md bg-plum-50"
                          >
                            <ProductImage
                              src={url}
                              alt="Ek görsel"
                              sizes="56px"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {request.sellerNote && (
                      <p className="flex items-start gap-2 rounded-md bg-plum-50 px-3 py-2 text-[12.5px] leading-relaxed text-plum-800">
                        <Icon
                          name="alert"
                          size={15}
                          className="mt-0.5 flex-none text-plum-500"
                        />
                        Bayi notu: {request.sellerNote}
                      </p>
                    )}

                    {request.status !== "BEKLIYOR" && (
                      <p className="text-[12px] text-faint">
                        {request.reviewedBy}
                        {request.reviewedAt
                          ? ` · ${formatDateTime(request.reviewedAt)}`
                          : ""}
                        {request.reviewNote ? ` · ${request.reviewNote}` : ""}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                      {request.status === "BEKLIYOR" ? (
                        <ProductRequestReview requestId={request.id} />
                      ) : request.productId ? (
                        <Link
                          href={`/admin/urunler/${request.productId}`}
                          className="btn btn-outline btn-sm"
                        >
                          Ürünü düzenle
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
