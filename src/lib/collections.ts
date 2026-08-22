/**
 * Koleksiyonlar — başlığın üstündeki hızlı şerit (madde 9).
 *
 * Kategoriler ürünün ne olduğunu söyler ("Orkideler"); koleksiyonlar ise
 * niçin arandığını ("Premium", "Hediye", "Balon"). İkisi ayrı eksen olduğu
 * için kategori tablosuna yeni satır eklemek yerine burada tanımlıdırlar:
 * her koleksiyon bir Prisma sorgu parçasıdır.
 */

import type { Prisma } from "@prisma/client";
import { activeDiscountWhere } from "./discount";

export type Collection = {
  slug: string;
  label: string;
  tagline: string;
  /** Ek ürünler (balon, pasta, çikolata) bu koleksiyona dahil mi? */
  includeAddOns: boolean;
  where: (now: Date) => Prisma.ProductWhereInput;
};

/** Bu tutarın üstü "premium" sayılır. */
export const PREMIUM_THRESHOLD = 2000;

export const COLLECTIONS: Collection[] = [
  {
    slug: "premium",
    label: "Premium",
    tagline: "Büyük aranjmanlar ve özel gün gönderileri",
    includeAddOns: false,
    where: () => ({ price: { gte: PREMIUM_THRESHOLD } }),
  },
  {
    slug: "hediye",
    label: "Hediye",
    tagline: "Çiçeğin yanına giden her şey",
    includeAddOns: true,
    where: () => ({
      OR: [
        { isAddOn: true },
        { category: { slug: { in: ["hediye-setleri", "dogum-gunu", "yeni-bebek"] } } },
      ],
    }),
  },
  {
    slug: "balon",
    label: "Balon",
    tagline: "Buketin yanında elden teslim",
    includeAddOns: true,
    where: () => ({ addOnKind: "BALON" }),
  },
  {
    slug: "pasta",
    label: "Pasta",
    tagline: "Aynı gün için saat 14:00'e kadar",
    includeAddOns: true,
    where: () => ({ addOnKind: "PASTA" }),
  },
  {
    slug: "cikolata",
    label: "Çikolata",
    tagline: "Butik çikolata ve kutu setler",
    includeAddOns: true,
    where: () => ({ addOnKind: "CIKOLATA" }),
  },
  {
    slug: "indirim",
    label: "İndirimdekiler",
    tagline: "Süresi dolmadan",
    includeAddOns: false,
    where: (now) => activeDiscountWhere(now),
  },
];

export const findCollection = (slug?: string | null) =>
  slug ? (COLLECTIONS.find((c) => c.slug === slug) ?? null) : null;
