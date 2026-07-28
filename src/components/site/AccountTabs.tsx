"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/hesabim", label: "Siparişlerim" },
  { href: "/hesabim/adresler", label: "Adreslerim" },
];

export function AccountTabs() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 flex gap-1 border-b border-line">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px border-b-2 px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
              active
                ? "border-bloom-600 text-plum-950"
                : "border-transparent text-muted hover:border-line-strong hover:text-plum-900"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
