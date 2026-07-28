import { Skeleton, ProductGridSkeleton } from "@/components/ui/Skeleton";

/** Katalog: solda filtre çubuğu, sağda ızgara — oturduğunda hiçbir şey kaymaz. */
export default function CatalogLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 md:py-10">
      <div className="mb-5 md:mb-8">
        <Skeleton className="h-2.5 w-20" />
        <Skeleton className="mt-3 h-8 w-64" />
        <Skeleton className="mt-3 h-3 w-96 max-w-full" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[15rem_1fr]">
        <aside className="hidden lg:block">
          <div className="card card-pad">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-4 h-2.5 w-full" />
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="mt-3 h-3 w-full" />
            ))}
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-36 rounded-md" />
          </div>
          <ProductGridSkeleton
            count={10}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 xl:grid-cols-5"
          />
        </div>
      </div>
    </div>
  );
}
