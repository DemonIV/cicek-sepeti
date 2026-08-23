import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { maskName } from "@/lib/reviews";
import { PanelHeader } from "@/components/panel/PanelShell";
import { FilterChip } from "@/components/panel/FilterChip";
import { ReviewVisibility } from "@/components/panel/ReviewControls";
import { Stars } from "@/components/site/ProductReviews";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Yorum yönetimi" };

type Search = Promise<{ filtre?: string; satici?: string }>;

const TABS = [
  { key: "dusuk", label: "3 yıldız ve altı" },
  { key: "gizli", label: "Vitrinden kaldırılan" },
  { key: "tumu", label: "Tümü" },
] as const;

/**
 * Yorum moderasyonu.
 *
 * Vitrinden kaldırma yetkisi yalnızca operasyonda: bayi kendi puanını
 * düşüren yorumu silememeli. Kaldırılan yorum ürünün puanından da düşer
 * (`refreshProductRating`), böylece rakam listeyle uyumlu kalır.
 */
export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const { filtre, satici } = await searchParams;
  const active = TABS.find((tab) => tab.key === filtre) ?? TABS[0];

  const where = {
    ...(active.key === "dusuk" ? { rating: { lte: 3 } } : {}),
    ...(active.key === "gizli" ? { isHidden: true } : {}),
    ...(satici ? { seller: { slug: satici } } : {}),
  };

  const [reviews, sellers, counts] = await Promise.all([
    db.review.findMany({
      where,
      include: {
        product: { select: { name: true, slug: true } },
        seller: { select: { storeName: true, slug: true, id: true } },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 80,
    }),
    db.seller.findMany({
      where: { status: "APPROVED" },
      orderBy: { storeName: "asc" },
      select: { slug: true, storeName: true },
    }),
    Promise.all([
      db.review.count({ where: { rating: { lte: 3 } } }),
      db.review.count({ where: { isHidden: true } }),
      db.review.count(),
    ]),
  ]);

  const [low, hidden, total] = counts;

  const href = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams();
    const base = { filtre: filtre ?? null, satici: satici ?? null };
    for (const [key, value] of Object.entries({ ...base, ...patch })) {
      if (value) params.set(key, value);
    }
    const query = params.toString();
    return query ? `/admin/yorumlar?${query}` : "/admin/yorumlar";
  };

  return (
    <>
      <PanelHeader
        title="Yorum yönetimi"
        description="Tüm bayilerin ürünlerine gelen değerlendirmeler. Kaldırılan yorum vitrinden düşer ve ürünün puanı yeniden hesaplanır."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {TABS.map((tab) => (
          <FilterChip
            key={tab.key}
            href={href({ filtre: tab.key === "dusuk" ? null : tab.key })}
            active={active.key === tab.key}
            label={tab.label}
            count={tab.key === "dusuk" ? low : tab.key === "gizli" ? hidden : total}
          />
        ))}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <FilterChip
          href={href({ satici: null })}
          active={!satici}
          label="Tüm mağazalar"
        />
        {sellers.map((seller) => (
          <FilterChip
            key={seller.slug}
            href={href({ satici: seller.slug })}
            active={satici === seller.slug}
            label={seller.storeName}
          />
        ))}
      </div>

      {reviews.length === 0 ? (
        <EmptyState
          title="Bu filtreyle eşleşen yorum yok"
          description="Düşük puanlı yorumlar ve vitrinden kaldırılanlar burada toplanır."
        />
      ) : (
        <ul className="space-y-3">
          {reviews.map((review) => (
            <li key={review.id} className="card card-pad">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Stars value={review.rating} />
                    <Link
                      href={`/urun/${review.product.slug}`}
                      className="text-[13.5px] font-semibold text-plum-950 hover:underline"
                    >
                      {review.product.name}
                    </Link>
                    {review.isHidden && (
                      <Badge tone="neutral" dot>
                        Vitrinde değil
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[11.5px] text-muted">
                    <Icon name="store" size={13} className="text-plum-400" />
                    {review.seller.storeName} · {maskName(review.authorName)} ·{" "}
                    {review.city} · {formatDate(review.createdAt)}
                  </p>
                </div>

                <ReviewVisibility reviewId={review.id} hidden={review.isHidden} />
              </div>

              <p className="mt-2.5 text-[13px] leading-relaxed text-plum-900">
                {review.comment}
              </p>

              {review.reply && (
                <p className="mt-2 rounded-md border-l-2 border-bloom-300 bg-plum-50 px-3 py-2 text-[12.5px] leading-relaxed text-muted">
                  <span className="font-semibold text-plum-800">
                    Satıcı cevabı:{" "}
                  </span>
                  {review.reply}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
