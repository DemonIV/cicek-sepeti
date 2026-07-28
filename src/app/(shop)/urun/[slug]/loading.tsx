import { Skeleton } from "@/components/ui/Skeleton";

/** Ürün detay: solda kare kahraman görsel, sağda bilgi sütunu. */
export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6">
      <Skeleton className="mb-6 h-3 w-64 max-w-full" />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,34rem)_1fr] lg:gap-16">
        <Skeleton className="aspect-square w-full rounded-lg" />

        <div className="lg:py-4">
          <Skeleton className="h-8 w-52 rounded-md" />
          <Skeleton className="mt-5 h-10 w-4/5" />
          <Skeleton className="mt-4 h-7 w-40" />
          <Skeleton className="mt-6 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-11/12" />
          <Skeleton className="mt-8 h-12 w-64 rounded-md" />

          <div className="mt-8 space-y-5 border-y border-line py-5">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i}>
                <Skeleton className="h-3 w-28" />
                <Skeleton className="mt-2 h-3 w-72 max-w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
