import {
  PanelHeaderSkeleton,
  StatCardsSkeleton,
  TableSkeleton,
} from "@/components/ui/Skeleton";

export default function AdminLoading() {
  return (
    <>
      <PanelHeaderSkeleton />
      <StatCardsSkeleton />
      <div className="mt-6">
        <TableSkeleton rows={8} />
      </div>
    </>
  );
}
