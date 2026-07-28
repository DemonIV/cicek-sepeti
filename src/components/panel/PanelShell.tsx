import Link from "next/link";
import { PanelSidebarNav, PanelTabNav, type PanelNavItem } from "./PanelNav";

/**
 * Satıcı, kurye ve admin panelleri aynı kabuğu paylaşır: koyu yan menü,
 * açık içerik alanı, yoğun ama nefes alan bir düzen.
 */
export function PanelShell({
  root,
  brand,
  subtitle,
  items,
  children,
}: {
  root: string;
  brand: string;
  subtitle: string;
  items: PanelNavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col lg:flex-row">
      <aside className="sticky top-12 z-30 hidden w-60 flex-none flex-col justify-between self-start bg-plum-950 lg:flex lg:h-[calc(100vh-3rem)]">
        <div className="p-4">
          <Link href="/" className="block px-3 pb-5 pt-2">
            <span className="font-display text-lg font-semibold text-white">
              Çiçek<span className="text-bloom-400">Sepeti</span>
            </span>
            <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.14em] text-plum-300/70">
              {subtitle}
            </span>
          </Link>

          <p className="mb-2 px-3 text-[11px] font-semibold leading-snug text-plum-100">
            {brand}
          </p>

          <PanelSidebarNav items={items} root={root} />
        </div>

        <div className="border-t border-white/10 p-4">
          <Link
            href="/"
            className="flex items-center justify-between rounded-md px-3 py-2 text-[12px] text-plum-200/70 transition-colors hover:bg-white/5 hover:text-white"
          >
            Vitrine dön
            <span aria-hidden>↗</span>
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-line bg-surface px-4 py-3 lg:hidden">
          <p className="font-display text-base font-semibold text-plum-950">
            {brand}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            {subtitle}
          </p>
        </div>
        <PanelTabNav items={items} root={root} />

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export function PanelHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[1.7rem] leading-tight">{title}</h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </header>
  );
}
