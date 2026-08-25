import "server-only";

/**
 * Bayi kotaları (madde 19).
 *
 * İki ayrı sınır var ve ikisi de bayi başına, admin künyesinden ayarlanır:
 *
 * - **Gün bazlı** (`dailyQuota`): bir teslimat gününde o bayiden çıkabilecek
 *   en fazla sipariş. Müşteri 14 Eylül'ü seçtiyse sayım 14 Eylül'e bakar,
 *   bugüne değil.
 * - **Sipariş bazlı** (`activeQuota`): aynı anda açık — yani onaylanmış ama
 *   henüz teslim edilmemiş — sipariş sayısı. Bayinin taşıma kapasitesi.
 *
 * Sayımın tanımı **burada** durur; satıcı panosundaki kullanım çubukları da,
 * ödeme adımındaki engel de aynı fonksiyonlardan geçer. İki yerde iki farklı
 * tanım olursa bayi panosunda "11/12" görünürken sipariş reddedilir.
 *
 * İptal edilmiş siparişler hiçbir sayıma girmez.
 */

import { db } from "./db";

/** Açık sipariş sayılan durumlar — teslim edilen ve iptal olan sayılmaz. */
const OPEN_STATUSES = ["ONAYLANDI", "HAZIRLANIYOR", "YOLDA"] as const;

/** Verilen günün 00:00–23:59 aralığı. */
function dayRange(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { gte: start, lte: end };
}

/** O bayinin verilen teslimat gününe düşen sipariş sayısı. */
export function countDayDeliveries(sellerId: string, date: Date) {
  return db.order.count({
    where: {
      items: { some: { sellerId } },
      status: { not: "IPTAL" },
      deliveryDate: dayRange(date),
    },
  });
}

/** O bayinin şu anda açık (teslim edilmemiş) sipariş sayısı. */
export function countActiveOrders(sellerId: string) {
  return db.order.count({
    where: {
      items: { some: { sellerId } },
      status: { in: [...OPEN_STATUSES] },
    },
  });
}

export type QuotaUsage = {
  /** Gün bazlı: kullanım / sınır. Sınır yoksa `limit` null (sınırsız). */
  daily: { used: number; limit: number | null; full: boolean };
  /** Sipariş bazlı: aynı anda açık sipariş. */
  active: { used: number; limit: number | null; full: boolean };
};

/**
 * Bayinin kota kullanımı. Satıcı panosu bunu çubuk olarak çizer, ödeme adımı
 * `full` bayrağına bakar.
 */
export async function sellerQuotaUsage(
  seller: { id: string; dailyQuota: number | null; activeQuota: number | null },
  date: Date = new Date(),
): Promise<QuotaUsage> {
  const [dayUsed, activeUsed] = await Promise.all([
    countDayDeliveries(seller.id, date),
    countActiveOrders(seller.id),
  ]);

  return {
    daily: {
      used: dayUsed,
      limit: seller.dailyQuota,
      full: seller.dailyQuota !== null && dayUsed >= seller.dailyQuota,
    },
    active: {
      used: activeUsed,
      limit: seller.activeQuota,
      full: seller.activeQuota !== null && activeUsed >= seller.activeQuota,
    },
  };
}

export type QuotaBlock = {
  sellerId: string;
  storeName: string;
  /** Hangi sınır doldu — çözüm önerisi buna göre değişir. */
  kind: "daily" | "active";
  /** Müşteriye gösterilecek sebep ve ne yapması gerektiği. */
  reason: string;
};

/**
 * Sepetteki mağazalardan hangileri seçilen teslimat gününe sipariş alamaz?
 * Boş dizi dönerse önü açık. Ödeme adımı bunu mahalle kontrolüyle aynı
 * biçimde kullanır: engelli mağaza adıyla söylenir.
 */
export async function findQuotaBlocks(
  sellerIds: string[],
  deliveryDate: Date,
): Promise<QuotaBlock[]> {
  if (sellerIds.length === 0) return [];

  const sellers = await db.seller.findMany({
    where: { id: { in: [...new Set(sellerIds)] } },
    select: { id: true, storeName: true, dailyQuota: true, activeQuota: true },
  });

  const blocks: QuotaBlock[] = [];

  for (const seller of sellers) {
    // Kotası tanımlanmamış bayi sınırsızdır; sorgu bile açılmasın.
    if (seller.dailyQuota === null && seller.activeQuota === null) continue;

    const usage = await sellerQuotaUsage(seller, deliveryDate);

    // Gün bazlı sınır başka bir günle çözülür, sipariş bazlı sınır çözülmez —
    // tavsiye de bu yüzden ayrı.
    if (usage.daily.full) {
      blocks.push({
        sellerId: seller.id,
        storeName: seller.storeName,
        kind: "daily",
        reason: `${seller.storeName} seçtiğin gün için teslimat kotasını doldurdu (${usage.daily.used}/${usage.daily.limit}). Başka bir teslimat günü seçebilirsin.`,
      });
      continue;
    }

    if (usage.active.full) {
      blocks.push({
        sellerId: seller.id,
        storeName: seller.storeName,
        kind: "active",
        reason: `${seller.storeName} şu anda taşıyabileceği en fazla siparişe ulaştı (${usage.active.used}/${usage.active.limit}). Mağaza elindeki teslimatları tamamlayınca yeniden sipariş alabilirsin.`,
      });
    }
  }

  return blocks;
}
