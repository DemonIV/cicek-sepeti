import Link from "next/link";

/**
 * Boş liste durumu. Sunum sırasında biri boş bir sekmeye tıklarsa, ne olduğu
 * ve ne yapabileceği burada yazar — asla boş bir alan görünmez.
 */
export function EmptyState({
  title,
  description,
  action,
  compact = false,
}: {
  title: string;
  description: string;
  action?: { href: string; label: string };
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border border-dashed border-line-strong bg-surface/60 text-center ${
        compact ? "px-6 py-10" : "px-6 py-16"
      }`}
    >
      <svg width="40" height="40" viewBox="0 0 48 48" fill="none" aria-hidden>
        <g
          stroke="var(--color-plum-300)"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M24 42V26" />
          <path d="M24 34c-4.5 0-8-2.7-9-7 4.5-.9 8 1.8 9 7Z" />
        </g>
        <circle
          cx="24"
          cy="17"
          r="8"
          stroke="var(--color-bloom-200)"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
      </svg>

      <h3 className="mt-4 text-base font-semibold text-plum-950">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">
        {description}
      </p>

      {action && (
        <Link href={action.href} className="btn btn-outline btn-sm mt-5">
          {action.label}
        </Link>
      )}
    </div>
  );
}
