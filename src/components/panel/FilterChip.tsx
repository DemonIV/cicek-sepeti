import Link from "next/link";

export function FilterChip({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count?: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
        active
          ? "bg-plum-900 text-white"
          : "border border-line bg-surface text-plum-800 hover:border-plum-300"
      }`}
    >
      {label}
      {count !== undefined && (
        <span
          className={`tabular font-mono text-[11px] ${
            active ? "text-white/60" : "text-faint"
          }`}
        >
          {count}
        </span>
      )}
    </Link>
  );
}
