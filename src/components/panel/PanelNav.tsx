"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";

export type PanelNavItem = {
  href: string;
  label: string;
  icon: IconName;
  /** Rozet: bekleyen iş sayısı */
  count?: number;
};

function isActive(pathname: string, href: string, root: string) {
  if (href === root) return pathname === root;
  return pathname === href || pathname.startsWith(href + "/");
}

export function PanelSidebarNav({
  items,
  root,
}: {
  items: PanelNavItem[];
  root: string;
}) {
  const pathname = usePathname();

  return (
    <nav className="hidden flex-col gap-0.5 lg:flex">
      {items.map((item) => {
        const active = isActive(pathname, item.href, root);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
              active
                ? "bg-white/10 text-white"
                : "text-plum-200/75 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon name={item.icon} size={17} />
            <span className="flex-1 truncate">{item.label}</span>
            {item.count ? (
              <span className="rounded-sm bg-bloom-600 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                {item.count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function PanelTabNav({
  items,
  root,
}: {
  items: PanelNavItem[];
  root: string;
}) {
  const pathname = usePathname();

  return (
    // Sağ kenardaki solma, şeridin kaydığını gösterir: telefonda son sekmeler
    // ekran dışında kalıyor ama kesildiği belli olmuyordu.
    <div className="relative lg:hidden">
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-px right-0 top-0 z-10 w-10 bg-gradient-to-l from-surface via-surface/80 to-transparent"
      />
      <nav className="scroll-row border-b border-line bg-surface px-4 py-2">
        {items.map((item) => {
          const active = isActive(pathname, item.href, root);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                active
                  ? "bg-plum-900 text-white"
                  : "bg-plum-50 text-plum-700 hover:bg-plum-100"
              }`}
            >
              <Icon name={item.icon} size={15} />
              {item.label}
              {item.count ? (
                <span className="font-mono text-[10px] font-bold text-bloom-500">
                  {item.count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
