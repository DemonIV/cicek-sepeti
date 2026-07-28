import { Skeleton, ProductGridSkeleton } from "@/components/ui/Skeleton";

/** Kategori: üstte geniş kapak bandı, altında ürün ızgarası. */
export default function CategoryLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 md:py-10">
      <Skeleton className="h-[9rem] w-full rounded-xl sm:h-[13rem]" />

      <div className="mt-6 flex flex-wrap gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-md" />
        ))}
      </div>

      <Skeleton className="mt-8 h-6 w-36" />

      <div className="mt-4">
        <ProductGridSkeleton count={10} />
      </div>
    </div>
  );
}
