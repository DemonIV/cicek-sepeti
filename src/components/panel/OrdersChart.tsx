"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";

export type ChartDay = {
  key: string;
  label: string;
  fullLabel: string;
  count: number;
  revenue: number;
  isToday: boolean;
};

/**
 * Son 7 günün günlük sipariş sayısı.
 *
 * Tek ölçek, tek seri. Ciro ikinci bir eksene bindirilmez — farklı
 * büyüklükteki iki ölçüyü aynı eksende karşılaştırmak yanıltıcı olurdu;
 * ciro, çubuğun üzerine gelince ipucu kutusunda görünür.
 */
export function OrdersChart({ days }: { days: ChartDay[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  const max = Math.max(1, ...days.map((day) => day.count));
  const niceMax = Math.max(2, Math.ceil(max / 2) * 2);
  const gridValues = [niceMax, niceMax / 2, 0];

  return (
    <figure className="m-0">
      <div className="flex gap-3">
        <div
          className="tabular flex h-44 w-6 flex-col justify-between text-right font-mono text-[10px] text-faint"
          aria-hidden
        >
          {gridValues.map((value) => (
            <span key={value} className="-translate-y-1.5">
              {value}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          {/* Izgara — geri planda kalır */}
          <div className="absolute inset-x-0 top-0 h-44" aria-hidden>
            {gridValues.map((value) => (
              <div
                key={value}
                className={
                  value === 0
                    ? "border-t border-line-strong"
                    : "border-t border-line"
                }
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: `${((niceMax - value) / niceMax) * 100}%`,
                }}
              />
            ))}
          </div>

          {/* Çubuklar */}
          <div className="relative flex h-44 items-end gap-[2px]">
            {days.map((day, index) => {
              const active = hovered === index;
              const heightPct = (day.count / niceMax) * 100;

              return (
                <div
                  key={day.key}
                  className="group relative flex h-full flex-1 flex-col justify-end"
                  onMouseEnter={() => setHovered(index)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(index)}
                  onBlur={() => setHovered(null)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${day.fullLabel}: ${day.count} sipariş, ${formatPrice(day.revenue)} ciro`}
                >
                  {/* Sipariş girmemiş gün de sayısını gösterir; boş bırakınca
                      grafik eksik çizilmiş gibi duruyordu. */}
                  <span
                    className={`tabular mb-1 text-center font-mono text-[10px] font-bold ${
                      day.count > 0 ? "text-plum-800" : "text-faint"
                    }`}
                  >
                    {day.count}
                  </span>
                  <div
                    className={`w-full rounded-t-[4px] transition-colors duration-150 ${
                      day.count === 0
                        ? "bg-plum-200"
                        : active
                          ? "bg-plum-800"
                          : day.isToday
                            ? "bg-bloom-600"
                            : "bg-plum-600"
                    }`}
                    style={{
                      height: `${heightPct}%`,
                      // Sıfır günde de ince bir kütük kalır: eksen boyunca
                      // ritim bozulmaz, gün gerçekten sıfır olduğu okunur.
                      minHeight: day.count > 0 ? 3 : 2,
                    }}
                  />
                </div>
              );
            })}

            {/* İpucu kutusu */}
            {hovered !== null && (
              <div
                role="status"
                className="pointer-events-none absolute -top-2 right-0 z-10 rounded-md border border-line bg-surface px-3 py-2 shadow-[0_10px_24px_-12px_rgba(18,39,30,0.35)]"
              >
                <p className="whitespace-nowrap text-[11px] font-semibold text-plum-950">
                  {days[hovered].fullLabel}
                </p>
                <p className="tabular mt-0.5 whitespace-nowrap text-[12px] text-muted">
                  <span className="font-semibold text-plum-800">
                    {days[hovered].count}
                  </span>{" "}
                  sipariş · {formatPrice(days[hovered].revenue)}
                </p>
              </div>
            )}
          </div>

          {/* X ekseni */}
          <div className="mt-2 flex gap-[2px]">
            {days.map((day, index) => (
              <div key={day.key} className="flex-1 text-center">
                <span
                  className={`text-[11px] ${
                    day.isToday
                      ? "font-bold text-bloom-700"
                      : hovered === index
                        ? "font-semibold text-plum-900"
                        : "text-muted"
                  }`}
                >
                  {day.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ekran okuyucu için tablo görünümü */}
      <table className="sr-only">
        <caption>Son 7 günde günlük sipariş sayısı ve ciro</caption>
        <thead>
          <tr>
            <th>Gün</th>
            <th>Sipariş</th>
            <th>Ciro</th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day.key}>
              <td>{day.fullLabel}</td>
              <td>{day.count}</td>
              <td>{formatPrice(day.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
