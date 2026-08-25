"use client";

import { useEffect, useState } from "react";
import { openAreaDialog } from "@/components/site/DeliveryAreaDialog";
import { Icon } from "@/components/ui/Icon";
import { formatMinutesLeft, SAME_DAY_CUTOFF_HOUR } from "@/lib/delivery-time";

/**
 * Sepette ürün varken navbar'ın altında duran iki panelli bant.
 *
 *   Sol  — sipariş nereye gidiyor: seçili adres, tek tıkla değiştirilir.
 *   Sağ  — kesim saatine kalan süre: geri sayım ve ilerleme çubuğu.
 *
 * Neden yalnızca sepet doluyken: boş sepette geri sayım baskı kurar ama bir
 * karşılığı yoktur. Ürün sepete girdiği anda "bunu bugün alabilir miyim"
 * sorusu gerçek olur — bant o zaman anlam taşır.
 *
 * Renkler token niyetine uygun seçildi (`globals.css`): sol panel **fern**,
 * yalnızca olumlu durum için; sağ panel **gold**, yalnızca kıtlık için.
 *
 * Süre sunucuda bir kez hesaplanır, burada dakikası düşülür. Kesim saati
 * geçince bant kaybolmaz — vaadin değiştiğini söyler.
 */
export function DeliveryBand({
  addressLine,
  areaChosen,
  minutesLeft,
  totalMinutes,
}: {
  /** Seçili adres / mahalle. Seçim yoksa null. */
  addressLine: string | null;
  areaChosen: boolean;
  /** Sunucudaki anlık kalan dakika. */
  minutesLeft: number;
  /** Pencerenin toplam uzunluğu — çubuğun paydası. */
  totalMinutes: number;
}) {
  const [left, setLeft] = useState(minutesLeft);

  // Sunucu anlık görüntü verir; sayfa açık kaldıkça dakika buradan düşer.
  useEffect(() => {
    setLeft(minutesLeft);
    if (minutesLeft <= 0) return;

    const startedAt = Date.now();
    const id = setInterval(() => {
      const gone = Math.floor((Date.now() - startedAt) / 60_000);
      setLeft(Math.max(0, minutesLeft - gone));
    }, 15_000);

    return () => clearInterval(id);
  }, [minutesLeft]);

  const open = left > 0;
  const ratio = Math.max(0, Math.min(1, left / totalMinutes));

  return (
    <div className="border-b border-line bg-paper/70">
      <div className="mx-auto grid max-w-[1440px] gap-2.5 px-4 py-3 sm:px-6 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] md:gap-3">
        {/* ------------------------------ Adres ------------------------------ */}
        <a
          href="/teslimat-bolgesi"
          onClick={(event) => {
            event.preventDefault();
            openAreaDialog();
          }}
          className="group flex items-center gap-2.5 rounded-[var(--radius-lg)] border border-fern-300 bg-fern-100/70 py-1.5 pl-1.5 pr-3 transition-colors hover:border-fern-500"
        >
          <span className="hidden shrink-0 rounded-[var(--radius-md)] bg-fern-500 px-2.5 py-1.5 font-mono text-[9.5px] font-bold uppercase leading-[1.25] tracking-[0.1em] text-white sm:block">
            Buradan
            <br />
            başla
          </span>

          <Icon name="pin" size={16} className="shrink-0 text-fern-500" />

          {areaChosen && addressLine ? (
            <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-fern-700">
              {addressLine}
            </span>
          ) : (
            <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-fern-700">
              Siparişin nereye gidecek? Adres seç
            </span>
          )}

          <span className="flex shrink-0 items-center gap-1 text-[12px] font-semibold text-fern-500 transition-colors group-hover:text-fern-700">
            <span className="hidden sm:inline">
              {areaChosen ? "Değiştir" : "Seç"}
            </span>
            <Icon name="arrow-right" size={13} />
          </span>
        </a>

        {/* ----------------------------- Geri sayım -------------------------- */}
        <div
          className={`flex items-center gap-2.5 rounded-[var(--radius-lg)] border px-3 py-2 ${
            open
              ? "border-gold-300 bg-gold-100/60"
              : "border-line-strong bg-surface"
          }`}
        >
          <Icon
            name="clock"
            size={16}
            className={`shrink-0 ${open ? "text-gold-700" : "text-faint"}`}
          />

          <div className="min-w-0 flex-1">
            <p
              className={`truncate text-[13px] font-semibold ${
                open ? "text-gold-700" : "text-plum-700"
              }`}
            >
              {open
                ? `Bugün teslim için son ${formatMinutesLeft(left)}`
                : "Aynı gün penceresi kapandı"}
            </p>

            {/* Kalan süre tek başına bir şey söylemiyor; çubuk pencerenin ne
                kadarının tükendiğini gösterir. Pencere kapalıyken çubuk hiç
                çizilmez — dolu bir çubuk "hâlâ vakit var" der, oysa yok. */}
            {open && (
              <span
                aria-hidden
                className="mt-1.5 block h-1 overflow-hidden rounded-full bg-gold-100"
              >
                <span
                  className="block h-full rounded-full bg-gold-500 transition-[width] duration-500"
                  style={{ width: `${Math.max(3, ratio * 100)}%` }}
                />
              </span>
            )}

            <p className="mt-1 truncate text-[11.5px] text-muted">
              {open
                ? `Siparişini ${SAME_DAY_CUTOFF_HOUR}:00'a kadar ver, bugün teslim edelim.`
                : "Şimdi verilen sipariş yarın sabah tezgâhta hazırlanır."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
