import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line bg-plum-950 text-plum-100">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <p className="font-display text-xl font-semibold text-white">
            Çiçek<span className="text-bloom-400">Sepeti</span>
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-plum-200/70">
            Türkiye'nin dört bir yanındaki çiçekçileri tek çatı altında toplayan
            pazaryeri. Sipariş komşundaki çiçekçiye düşer, çiçek taze gider.
          </p>
        </div>

        <FooterColumn
          title="Alışveriş"
          links={[
            { href: "/urunler", label: "Tüm ürünler" },
            { href: "/kategori/buketler", label: "Buketler" },
            { href: "/kategori/orkideler", label: "Orkideler" },
            { href: "/kategori/kutuda-cicek", label: "Kutuda çiçek" },
          ]}
        />
        <FooterColumn
          title="Hesap"
          links={[
            { href: "/hesabim", label: "Siparişlerim" },
            { href: "/hesabim/adresler", label: "Adreslerim" },
            { href: "/sepet", label: "Sepetim" },
          ]}
        />
        <FooterColumn
          title="Platform"
          links={[
            { href: "/satici-ol", label: "Satıcı ol" },
            { href: "/satici", label: "Satıcı paneli" },
            { href: "/kurye", label: "Kurye paneli" },
            { href: "/admin", label: "Admin paneli" },
            { href: "/mobil-onizleme", label: "Mobil önizleme" },
          ]}
        />
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2 px-4 py-4 text-[11px] text-plum-300/60 sm:px-6">
          <p>© {new Date().getFullYear()} ÇiçekSepeti — sunum demosu.</p>
          <p className="font-mono uppercase tracking-[0.12em]">
            Ödeme, kargo ve bildirim entegrasyonları simüle edilmiştir
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-plum-300/70">
        {title}
      </p>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-plum-100/85 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
