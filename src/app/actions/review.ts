"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSeller, getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { refreshProductRating } from "@/lib/reviews";
import { logAudit } from "@/lib/audit";

/**
 * Yorum eylemleri.
 *
 * Üç taraf da yoruma dokunur: müşteri "faydalı" der, satıcı cevap yazar,
 * operasyon gerekirse gizler. Gizlenen yorum vitrinden düşer ve ürünün puanı
 * yeniden hesaplanır — rakam listeyle çelişmesin.
 */

/* -------------------------------- Müşteri --------------------------------- */

export async function markReviewHelpful(reviewId: string) {
  await db.review.update({
    where: { id: reviewId },
    data: { helpful: { increment: 1 } },
  });
  revalidatePath("/urun", "layout");
}

/* --------------------------------- Satıcı --------------------------------- */

/** Satıcı yalnızca kendi ürününe gelen yoruma cevap yazar. */
export async function replyToReview(reviewId: string, reply: string) {
  const seller = await getCurrentSeller();
  if (!seller) throw new Error("Bu işlem için satıcı hesabı gerekli.");

  const review = await db.review.findUnique({ where: { id: reviewId } });
  if (!review || review.sellerId !== seller.id) {
    throw new Error("Bu yorum üzerinde yetkin yok.");
  }

  const text = reply.trim();
  await db.review.update({
    where: { id: reviewId },
    data: {
      reply: text || null,
      repliedAt: text ? new Date() : null,
    },
  });

  revalidatePath("/satici/yorumlar");
  revalidatePath("/urun", "layout");
}

/* --------------------------------- Admin ---------------------------------- */

/** Operasyon yorumu vitrinden kaldırır ya da geri alır. */
export async function setReviewHidden(reviewId: string, hidden: boolean) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("Bu işlem için admin hesabı gerekli.");
  }

  const review = await db.review.update({
    where: { id: reviewId },
    data: { isHidden: hidden },
    include: { product: { select: { name: true } } },
  });

  await refreshProductRating(review.productId);

  await logAudit({
    actor: user,
    action: hidden ? "review.hide" : "review.show",
    summary: `${review.product.name} — bir yorum ${
      hidden ? "vitrinden kaldırıldı" : "yeniden yayına alındı"
    }`,
    entity: "Review",
    entityId: reviewId,
  });

  revalidatePath("/admin/yorumlar");
  revalidatePath("/satici/yorumlar");
  revalidatePath("/urun", "layout");
}
