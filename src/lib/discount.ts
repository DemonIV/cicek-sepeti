/**
 * Zamanlı indirim (madde 24).
 *
 * İndirim bir tarih aralığında geçerlidir: operasyon indirimi önceden kurar,
 * aralık gelince fiyat kendiliğinden düşer, bitince kendiliğinden geri çıkar.
 * Geçerli fiyatı hesaplayan TEK yer burasıdır — sepet, ödeme, panel ve vitrin
 * hep bu fonksiyona sorar.
 */

import { round2 } from "./pricing";

export type Discountable = {
  price: number;
  discountPrice?: number | null;
  discountStartsAt?: Date | string | null;
  discountEndsAt?: Date | string | null;
};

export type PriceInfo = {
  /** Sepete giren, ödenen fiyat. */
  price: number;
  /** Üstü çizili liste fiyatı — indirim yoksa `price` ile aynıdır. */
  listPrice: number;
  isDiscounted: boolean;
  /** %26 gibi tam sayı indirim oranı. */
  percent: number;
  /** İndirim bittiği an — geri sayım bunu kullanır. */
  endsAt: Date | null;
  /** İndirim tanımlı ama henüz başlamadı (panelde "planlandı"). */
  scheduled: boolean;
  startsAt: Date | null;
};

const asDate = (value: Date | string | null | undefined) =>
  value ? new Date(value) : null;

export function priceInfo(product: Discountable, now = new Date()): PriceInfo {
  const list = product.price;
  const discount = product.discountPrice ?? null;
  const startsAt = asDate(product.discountStartsAt);
  const endsAt = asDate(product.discountEndsAt);

  const base: PriceInfo = {
    price: list,
    listPrice: list,
    isDiscounted: false,
    percent: 0,
    endsAt,
    scheduled: false,
    startsAt,
  };

  if (discount === null || discount <= 0 || discount >= list) return base;

  const started = !startsAt || startsAt.getTime() <= now.getTime();
  const ended = endsAt !== null && endsAt.getTime() <= now.getTime();

  if (!started) return { ...base, scheduled: true };
  if (ended) return base;

  return {
    price: round2(discount),
    listPrice: list,
    isDiscounted: true,
    percent: Math.round(((list - discount) / list) * 100),
    endsAt,
    scheduled: false,
    startsAt,
  };
}

/** Ürünün o an geçerli fiyatı — tek satırlık kısayol. */
export const effectivePrice = (product: Discountable, now = new Date()) =>
  priceInfo(product, now).price;

/**
 * "Şu an indirimde olan ürünler" sorgusu. Prisma `where` parçası olarak
 * kullanılır; aralık kontrolü veritabanında yapılır.
 */
export function activeDiscountWhere(now = new Date()) {
  return {
    discountPrice: { not: null },
    AND: [
      { OR: [{ discountStartsAt: null }, { discountStartsAt: { lte: now } }] },
      { OR: [{ discountEndsAt: null }, { discountEndsAt: { gt: now } }] },
    ],
  };
}
