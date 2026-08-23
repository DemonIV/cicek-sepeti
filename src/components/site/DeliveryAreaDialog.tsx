"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  chooseDeliveryArea,
  dismissAreaPrompt,
  searchDeliveryPoints,
} from "@/app/actions/area";
import type { AreaSearchHit, SavedAddressOption } from "@/lib/delivery-area";
import { LANDMARK_KIND_LABEL, type LandmarkKind } from "@/lib/enums";
import { Icon } from "@/components/ui/Icon";

/** Başlıktaki bölge düğmesi bu olayla modalı açar. */
export const OPEN_AREA_DIALOG = "cicek:adres-sec";

export function openAreaDialog() {
  window.dispatchEvent(new Event(OPEN_AREA_DIALOG));
}

/**
 * "Siparişin nereye gönderilecek?" — vitrine girişte sorulan adres seçimi.
 *
 * Çiçek kargoyla gitmediği için katalog bölgeye göre değişir: müşteri önce
 * nereye göndereceğini söyler, sonra oraya gönderilebilen ürünleri görür.
 * Mahalle adını bilmeyenler için arama okul, hastane, plaza gibi noktaları da
 * tarar (`Landmark`); hangisi seçilirse seçilsin sonuç bir mahalledir.
 *
 * Pencere iki durumda açılır:
 *   1. Vitrine ilk girişte (bir kez sorulur, "şimdilik geç" ile susturulur).
 *   2. **Ürün listeleyen her sayfada** (kategori, katalog, mağaza, ürün) bölge
 *      hâlâ seçili değilse. Müşteri kategoriye bastığında "hangi ürünler sana
 *      gönderilebilir" sorusunun cevabı adrese bağlı — o yüzden orada
 *      susturulmaz, her girişte sorulur.
 *
 * Demo kararı: seçim yine de **zorunlu değil**. "Şimdilik geç" pencereyi
 * kapatır ve katalog daralmaz — sunumu açan kişi kapalı bir kapıyla
 * karşılaşmasın.
 */

/** Ürün listeleyen yollar: burada bölge sorusu her girişte sorulur. */
const CATALOG_PATHS = ["/urunler", "/kategori", "/magaza", "/urun"];

export function DeliveryAreaDialog({
  initialOpen,
  savedAddresses,
  selectedId,
}: {
  initialOpen: boolean;
  savedAddresses: SavedAddressOption[];
  selectedId: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Katalog yollarında bölge yoksa pencere her girişte açılır.
  const catalogPath = CATALOG_PATHS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const [open, setOpen] = useState(initialOpen || (catalogPath && !selectedId));
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<AreaSearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [addressId, setAddressId] = useState<string | null>(
    savedAddresses.find((a) => a.neighborhoodId === selectedId)?.id ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const openHandler = () => setOpen(true);
    window.addEventListener(OPEN_AREA_DIALOG, openHandler);
    return () => window.removeEventListener(OPEN_AREA_DIALOG, openHandler);
  }, []);

  // Kategoriden kategoriye geçerken de sorulur; bölge seçilince susar.
  useEffect(() => {
    if (catalogPath && !selectedId) setOpen(true);
  }, [pathname, catalogPath, selectedId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Arama: her tuşta değil, kısa bir duraklamadan sonra.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        setHits(await searchDeliveryPoints(q));
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const close = useCallback(() => {
    setOpen(false);
    startTransition(() => dismissAreaPrompt());
  }, []);

  const apply = (neighborhoodId: string) => {
    setError(null);
    startTransition(async () => {
      const result = await chooseDeliveryArea(neighborhoodId);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setOpen(false);
      setQuery("");
      setHits([]);
      router.refresh();
    });
  };

  if (!open) return null;

  const chosenAddress = savedAddresses.find((a) => a.id === addressId);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="adres-modal-baslik"
      className="fixed inset-0 z-[60] flex items-end justify-center bg-plum-950/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
    >
      {/* Dışarı tıklayınca kapanır */}
      <button
        type="button"
        aria-label="Kapat"
        onClick={close}
        className="absolute inset-0 cursor-default"
      />

      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-[0_32px_64px_-24px_rgba(11,26,19,0.5)] sm:rounded-2xl">
        <header className="flex items-start justify-between gap-4 px-5 pb-3 pt-5 sm:px-6">
          <h2
            id="adres-modal-baslik"
            className="font-display text-[1.3rem] leading-tight text-plum-950"
          >
            Siparişin nereye gönderilecek?
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Kapat"
            className="-mr-1 -mt-1 rounded-md p-1.5 text-faint transition-colors hover:bg-plum-50 hover:text-plum-800"
          >
            <Icon name="close" size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 pb-5 sm:px-6">
          <p className="flex items-start gap-2.5 rounded-lg bg-plum-50 px-3.5 py-3 text-[12.5px] leading-relaxed text-plum-800">
            <Icon name="alert" size={16} className="mt-px flex-none text-plum-500" />
            Sana gönderilebilecek ürünleri gösterebilmek için adres seçmen
            gerekiyor. Çiçek kargoyla değil, alıcıya en yakın çiçekçiden gider.
          </p>

          <p className="mt-4 text-[12.5px] leading-relaxed text-muted">
            Gönderim adresine en yakın <strong>mahalle, okul, hastane, plaza</strong>{" "}
            gibi noktaları aratabilirsin.
          </p>

          {/* ------------------------------ Arama ------------------------------ */}
          <div className="relative mt-2.5">
            <span className="pointer-events-none absolute left-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-bloom-600 text-white">
              <Icon name="pin" size={16} />
            </span>
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Mahalle, okul, hastane vb."
              aria-label="Mahalle, okul, hastane ara"
              className="field h-12 rounded-full pl-12 pr-4 text-[13.5px]"
            />
          </div>

          {query.trim().length >= 2 && (
            <div className="mt-2 overflow-hidden rounded-lg border border-line">
              {searching && hits.length === 0 ? (
                <p className="px-4 py-3.5 text-[12.5px] text-muted">Aranıyor…</p>
              ) : hits.length === 0 ? (
                <p className="px-4 py-3.5 text-[12.5px] text-muted">
                  Eşleşen nokta yok. Mahalle adını ya da yakınındaki bir okulu,
                  hastaneyi yazmayı dene.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {hits.map((hit) => {
                    const closed = hit.sellerCount === 0;
                    return (
                      <li key={`${hit.neighborhoodId}-${hit.title}`}>
                        <button
                          type="button"
                          disabled={closed || pending}
                          onClick={() => apply(hit.neighborhoodId)}
                          className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors ${
                            closed
                              ? "cursor-not-allowed opacity-55"
                              : "hover:bg-plum-50"
                          }`}
                        >
                          <Icon
                            name="pin"
                            size={15}
                            className="flex-none text-bloom-600"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-semibold text-plum-950">
                              {hit.title}
                            </span>
                            <span className="block truncate text-[11.5px] text-muted">
                              {hit.subtitle}
                            </span>
                          </span>
                          {hit.kind && (
                            <span className="badge tone-neutral flex-none">
                              {LANDMARK_KIND_LABEL[hit.kind as LandmarkKind] ??
                                hit.kind}
                            </span>
                          )}
                          {closed && (
                            <span className="flex-none text-[11px] text-faint">
                              kapalı
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {/* -------------------------- Kayıtlı adresler ------------------------ */}
          {savedAddresses.length > 0 && (
            <section className="mt-6">
              <h3 className="text-[13.5px] font-semibold text-plum-950">
                Kayıtlı adreslerin
              </h3>
              <ul className="mt-2.5 space-y-2">
                {savedAddresses.map((address) => {
                  const usable = Boolean(address.neighborhoodId) && address.sellerCount > 0;
                  const active = addressId === address.id;
                  return (
                    <li key={address.id}>
                      <label
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-3 transition-colors ${
                          active
                            ? "border-bloom-500 bg-bloom-50"
                            : "border-line hover:border-plum-300"
                        } ${usable ? "" : "cursor-not-allowed opacity-60"}`}
                      >
                        <input
                          type="radio"
                          name="kayitli-adres"
                          checked={active}
                          disabled={!usable}
                          onChange={() => setAddressId(address.id)}
                          className="mt-0.5 accent-[var(--color-bloom-600)]"
                        />
                        <span className="min-w-0">
                          <span className="block text-[13px] font-semibold text-plum-950">
                            {address.title}
                            <span className="ml-2 font-normal text-muted">
                              {address.district} / {address.city}
                            </span>
                          </span>
                          <span className="mt-0.5 block truncate text-[12px] text-muted">
                            {address.fullAddress}
                          </span>
                          {!usable && (
                            <span className="mt-0.5 block text-[11.5px] text-[#9c2f2a]">
                              Bu adrese hizmet veren çiçekçi henüz yok.
                            </span>
                          )}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {error && (
            <p className="mt-4 rounded-md bg-[#fbe0dd] px-3 py-2 text-[12.5px] font-medium text-[#9c2f2a]">
              {error}
            </p>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-plum-50/60 px-5 py-3.5 sm:px-6">
          <Link
            href="/teslimat-bolgesi"
            onClick={() => setOpen(false)}
            className="text-[12.5px] font-semibold text-plum-700 underline underline-offset-2 hover:text-plum-900"
          >
            Tüm mahalleleri gör
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={close}
              className="btn btn-ghost btn-sm"
            >
              Şimdilik geç
            </button>
            <button
              type="button"
              disabled={
                pending ||
                !chosenAddress?.neighborhoodId ||
                chosenAddress.sellerCount === 0
              }
              onClick={() =>
                chosenAddress?.neighborhoodId &&
                apply(chosenAddress.neighborhoodId)
              }
              className="btn btn-primary btn-sm"
            >
              {pending ? "Seçiliyor…" : "Bu adrese gönder"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
