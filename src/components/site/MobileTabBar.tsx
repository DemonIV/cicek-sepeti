"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";

/**
 * Telefonda ekranın altında duran sekme çubuğu.
 *
 * Mobil ticaret uygulamalarının temel gezinme kalıbı: dört hedef her zaman baş
 * parmağın altında. Yalnızca dar ekranda görünür — masaüstünde vitrin başlığı
 * bu işi zaten yapıyor.
 */
const TABS: {
  href: string;
  label: string;
  icon: IconName;
  match: (p: string) => boolean;
}[] = [
  { href: "/", label: "Ana sayfa", icon: "home", match: (p) => p === "/" },
  {
    href: "/urunler",
    label: "Kategoriler",
    icon: "grid",
    match: (p) =>
      p.startsWith("/urunler") ||
      p.startsWith("/kategori") ||
      p.startsWith("/magaza"),
  },
  {
    href: "/sepet",
    label: "Sepetim",
    icon: "cart",
    match: (p) => p.startsWith("/sepet"),
  },
  {
    href: "/hesabim",
    label: "Hesabım",
    icon: "user",
    match: (p) => p.startsWith("/hesabim"),
  },
];

export function MobileTabBar({ cartCount }: { cartCount: number }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Alt gezinme"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-4">
        {TABS.map((tab) => {
          const active = tab.match(pathname);

          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors ${
                  active ? "text-bloom-700" : "text-muted"
                }`}
              >
                <span className="relative">
                  <Icon name={tab.icon} size={21} />
                  {tab.icon === "cart" && cartCount > 0 && (
                    <span className="tabular absolute -right-2.5 -top-1.5 min-w-[1.05rem] rounded-full bg-bloom-600 px-1 py-px text-center font-mono text-[9px] font-bold leading-[1.15] text-white">
                      {cartCount}
                    </span>
                  )}
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
