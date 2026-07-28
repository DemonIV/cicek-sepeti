/**
 * Yükleniyor iskeletleri.
 *
 * Kural: iskelet, gelecek içeriğin **düzenini** taklit eder — genel bir
 * dönen çark değil. Ürün ızgarası kare kutu + iki metin satırı, tablo satır
 * satır gelir. Böylece sayfa oturduğunda hiçbir şey yerinden zıplamaz.
 */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

/** Kart iskeleti: kare görsel + satıcı satırı + ad + fiyat. */
export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-square rounded-none" />
      <div className="p-2.5 sm:p-3">
        <Skeleton className="h-2 w-2/3" />
        <Skeleton className="mt-2 h-3 w-full" />
        <Skeleton className="mt-1.5 h-3 w-4/5" />
        <Skeleton className="mt-3 h-4 w-1/2" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({
  count = 10,
  className = "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Panel başlığı: sayfa adı + açıklama. */
export function PanelHeaderSkeleton() {
  return (
    <div className="mb-6">
      <Skeleton className="h-7 w-56" />
      <Skeleton className="mt-2.5 h-3 w-80 max-w-full" />
    </div>
  );
}

/** Dört ölçüt kartı — satıcı ve admin panolarının üst şeridi. */
export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card card-pad">
          <Skeleton className="h-2.5 w-24" />
          <Skeleton className="mt-3 h-7 w-32" />
          <Skeleton className="mt-3 h-2.5 w-full" />
        </div>
      ))}
    </div>
  );
}

/** Veri tablosu — başlık şeridi + satırlar. */
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-line bg-plum-50 px-4 py-3">
        <Skeleton className="h-2.5 w-40 bg-plum-100" />
      </div>
      <div className="divide-y divide-[var(--color-line)]">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            <Skeleton className="h-3 w-28 flex-none" />
            <Skeleton className="h-3 w-20 flex-none" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-5 w-24 flex-none rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  );
}
