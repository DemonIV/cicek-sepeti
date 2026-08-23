import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { maskName } from "@/lib/reviews";
import { PanelHeader } from "@/components/panel/PanelShell";
import { FilterChip } from "@/components/panel/FilterChip";
import { ReviewReply } from "@/components/panel/ReviewControls";
import { Stars } from "@/components/site/ProductReviews";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductImage } from "@/components/ui/ProductImage";

export const metadata: Metadata = { title: "Yorumlarım" };

type Search = Promise<{ filtre?: string }>;

const TABS = [
  { key: "cevapsiz", label: "Cevap bekleyen" },
  { key: "dusuk", label: "3 yıldız ve altı" },
  { key: "tumu", label: "Tümü" },
] as const;

/**
 * Satıcının kendi ürünlerine gelen değerlendirmeler.
 *
 * Çok satıcılı yapıda yorum ürüne olduğu kadar **mağazaya** da yazılır: puanı
 * düşüren yorumu gören bayi cevabını buradan yazar. Vitrinden kaldırma yetkisi
 * bayide değil, operasyondadır.
 */
export default async function SellerReviewsPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const seller = await getCurrentSeller();
  if (!seller) return null;

  const { filtre } = await searchParams;
  const active = TABS.find((tab) => tab.key === filtre) ?? TABS[0];

  const where = {
    sellerId: seller.id,
    ...(active.key === "cevapsiz" ? { reply: null, isHidden: false } : {}),
    ...(active.key === "dusuk" ? { rating: { lte: 3 } } : {}),
  };

  const [reviews, counts, average] = await Promise.all([
    db.review.findMany({
      where,
      include: { product: { select: { name: true, slug: true, imageUrl: true } } },
      orderBy: [{ createdAt: "desc" }],
      take: 60,
    }),
    Promise.all([
      db.review.count({ where: { sellerId: seller.id, reply: null, isHidden: false } }),
      db.review.count({ where: { sellerId: seller.id, rating: { lte: 3 } } }),
      db.review.count({ where: { sellerId: seller.id } }),
    ]),
    db.review.aggregate({
      where: { sellerId: seller.id, isHidden: false },
      _avg: { rating: true },
    }),
  ]);

  const [waiting, low, total] = counts;

  return (
    <>
      <PanelHeader
        title="Yorumlarım"
        description="Müşterilerin ürünlerine yazdığı değerlendirmeler. Cevabın vitrinde yorumun altında görünür."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Summary label="Mağaza puanı" value={(average._avg.rating ?? 0).toFixed(1)} hint={`${total} değerlendirme`} />
        <Summary label="Cevap bekleyen" value={String(waiting)} hint="Cevaplamak puanı yükseltir" accent={waiting > 0} />
        <Summary label="3 yıldız ve altı" value={String(low)} hint="Önce bunlara bak" accent={low > 0} />
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {TABS.map((tab) => (
          <FilterChip
            key={tab.key}
            href={
              tab.key === "cevapsiz"
                ? "/satici/yorumlar"
                : `/satici/yorumlar?filtre=${tab.key}`
            }
            active={active.key === tab.key}
            label={tab.label}
            count={
              tab.key === "cevapsiz" ? waiting : tab.key === "dusuk" ? low : total
            }
          />
        ))}
      </div>

      {reviews.length === 0 ? (
        <EmptyState
          title={
            active.key === "cevapsiz"
              ? "Cevap bekleyen yorum yok"
              : "Bu filtreyle eşleşen yorum yok"
          }
          description="Müşteriler ürünlerini değerlendirdikçe yorumlar burada listelenir."
        />
      ) : (
        <ul className="space-y-4">
          {reviews.map((review) => (
            <li key={review.id} className="card card-pad">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <Link
                  href={`/urun/${review.product.slug}`}
                  className="flex min-w-0 items-center gap-3"
                >
                  <span className="relative size-11 flex-none overflow-hidden rounded-md bg-plum-50">
                    <ProductImage
                      src={review.product.imageUrl}
                      alt={review.product.name}
                      sizes="44px"
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13.5px] font-semibold text-plum-950">
                      {review.product.name}
                    </span>
                    <span className="block text-[11.5px] text-muted">
                      {maskName(review.authorName)} · {review.city} ·{" "}
                      {formatDate(review.createdAt)}
                    </span>
                  </span>
                </Link>

                <div className="flex items-center gap-2">
                  <Stars value={review.rating} />
                  {review.isHidden && <Badge tone="neutral">Vitrinde değil</Badge>}
                  {!review.reply && !review.isHidden && (
                    <Badge tone="amber" dot>
                      Cevap bekliyor
                    </Badge>
                  )}
                </div>
              </div>

              <p className="mt-3 text-[13.5px] leading-relaxed text-plum-900">
                {review.comment}
              </p>

              {review.reply && (
                <div className="mt-3 rounded-md border-l-2 border-bloom-300 bg-plum-50 px-3.5 py-2.5">
                  <p className="text-[11.5px] font-semibold text-plum-800">
                    Cevabın
                  </p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                    {review.reply}
                  </p>
                </div>
              )}

              <div className="mt-3 flex flex-wrap justify-end">
                <ReviewReply reviewId={review.id} reply={review.reply} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Summary({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div className={`card card-pad ${accent ? "border-gold-300" : ""}`}>
      <p className="field-label">{label}</p>
      <p className="tabular mt-1 font-display text-[1.6rem] font-semibold leading-none text-plum-950">
        {value}
      </p>
      <p className="mt-1.5 text-[11.5px] text-muted">{hint}</p>
    </div>
  );
}
