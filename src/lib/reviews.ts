import "server-only";

/**
 * Ürün değerlendirmeleri.
 *
 * Puan tek bir yerden türetilir: `Product.rating` / `reviewCount` alanları
 * görünen yorumlardan hesaplanıp yazılır. Böylece katalog sıralaması tek
 * tablodan çalışmaya devam eder ama rakam ile altındaki metinler çelişmez.
 */

import { db } from "./db";

/** "Zeynep Aksoy" → "Z*** A***" — vitrinde tam ad görünmez. */
export function maskName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toLocaleUpperCase("tr")}***`)
    .join(" ");
}

/** Yıldız dağılımı: 5'ten 1'e, her biri için adet ve yüzde. */
export function ratingBreakdown(ratings: number[]) {
  const total = ratings.length;
  return [5, 4, 3, 2, 1].map((star) => {
    const count = ratings.filter((value) => value === star).length;
    return {
      star,
      count,
      percent: total ? Math.round((count / total) * 100) : 0,
    };
  });
}

/** Ürün sayfasındaki yorum bloğu: özet + liste. */
export async function productReviews(productId: string, take = 8) {
  const [rows, all] = await Promise.all([
    db.review.findMany({
      where: { productId, isHidden: false },
      orderBy: [{ helpful: "desc" }, { createdAt: "desc" }],
      take,
    }),
    db.review.findMany({
      where: { productId, isHidden: false },
      select: { rating: true },
    }),
  ]);

  const total = all.length;
  const average = total
    ? all.reduce((sum, row) => sum + row.rating, 0) / total
    : 0;

  return {
    reviews: rows.map((row) => ({
      ...row,
      authorName: maskName(row.authorName),
    })),
    total,
    average,
    breakdown: ratingBreakdown(all.map((row) => row.rating)),
  };
}

/**
 * Ürünün puanını görünen yorumlardan yeniden hesaplar.
 * Yorum gizlendiğinde/gösterildiğinde çağrılır — rakam listeyle uyumlu kalsın.
 */
export async function refreshProductRating(productId: string) {
  const rows = await db.review.findMany({
    where: { productId, isHidden: false },
    select: { rating: true },
  });

  const count = rows.length;
  const average = count
    ? rows.reduce((sum, row) => sum + row.rating, 0) / count
    : 0;

  await db.product.update({
    where: { id: productId },
    data: {
      rating: Math.round(average * 100) / 100,
      reviewCount: count,
    },
  });
}
