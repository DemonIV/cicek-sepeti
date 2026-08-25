"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NAV_GROUPS, type NavGroup } from "@/lib/nav-tree";
import { Icon } from "@/components/ui/Icon";

/**
 * Başlığın kategori satırı — dokuz metin başlığı, hover'da tam genişlik panel.
 *
 * Düzen ciceksepeti.com'dan alındı (`CS-NAVBAR-GOZLEM.md`): ilk başlık iki
 * sütunlu mega menü (solda dallar, sağda seçili dalın altları), diğerleri
 * çok sütunlu düz liste. Fotoğraflı kategori şeridi buradan çıkıp ana sayfanın
 * en üstüne taşındı — gerçek sitede de o şerit gövdenin ilk elemanı.
 *
 * Menü hover ile açılır ama klavyeyle de gezilir: başlığa odaklanmak paneli
 * açar, Esc kapatır. Panel `position: absolute` ile başlığın altına asılır;
 * sarmalayıcı `relative` olduğu için sayfa akışını itmez.
 */
export function MainNav({
  collections,
}: {
  /** Koleksiyon şeridi masaüstünde yukarıda durur; telefonda buradaki tek
      şeride eklenir ki başlıkta üst üste iki hap satırı olmasın. */
  collections: { slug: string; label: string }[];
}) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const pathname = usePathname();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Adres değişince panel açık kalmasın. Aynı sayfada yalnızca sorgu değişen
  // bağlantılar (`?q=…`) yolu değiştirmediği için panel ayrıca tıklamada da
  // kapatılır — aşağıdaki `onClickCapture`.
  useEffect(() => {
    setOpenSlug(null);
  }, [pathname]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenSlug(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Başlıkla panel arasındaki birkaç pikselde imleç boşluğa düşünce menü
  // kapanmasın diye kapanış kısa bir gecikmeyle yapılır.
  const open = (slug: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenSlug(slug);
  };
  const close = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenSlug(null), 120);
  };

  return (
    <div className="border-t border-line bg-surface">
      {/* --------------------------- Masaüstü: menülü --------------------------- */}
      <div
        className="relative mx-auto hidden max-w-[1440px] px-4 sm:px-6 md:block"
        onMouseLeave={close}
      >
        <nav aria-label="Kategoriler">
          <ul className="flex items-stretch">
            {NAV_GROUPS.map((group, index) => {
              const isOpen = openSlug === group.slug;
              return (
                <li
                  key={group.slug}
                  className="relative"
                  onMouseEnter={() => open(group.slug)}
                >
                  <Link
                    href={group.href}
                    onFocus={() => open(group.slug)}
                    aria-expanded={isOpen}
                    className={`relative flex h-11 items-center whitespace-nowrap px-3 text-[13px] font-semibold transition-colors lg:px-3.5 ${
                      isOpen
                        ? "text-bloom-700"
                        : "text-plum-900 hover:text-bloom-700"
                    }`}
                  >
                    {index > 0 && (
                      <span
                        aria-hidden
                        className="absolute left-0 top-1/2 h-3.5 w-px -translate-y-1/2 bg-line"
                      />
                    )}
                    {group.label}
                    <span
                      aria-hidden
                      className={`absolute inset-x-3 bottom-0 h-[2px] bg-bloom-600 transition-opacity ${
                        isOpen ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {openSlug && (
          <div
            className="absolute inset-x-0 top-full z-40 border-t border-line bg-surface shadow-[var(--shadow-lift)]"
            onMouseEnter={() => open(openSlug)}
            onClickCapture={() => setOpenSlug(null)}
          >
            {NAV_GROUPS.filter((group) => group.slug === openSlug).map(
              (group) =>
                group.layout === "mega" ? (
                  <MegaPanel key={group.slug} group={group} />
                ) : (
                  <FlatPanel key={group.slug} group={group} />
                ),
            )}
          </div>
        )}
      </div>

      {/* ---------------------------- Telefon: şerit ---------------------------- */}
      {/* Dar ekranda açılır panel yerine kaydırmalı başlık şeridi; her başlık
          kendi liste sayfasına gider. */}
      <nav aria-label="Kategoriler" className="md:hidden">
        <div className="scroll-row px-4 py-2.5">
          {NAV_GROUPS.map((group) => (
            <Link
              key={group.slug}
              href={group.href}
              className="whitespace-nowrap rounded-full border border-line-strong px-3 py-1.5 text-[12.5px] font-semibold text-plum-800"
            >
              {group.label}
            </Link>
          ))}
          <span aria-hidden className="my-1 w-px shrink-0 bg-line" />
          {collections.map((collection) => (
            <Link
              key={collection.slug}
              href={`/urunler?koleksiyon=${collection.slug}`}
              className="whitespace-nowrap rounded-full bg-plum-50 px-3 py-1.5 text-[12.5px] font-semibold text-plum-700"
            >
              {collection.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

/** "Tüm ürünleri gör ›" satırı — her panelin ilk satırı. */
function AllLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-[13px] font-semibold text-bloom-700 hover:underline"
    >
      Tüm ürünleri gör
      <Icon name="arrow-right" size={13} />
    </Link>
  );
}

/**
 * Mega panel: solda dal listesi, sağda seçili dalın altları.
 * Sol listedeki ilk dal varsayılan olarak açık gelir — panel hiç boş görünmez.
 */
function MegaPanel({ group }: { group: NavGroup }) {
  const firstWithChildren = group.branches.findIndex((b) => b.children?.length);
  const [active, setActive] = useState(
    firstWithChildren === -1 ? 0 : firstWithChildren,
  );
  const branch = group.branches[active];

  return (
    <div className="mx-auto grid max-w-[1440px] grid-cols-[15rem_minmax(0,1fr)] px-4 sm:px-6">
      {/* Sol sütun — dallar */}
      <div className="border-r border-line py-5 pr-4">
        <div className="px-2 pb-3">
          <AllLink href={group.href} />
        </div>
        <ul>
          {group.branches.map((item, index) => {
            const isActive = index === active;
            const hasChildren = Boolean(item.children?.length);
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  onMouseEnter={() => hasChildren && setActive(index)}
                  onFocus={() => hasChildren && setActive(index)}
                  className={`flex items-center justify-between gap-2 rounded-[var(--radius-sm)] px-2 py-[7px] text-[13px] transition-colors ${
                    isActive
                      ? "bg-plum-50 font-semibold text-plum-950"
                      : "text-plum-700 hover:text-plum-950"
                  }`}
                >
                  {item.label}
                  {hasChildren && (
                    <Icon
                      name="chevron-down"
                      size={13}
                      className="-rotate-90 text-faint"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Sağ panel — seçili dalın altları */}
      <div className="py-5 pl-8">
        <div className="pb-3">
          <AllLink href={branch.href} />
        </div>
        {branch.children?.length ? (
          <ul className="max-w-3xl columns-2 gap-8 lg:columns-3">
            {branch.children.map((leaf) => (
              <li key={leaf.label} className="break-inside-avoid">
                <Link
                  href={leaf.href}
                  className="block py-[5px] text-[13px] text-plum-700 transition-colors hover:text-bloom-700"
                >
                  {leaf.label}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-muted">
            Bu dalın alt kırılımı yok — doğrudan listeye gider.
          </p>
        )}
      </div>
    </div>
  );
}

/** Düz panel: tek seviye liste, sütun sütun akar. */
function FlatPanel({ group }: { group: NavGroup }) {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6">
      <div className="pb-3">
        <AllLink href={group.href} />
      </div>
      <ul className="max-w-5xl columns-3 gap-8 lg:columns-5">
        {group.branches.map((item) => (
          <li key={item.label} className="break-inside-avoid">
            <Link
              href={item.href}
              className="block py-[5px] text-[13px] text-plum-700 transition-colors hover:text-bloom-700"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
