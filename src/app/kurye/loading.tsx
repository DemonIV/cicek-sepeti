import { PanelHeaderSkeleton, Skeleton } from "@/components/ui/Skeleton";

/** Kurye ekranı tablo değil kart listesidir — iskeleti de öyle. */
export default function CourierLoading() {
  return (
    <>
      <PanelHeaderSkeleton />
      <div className="space-y-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="card card-pad">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-5 w-24 rounded-sm" />
            </div>
            <Skeleton className="mt-4 h-3 w-64 max-w-full" />
            <Skeleton className="mt-2 h-3 w-80 max-w-full" />
            <Skeleton className="mt-4 h-9 w-40 rounded-md" />
          </div>
        ))}
      </div>
    </>
  );
}
