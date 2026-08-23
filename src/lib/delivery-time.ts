/**
 * Teslimat günü ve saati — aynı gün teslimat kuralı tek yerde.
 *
 * Çiçek sektöründe asıl vaat "yarın kargoda" değil, **bugün elinde**. Bunun bir
 * kesim saati vardır: bu saatten sonra verilen sipariş ertesi güne kayar.
 * Ürün sayfası, sepet, ödeme adımı ve satıcı paneli aynı hesabı buradan alır.
 */

import { DELIVERY_SLOTS } from "./enums";

/**
 * Ürün sayfasında seçilen gün/saat çerezi. Sunucu eylemleri dosyasında
 * duramaz ("use server" yalnızca async fonksiyon export edebilir).
 */
export const DELIVERY_PREF_COOKIE = "cicek_demo_teslimat";

/** Aynı gün teslimat için son sipariş saati (Europe/Istanbul). */
export const SAME_DAY_CUTOFF_HOUR = 18;

/** Ürün sayfasında kaç günlük hazır çip gösterilir; gerisi takvimden. */
const DAY_OPTION_COUNT = 3;

/** Takvimden en fazla kaç gün ileriye sipariş verilebilir. */
export const MAX_ADVANCE_DAYS = 60;

const TZ = "Europe/Istanbul";

/** "2026-08-23" — yerel (İstanbul) takvim günü. */
export function isoDate(value: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

/** İstanbul saatiyle o anki saat (0-23). */
export function istanbulHour(now: Date): number {
  return Number(
    new Intl.DateTimeFormat("tr-TR", {
      timeZone: TZ,
      hour: "2-digit",
      hour12: false,
    }).format(now),
  );
}

/** Bugün için sipariş penceresi hâlâ açık mı? */
export function sameDayAvailable(now: Date): boolean {
  return istanbulHour(now) < SAME_DAY_CUTOFF_HOUR;
}

/** Kesim saatine kalan süre — "4 sa 12 dk". Pencere kapalıysa null. */
export function timeUntilCutoff(now: Date): string | null {
  if (!sameDayAvailable(now)) return null;

  const parts = new Intl.DateTimeFormat("tr-TR", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(now)
    .split(":")
    .map(Number);

  const minutesLeft = SAME_DAY_CUTOFF_HOUR * 60 - (parts[0] * 60 + parts[1]);
  const hours = Math.floor(minutesLeft / 60);
  const minutes = minutesLeft % 60;

  return hours > 0 ? `${hours} sa ${minutes} dk` : `${minutes} dk`;
}

export type DayOption = {
  /** "2026-08-23" */
  value: string;
  /** "Bugün" · "Yarın" · "Salı" */
  label: string;
  /** "23 Ağustos" */
  sublabel: string;
  sameDay: boolean;
  /** Kesim saati geçtiyse bugün seçilemez. */
  disabled: boolean;
};

const dayName = (date: Date) =>
  new Intl.DateTimeFormat("tr-TR", { timeZone: TZ, weekday: "long" }).format(date);

const dayAndMonth = (date: Date) =>
  new Intl.DateTimeFormat("tr-TR", {
    timeZone: TZ,
    day: "numeric",
    month: "long",
  }).format(date);

/** Ürün sayfasındaki gün çipleri: Bugün · Yarın · sonraki iki gün. */
export function deliveryDayOptions(now: Date): DayOption[] {
  const options: DayOption[] = [];

  for (let offset = 0; offset < DAY_OPTION_COUNT; offset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + offset);

    options.push({
      value: isoDate(date),
      label: offset === 0 ? "Bugün" : offset === 1 ? "Yarın" : dayName(date),
      sublabel: dayAndMonth(date),
      sameDay: offset === 0,
      disabled: offset === 0 && !sameDayAvailable(now),
    });
  }

  return options;
}

/**
 * O gün için seçilebilir saat aralıkları.
 * Bugün için geçmiş aralıklar kapanır: 15.00'te "09:00 - 12:00" seçilemez.
 */
export function slotsForDate(dateIso: string, now: Date) {
  const isToday = dateIso === isoDate(now);
  const hour = istanbulHour(now);

  return DELIVERY_SLOTS.map((slot) => {
    const endHour = Number(slot.split(" - ")[1].split(":")[0]);
    // Hazırlık için en az bir saat bırakılır.
    return { value: slot, disabled: isToday && endHour <= hour + 1 };
  });
}

/** Seçilen gün + saat gerçekten sipariş verilebilir mi? Ödeme adımı da sorar. */
export function isDeliverySlotAvailable(
  dateIso: string,
  slot: string,
  now: Date,
): boolean {
  if (dateIso < isoDate(now)) return false;
  if (dateIso > maxDeliveryDate(now)) return false;
  const match = slotsForDate(dateIso, now).find((row) => row.value === slot);
  return Boolean(match && !match.disabled);
}

/** Takvimin üst sınırı — "2026-10-22". */
export function maxDeliveryDate(now: Date): string {
  const date = new Date(now);
  date.setDate(date.getDate() + MAX_ADVANCE_DAYS);
  return isoDate(date);
}

/** Takvimden seçilen gün için çip etiketi: "Cumartesi · 12 Eylül". */
export function describeDate(dateIso: string): { label: string; sublabel: string } {
  // Gün ortası: yaz saati kaymalarında tarihin kaymaması için.
  const date = new Date(`${dateIso}T12:00:00`);
  return { label: dayName(date), sublabel: dayAndMonth(date) };
}

/** Vitrindeki "Bugün teslim" vaadi — kesim saatine göre metin. */
export function sameDayPromise(now: Date): string {
  const left = timeUntilCutoff(now);
  return left
    ? `Bugün teslim için son ${left}`
    : `Aynı gün teslimat penceresi kapandı — en erken yarın`;
}
