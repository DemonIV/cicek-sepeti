/**
 * Biçimlendirme yardımcıları.
 *
 * Saat dilimi bilinçli olarak sabitlendi: sunucu ve tarayıcı aynı metni
 * üretmezse React hydration uyarısı verir.
 */

const TZ = "Europe/Istanbul";

const money = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const moneyShort = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 0,
});

const dateLong = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: TZ,
});

const dateShort = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: TZ,
});

const dateTime = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TZ,
});

const timeOnly = new Intl.DateTimeFormat("tr-TR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TZ,
});

const weekday = new Intl.DateTimeFormat("tr-TR", {
  weekday: "long",
  timeZone: TZ,
});

export const formatPrice = (value: number) => money.format(value);
export const formatPriceShort = (value: number) => moneyShort.format(value);
export const formatDate = (value: Date | string) => dateLong.format(new Date(value));
export const formatDateShort = (value: Date | string) =>
  dateShort.format(new Date(value));
export const formatDateTime = (value: Date | string) =>
  dateTime.format(new Date(value));
export const formatTime = (value: Date | string) => timeOnly.format(new Date(value));
export const formatWeekday = (value: Date | string) =>
  weekday.format(new Date(value));

export const formatPercent = (ratio: number) =>
  `%${(ratio * 100).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}`;

/** "3 gün önce" — takip sayfası ve panel listeleri için. */
export function relativeTime(value: Date | string): string {
  const then = new Date(value).getTime();
  const diffMinutes = Math.round((then - Date.now()) / 60000);
  const abs = Math.abs(diffMinutes);

  const rtf = new Intl.RelativeTimeFormat("tr-TR", { numeric: "auto" });
  if (abs < 60) return rtf.format(diffMinutes, "minute");
  if (abs < 60 * 24) return rtf.format(Math.round(diffMinutes / 60), "hour");
  return rtf.format(Math.round(diffMinutes / (60 * 24)), "day");
}

/** "Zeynep Aksoy" → "ZA" */
export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("tr-TR") ?? "")
    .join("");
}

export function slugify(input: string): string {
  const map: Record<string, string> = {
    ç: "c", ğ: "g", ı: "i", İ: "i", ö: "o", ş: "s", ü: "u",
    Ç: "c", Ğ: "g", Ö: "o", Ş: "s", Ü: "u",
  };
  return input
    .replace(/[çğıİöşüÇĞÖŞÜ]/g, (ch) => map[ch] ?? ch)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
