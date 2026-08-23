import { formatDate } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { HelpfulButton } from "@/components/site/HelpfulButton";

type Review = {
  id: string;
  authorName: string;
  city: string;
  rating: number;
  comment: string;
  helpful: number;
  isVerified: boolean;
  reply: string | null;
  createdAt: Date;
};

/**
 * Ürün değerlendirmeleri.
 *
 * Yıldızın yanındaki rakam tek başına bir şey anlatmıyor; asıl ikna eden,
 * altındaki cümleler ve satıcının cevabı. Dağılım çubuğu da düşük puanları
 * saklamadan gösterir — hepsi beş yıldız olan bir liste inandırıcı olmaz.
 */
export function ProductReviews({
  reviews,
  total,
  average,
  breakdown,
}: {
  reviews: Review[];
  total: number;
  average: number;
  breakdown: { star: number; count: number; percent: number }[];
}) {
  if (total === 0) {
    return (
      <EmptyState
        compact
        title="Bu ürüne henüz yorum yapılmamış"
        description="İlk değerlendirme, siparişin teslim edildikten sonra yazılabilir."
      />
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
      {/* ------------------------------- Özet -------------------------------- */}
      <aside className="lg:sticky lg:top-[4.5rem] lg:self-start">
        <div className="card card-pad">
          <p className="flex items-baseline gap-2">
            <span className="tabular font-display text-[2.4rem] leading-none font-semibold text-plum-950">
              {average.toFixed(1)}
            </span>
            <span className="text-[13px] text-muted">/ 5</span>
          </p>
          <p className="tabular mt-1 text-[12.5px] text-muted">
            {total} değerlendirme
          </p>

          <div className="mt-4 space-y-1.5">
            {breakdown.map((row) => (
              <div key={row.star} className="flex items-center gap-2">
                <span className="tabular w-3 text-[11.5px] text-muted">
                  {row.star}
                </span>
                <Star />
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-plum-100">
                  <span
                    className="block h-full rounded-full bg-gold-500"
                    style={{ width: `${row.percent}%` }}
                  />
                </span>
                <span className="tabular w-7 text-right text-[11.5px] text-faint">
                  {row.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ------------------------------ Yorumlar ------------------------------ */}
      <ul className="space-y-4">
        {reviews.map((review) => (
          <li key={review.id} className="card card-pad">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Stars value={review.rating} />
                <span className="text-[13px] font-semibold text-plum-950">
                  {review.authorName}
                </span>
                <span className="text-[12px] text-faint">{review.city}</span>
              </div>
              <span className="text-[12px] text-faint">
                {formatDate(review.createdAt)}
              </span>
            </div>

            {review.isVerified && (
              <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11.5px] font-medium text-fern-700">
                <Icon name="check" size={13} />
                Doğrulanmış alışveriş
              </p>
            )}

            <p className="mt-2.5 text-[13.5px] leading-relaxed text-plum-900">
              {review.comment}
            </p>

            {review.reply && (
              <div className="mt-3 rounded-md border-l-2 border-bloom-300 bg-plum-50 px-3.5 py-2.5">
                <p className="text-[11.5px] font-semibold text-plum-800">
                  Satıcının cevabı
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                  {review.reply}
                </p>
              </div>
            )}

            <div className="mt-3 flex justify-end">
              <HelpfulButton reviewId={review.id} count={review.helpful} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Star({ dim = false }: { dim?: boolean }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`flex-none ${dim ? "text-plum-200" : "text-gold-500"}`}
      aria-hidden
    >
      <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9L12 2.6Z" />
    </svg>
  );
}

export function Stars({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${value} yıldız`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} dim={star > value} />
      ))}
    </span>
  );
}
