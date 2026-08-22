import "server-only";

/**
 * Bayi puanı (madde 17).
 *
 * Her bayi 100 puanla başlar. Olaylar puanı düşürür ya da yükseltir; puan
 * hareketleri tek tek saklanır, böylece bayinin "neden 85'im?" sorusuna
 * cevap verilebilir. Gecikme cezası otomatiktir: teslimat tarihi geçtiği
 * hâlde yola çıkmamış her sipariş için 5 puan.
 */

import { db } from "./db";

export const SCORE_START = 100;
export const LATE_PENALTY = 5;
export const LATE_REASON = "Teslimat tarihi geçti, sipariş hâlâ hazırlıkta";

export type ScoreBand = {
  label: string;
  tone: "leaf" | "amber" | "danger";
};

/** Puanın sözle karşılığı — panelde rozet olarak görünür. */
export function scoreBand(score: number): ScoreBand {
  if (score >= 90) return { label: "Çok iyi", tone: "leaf" };
  if (score >= 75) return { label: "İzlemede", tone: "amber" };
  return { label: "Riskli", tone: "danger" };
}

/** Puan hareketi ekler ve bayinin toplam puanını yeniden hesaplar. */
export async function addScoreEvent({
  sellerId,
  delta,
  reason,
  orderNo,
}: {
  sellerId: string;
  delta: number;
  reason: string;
  orderNo?: string;
}) {
  await db.sellerScoreEvent.create({
    data: { sellerId, delta, reason, orderNo: orderNo ?? null },
  });
  await recalculateScore(sellerId);
}

export async function recalculateScore(sellerId: string) {
  const events = await db.sellerScoreEvent.findMany({
    where: { sellerId },
    select: { delta: true },
  });
  const total = events.reduce((sum, e) => sum + e.delta, SCORE_START);
  const score = Math.max(0, Math.min(100, total));

  await db.seller.update({ where: { id: sellerId }, data: { score } });
  return score;
}

/**
 * Geciken siparişleri tarar ve cezalandırılmamış olanlar için puan düşer.
 * Aynı sipariş iki kez cezalandırılmaz — sipariş numarası + sebep eşleşmesi
 * kontrol edilir, böylece tarama defalarca çalıştırılabilir.
 *
 * Döner: kaç yeni ceza yazıldığı.
 */
export async function scanLateOrders(): Promise<number> {
  const now = new Date();

  const late = await db.order.findMany({
    where: {
      status: { in: ["ONAYLANDI", "HAZIRLANIYOR"] },
      deliveryDate: { lt: now },
    },
    select: { orderNo: true, items: { select: { sellerId: true, isAddOn: true } } },
  });

  if (late.length === 0) return 0;

  const punished = await db.sellerScoreEvent.findMany({
    where: { orderNo: { in: late.map((o) => o.orderNo) }, reason: LATE_REASON },
    select: { orderNo: true, sellerId: true },
  });
  const seen = new Set(punished.map((p) => `${p.orderNo}:${p.sellerId}`));

  const touched = new Set<string>();
  let written = 0;

  for (const order of late) {
    // Ek ürün tedarikçisi gecikmeden sorumlu tutulmaz; çiçeği hazırlayan bayi
    // sorumludur.
    const sellerIds = [
      ...new Set(order.items.filter((i) => !i.isAddOn).map((i) => i.sellerId)),
    ];

    for (const sellerId of sellerIds) {
      if (seen.has(`${order.orderNo}:${sellerId}`)) continue;
      await db.sellerScoreEvent.create({
        data: {
          sellerId,
          delta: -LATE_PENALTY,
          reason: LATE_REASON,
          orderNo: order.orderNo,
        },
      });
      touched.add(sellerId);
      written++;
    }
  }

  for (const sellerId of touched) await recalculateScore(sellerId);

  return written;
}
