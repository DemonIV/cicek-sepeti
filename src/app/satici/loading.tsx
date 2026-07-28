import {
  PanelHeaderSkeleton,
  StatCardsSkeleton,
  TableSkeleton,
} from "@/components/ui/Skeleton";

export default function SellerLoading() {
  return (
    <>
      <PanelHeaderSkeleton />
      <StatCardsSkeleton />
      <div className="mt-6">
        <TableSkeleton rows={6} />
      </div>
    </>
  );
}
