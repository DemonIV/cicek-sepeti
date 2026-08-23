"use client";

import { useRef, useState, useTransition } from "react";
import { setDeliveryPreference } from "@/app/actions/delivery";
import { describeDate, type DayOption } from "@/lib/delivery-time";
import { Icon } from "@/components/ui/Icon";

/**
 * Ürün sayfasındaki teslimat günü ve saati.
 *
 * Çiçekte asıl soru "kaç günde gelir" değil, "bugün yetişir mi". Bu yüzden gün
 * seçimi sepete eklemeden **önce**, ürünün yanında duruyor; seçim çereze yazılıp
 * ödeme adımına taşınıyor.
 *
 * Üç hazır çip (Bugün · Yarın · ertesi gün) + **Takvim**: doğum günü, yıl
 * dönümü gibi ileri tarihli siparişler takvimden seçilir. Seçilen ileri tarih
 * çiplerin arasına dördüncü olarak yerleşir.
 */
export function DeliveryDayPicker({
  days,
  slots,
  allSlots,
  promise,
  initial,
  maxDate,
}: {
  days: DayOption[];
  /** Hazır günler → o gün seçilebilir saat aralıkları. */
  slots: Record<string, { value: string; disabled: boolean }[]>;
  /** Takvimden seçilen ileri tarihte hepsi açıktır. */
  allSlots: string[];
  promise: string;
  initial: { dateIso: string; slot: string } | null;
  /** Takvimin üst sınırı. */
  maxDate: string;
}) {
  const firstOpen = days.find((day) => !day.disabled) ?? days[0];
  const initialCustom =
    initial && !days.some((day) => day.value === initial.dateIso)
      ? initial.dateIso
      : null;

  const [date, setDate] = useState(initial?.dateIso ?? firstOpen.value);
  const [slot, setSlot] = useState(initial?.slot ?? "");
  const [customDate, setCustomDate] = useState<string | null>(initialCustom);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const calendarRef = useRef<HTMLInputElement>(null);

  // Takvimden seçilen gün hazır çiplerin yanına eklenir; o gün için bütün
  // saat aralıkları açıktır (ileri tarih olduğu için kesim saati işlemez).
  const options: DayOption[] = customDate
    ? [
        ...days,
        {
          value: customDate,
          ...describeDate(customDate),
          sameDay: false,
          disabled: false,
        },
      ]
    : days;

  const daySlots =
    slots[date] ?? allSlots.map((value) => ({ value, disabled: false }));
  const sameDayOpen = days[0] && !days[0].disabled;

  const choose = (nextDate: string, nextSlot: string) => {
    setDate(nextDate);
    setSlot(nextSlot);
    setError(null);
    setSaved(null);

    if (!nextSlot) return;
    startTransition(async () => {
      const result = await setDeliveryPreference(nextDate, nextSlot);
      if (result.ok) setSaved(result.message);
      else setError(result.message);
    });
  };

  return (
    <div className="rounded-lg border border-line bg-surface p-3.5">
      <p
        className={`flex items-center gap-1.5 text-[12px] font-semibold ${
          sameDayOpen ? "text-fern-700" : "text-muted"
        }`}
      >
        <Icon name="clock" size={14} />
        {promise}
      </p>

      {/* Takvimden gün seçilince beşinci hücre eklenir; ızgara yerine esnek
          satır kullanıldı ki hücreler eşit bölünüp taşmasın. */}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {options.map((day) => {
          const active = day.value === date;
          return (
            <button
              key={day.value}
              type="button"
              disabled={day.disabled}
              onClick={() => choose(day.value, "")}
              title={
                day.disabled
                  ? "Bugün için sipariş penceresi kapandı"
                  : undefined
              }
              className={`min-w-[4.5rem] flex-1 rounded-md border px-2 py-2 text-center transition-colors ${
                active
                  ? "border-bloom-600 bg-bloom-50 text-plum-950"
                  : day.disabled
                    ? "cursor-not-allowed border-line bg-plum-50 text-faint"
                    : "border-line text-plum-800 hover:border-bloom-400"
              }`}
            >
              <span className="block text-[12.5px] font-semibold leading-tight">
                {day.label}
              </span>
              <span className="block text-[10.5px] leading-tight text-muted">
                {day.sublabel}
              </span>
            </button>
          );
        })}

        {/* Takvim: ileri tarihli siparişler (doğum günü, yıl dönümü…) */}
        <button
          type="button"
          onClick={() => {
            const input = calendarRef.current;
            if (!input) return;
            // Chrome'da takvimi doğrudan açar; desteklemeyen tarayıcıda
            // odaklanmak yeterli.
            input.focus();
            input.showPicker?.();
          }}
          className={`relative min-w-[4.5rem] flex-1 rounded-md border px-2 py-2 text-center transition-colors ${
            customDate
              ? "border-bloom-400 text-plum-950"
              : "border-line text-plum-800 hover:border-bloom-400"
          }`}
        >
          <Icon name="grid" size={14} className="mx-auto text-plum-500" />
          <span className="mt-0.5 block text-[11.5px] font-semibold leading-tight">
            Takvim
          </span>
          <input
            ref={calendarRef}
            type="date"
            min={days[days.length - 1]?.value}
            max={maxDate}
            value={customDate ?? ""}
            onChange={(event) => {
              const picked = event.target.value;
              if (!picked) return;
              setCustomDate(picked);
              choose(picked, "");
            }}
            aria-label="Takvimden teslimat tarihi seç"
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {daySlots.map((row) => (
          <button
            key={row.value}
            type="button"
            disabled={row.disabled || pending}
            onClick={() => choose(date, row.value)}
            className={`tabular rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors ${
              slot === row.value
                ? "border-bloom-600 bg-bloom-600 text-white"
                : row.disabled
                  ? "cursor-not-allowed border-line text-faint line-through"
                  : "border-line text-plum-800 hover:border-bloom-400"
            }`}
          >
            {row.value}
          </button>
        ))}
      </div>

      {(saved || error) && (
        <p
          role="status"
          className={`mt-2 text-[11.5px] font-medium ${
            error ? "text-[#9c2f2a]" : "text-fern-700"
          }`}
        >
          {error ?? `${saved} Ödeme adımında hazır gelecek.`}
        </p>
      )}
    </div>
  );
}
