import { Skeleton, ProductGridSkeleton } from "@/components/ui/Skeleton";

/** Mağaza: geniş kapak + mağaza künyesi + ürünler. */
export default function StoreLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 md:py-10">
      <div className="card overflow-hidden">
        <Skeleton className="aspect-[16/6] w-full rounded-none sm:aspect-[16/4]" />
        <div className="p-5 sm:p-6">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="mt-3 h-3 w-48" />
          <Skeleton className="mt-4 h-3 w-full max-w-2xl" />
        </div>
      </div>

      <Skeleton className="mt-10 h-6 w-52" />

      <div className="mt-4">
        <ProductGridSkeleton count={10} />
      </div>
    </div>
  );
}
