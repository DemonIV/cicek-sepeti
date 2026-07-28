/**
 * Ürün puanı.
 *
 * Yıldız **dolu** çizilir — ikon setinin geri kalanı çizgiseldir, puan ise bir
 * ölçü değil bir işarettir. Rengi `gold`: tasarım sisteminde kadife sarısı
 * yalnızca kıtlık ve puan için ayrılmıştır, o yüzden burada süs değil anlam
 * taşır.
 */

function Star({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className="flex-none text-gold-500"
      aria-hidden
    >
      <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9L12 2.6Z" />
    </svg>
  );
}

/** Kart içi: sıkışık, tek satır. */
export function RatingInline({
  value,
  count,
  className = "",
}: {
  value: number;
  count: number;
  className?: string;
}) {
  return (
    <span
      className={`tabular inline-flex items-center gap-1 text-[11px] leading-none text-muted ${className}`}
    >
      <Star size={11} />
      <span className="font-semibold text-plum-900">{value.toFixed(1)}</span>
      <span className="text-faint">({count})</span>
    </span>
  );
}

/** Ürün detayı: puan + değerlendirme sayısı yazıyla. */
export function RatingBlock({
  value,
  count,
}: {
  value: number;
  count: number;
}) {
  return (
    <span className="tabular inline-flex items-center gap-1.5 text-[13px] leading-none text-muted">
      <Star size={15} />
      <span className="text-[15px] font-semibold text-plum-950">
        {value.toFixed(1)}
      </span>
      <span>· {count} değerlendirme</span>
    </span>
  );
}
