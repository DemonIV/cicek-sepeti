import "server-only";

/**
 * Sipariş yaşam döngüsü.
 *
 * Satıcı, kurye, admin ve müşteri ekranlarının hepsi durum değiştirmek için
 * bu dosyadaki fonksiyonları çağırır. Durum geçiş kuralları
 * `order-status.ts`'ten, para hesabı `pricing.ts`'ten gelir; burada yalnızca
 * bunların veritabanına nasıl yazıldığı tanımlıdır.
 */

import { db } from "./db";
import type { Role } from "./enums";
import {
  ACTION_LABEL,
  canRoleSet,
  deriveOrderStatus,
  pathTo,
  type OrderStatus,
} from "./order-status";
import { cartTotals, round2 } from "./pricing";
import type { CartItemDetail } from "./cart";

const EVENT_LABEL: Record<OrderStatus, string> = {
  BEKLEMEDE: "Sipariş oluşturuldu",
  ONAYLANDI: "Ödeme onaylandı",
  HAZIRLANIYOR: "Çiçekçi hazırlamaya başladı",
  YOLDA: "Kurye teslimat için yola çıktı",
  TESLIM_EDILDI: "Sipariş teslim edildi",
  IPTAL: "Sipariş iptal edildi",
};

/* ------------------------------ Sipariş açma ------------------------------ */

export type CheckoutInput = {
  customerId: string;
  recipientName: string;
  recipientPhone: string;
  deliveryCity: string;
  deliveryDistrict: string | null;
  neighborhoodId: string | null;
  deliveryAddress: string;
  giftNote: string | null;
  /** Kart notunun altına yazılan gönderici adı; istenmezse null (madde 13). */
  senderName: string | null;
  deliveryDate: Date;
  deliverySlot: string;
};

async function nextOrderNo(): Promise<string> {
  const year = new Date().getFullYear();
  let counter = (await db.order.count()) + 1;

  for (;;) {
    const candidate = `CS-${year}-${String(counter).padStart(4, "0")}`;
    const exists = await db.order.findUnique({ where: { orderNo: candidate } });
    if (!exists) return candidate;
    counter++;
  }
}

/**
 * Sepetten sipariş oluşturur. Sipariş BEKLEMEDE ve ödeme BEKLIYOR durumunda
 * açılır; stok, ödeme onaylanınca düşülür.
 */
export async function createOrderFromCart(
  input: CheckoutInput,
  items: CartItemDetail[],
) {
  if (items.length === 0) throw new Error("Sepet boş");

  const totals = cartTotals(items);
  const orderNo = await nextOrderNo();

  const order = await db.order.create({
    data: {
      orderNo,
      customerId: input.customerId,
      status: "BEKLEMEDE",
      subtotal: totals.subtotal,
      shippingFee: totals.shipping,
      total: totals.total,
      recipientName: input.recipientName,
      recipientPhone: input.recipientPhone,
      deliveryCity: input.deliveryCity,
      deliveryDistrict: input.deliveryDistrict,
      neighborhoodId: input.neighborhoodId,
      deliveryAddress: input.deliveryAddress,
      giftNote: input.giftNote,
      senderName: input.senderName,
      deliveryDate: input.deliveryDate,
      deliverySlot: input.deliverySlot,
      paymentStatus: "BEKLIYOR",
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          sellerId: item.sellerId,
          productName: item.name,
          productImage: item.imageUrl,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          // Komisyon oranı sipariş anında dondurulur: oran sonradan
          // değiştirilirse geçmiş kazanç raporları bozulmaz.
          commissionRate: item.commissionRate,
          status: "BEKLEMEDE",
          isAddOn: item.isAddOn,
        })),
      },
      delivery: { create: { status: "ATANMADI" } },
      events: {
        create: {
          status: "BEKLEMEDE",
          label: EVENT_LABEL.BEKLEMEDE,
          actor: "Müşteri",
        },
      },
    },
  });

  return order;
}

/* ---------------------------------- Ödeme --------------------------------- */

/** Sahte ödeme sonucu. Başarılıysa sipariş ONAYLANDI'ya geçer ve stok düşer. */
export async function settlePayment(orderNo: string, success: boolean) {
  const order = await db.order.findUnique({
    where: { orderNo },
    include: { items: true },
  });
  if (!order) throw new Error("Sipariş bulunamadı");
  if (order.paymentStatus === "ODENDI") return order;

  if (!success) {
    return db.order.update({
      where: { id: order.id },
      data: { paymentStatus: "BASARISIZ" },
    });
  }

  for (const item of order.items) {
    await db.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    });
  }

  await db.order.update({
    where: { id: order.id },
    data: { paymentStatus: "ODENDI" },
  });

  await applyStatus(order.id, "ONAYLANDI", "Ödeme sistemi");

  return db.order.findUnique({ where: { id: order.id } });
}

/* ----------------------------- Durum değişimi ----------------------------- */

/**
 * Siparişin tamamını hedef duruma taşır. Ara adımlar atlanmaz: HAZIRLANIYOR
 * durumundaki bir sipariş doğrudan "teslim edildi" işaretlenirse YOLDA adımı
 * da geçmişe yazılır.
 */
async function applyStatus(orderId: string, target: OrderStatus, actor: string) {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Sipariş bulunamadı");

  const steps = pathTo(order.status as OrderStatus, target);
  if (!steps || steps.length === 0) return;

  for (const step of steps) {
    await db.orderEvent.create({
      data: { orderId, status: step, label: EVENT_LABEL[step], actor },
    });
  }

  await db.order.update({ where: { id: orderId }, data: { status: target } });
  await db.orderItem.updateMany({
    where: { orderId, status: { not: "IPTAL" } },
    data: { status: target },
  });

  await syncDelivery(orderId, target);
}

async function syncDelivery(orderId: string, status: OrderStatus) {
  const delivery = await db.delivery.findUnique({ where: { orderId } });
  if (!delivery) return;

  if (status === "YOLDA") {
    await db.delivery.update({
      where: { orderId },
      data: { status: "YOLDA", pickedUpAt: delivery.pickedUpAt ?? new Date() },
    });
  } else if (status === "TESLIM_EDILDI") {
    await db.delivery.update({
      where: { orderId },
      data: {
        status: "TESLIM_EDILDI",
        pickedUpAt: delivery.pickedUpAt ?? new Date(),
        deliveredAt: new Date(),
      },
    });
  }
}

/** Rol yetkisi kontrol edilerek sipariş durumu değiştirir. */
export async function changeOrderStatus({
  orderId,
  target,
  role,
  actor,
}: {
  orderId: string;
  target: OrderStatus;
  role: Role;
  actor: string;
}) {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Sipariş bulunamadı");

  if (!canRoleSet(role, order.status as OrderStatus, target)) {
    throw new Error(
      `Bu işlem yapılamaz: ${order.status} → ${target} (${ACTION_LABEL[target]})`,
    );
  }

  await applyStatus(orderId, target, actor);
}

/* --------------------------- Çok satıcılı akış ---------------------------- */

/**
 * Satıcı yalnızca kendi kalemlerini ilerletir. Siparişin genel durumu, tüm
 * kalemlerin durumundan yeniden hesaplanır: en geride kalan kalem belirler.
 * İki satıcılı bir siparişte biri hazırlığı bitirse de sipariş, diğeri de
 * bitirene kadar "Hazırlanıyor" kalır.
 */
export async function sellerAdvanceItems({
  orderId,
  sellerId,
  target,
  actor,
}: {
  orderId: string;
  sellerId: string;
  target: OrderStatus;
  actor: string;
}) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) throw new Error("Sipariş bulunamadı");

  const own = order.items.filter((item) => item.sellerId === sellerId);
  if (own.length === 0) throw new Error("Bu siparişte size ait kalem yok");

  for (const item of own) {
    if (item.status === "IPTAL") continue;
    if (!pathTo(item.status as OrderStatus, target)) continue;
    await db.orderItem.update({ where: { id: item.id }, data: { status: target } });
  }

  const fresh = await db.orderItem.findMany({ where: { orderId } });

  // Siparişin durumunu ÇİÇEĞİ hazırlayan kalemler belirler. Ek ürünler
  // (çikolata, balon) çiçekle aynı pakete konduğu için akışı geciktirmez:
  // paketi hazırlayan bayi ilerledikçe onlar da aynı duruma taşınır.
  const governing = fresh.filter((item) => !item.isAddOn);
  const derived = deriveOrderStatus(
    (governing.length > 0 ? governing : fresh).map(
      (item) => item.status as OrderStatus,
    ),
  );

  if (derived !== order.status) {
    const steps = pathTo(order.status as OrderStatus, derived) ?? [];
    for (const step of steps) {
      await db.orderEvent.create({
        data: { orderId, status: step, label: EVENT_LABEL[step], actor },
      });
    }
    await db.order.update({ where: { id: orderId }, data: { status: derived } });
    await db.orderItem.updateMany({
      where: { orderId, isAddOn: true, status: { not: "IPTAL" } },
      data: { status: derived },
    });
    await syncDelivery(orderId, derived);
  } else {
    // Sipariş durumu değişmedi ama satıcı işini yaptı — geçmişe yine de yazalım.
    await db.orderEvent.create({
      data: {
        orderId,
        status: target,
        label: `${EVENT_LABEL[target]} (kısmi)`,
        actor,
      },
    });
  }
}

/* -------------------------------- Teslimat -------------------------------- */

export async function assignCourier({
  orderId,
  courierId,
  actor,
}: {
  orderId: string;
  courierId: string;
  actor: string;
}) {
  const courier = await db.user.findUnique({ where: { id: courierId } });
  if (!courier || courier.role !== "COURIER") throw new Error("Kurye bulunamadı");

  const existing = await db.delivery.findUnique({ where: { orderId } });
  const data = {
    courierId,
    status: existing?.status === "TESLIM_EDILDI" ? "TESLIM_EDILDI" : "ATANDI",
    assignedAt: new Date(),
  };

  if (existing) {
    await db.delivery.update({ where: { orderId }, data });
  } else {
    await db.delivery.create({ data: { orderId, ...data } });
  }

  await db.orderEvent.create({
    data: {
      orderId,
      status: (await db.order.findUnique({ where: { id: orderId } }))!.status,
      label: `Teslimat ${courier.name} adlı kuryeye atandı`,
      actor,
    },
  });
}

/* ---------------------------- Arabaya verildi ----------------------------- */

/**
 * Bayi siparişi arabaya verdiğinde işaretlenir (madde 18). Sipariş bundan
 * sonra kuryenin "işlem gören teslimatlar" listesine düşer; kurye kendisine
 * atanmış ama henüz arabaya verilmemiş siparişleri "hazırlık bekliyor"
 * bölümünde görür, boşuna yola çıkmaz.
 */
export async function markDispatched({
  orderId,
  sellerId,
  actor,
}: {
  orderId: string;
  sellerId: string | null;
  actor: string;
}) {
  const delivery = await db.delivery.findUnique({ where: { orderId } });
  if (!delivery) throw new Error("Teslimat kaydı bulunamadı");

  if (!delivery.dispatchedAt) {
    await db.delivery.update({
      where: { orderId },
      data: { dispatchedAt: new Date() },
    });
    await db.orderEvent.create({
      data: {
        orderId,
        status: (await db.order.findUnique({ where: { id: orderId } }))!.status,
        label: "Sipariş arabaya verildi",
        actor,
      },
    });
  }

  // Arabaya veriliş, kalemleri "Yolda"ya taşır: satıcının işi burada biter.
  if (sellerId) {
    await sellerAdvanceItems({ orderId, sellerId, target: "YOLDA", actor });
  } else {
    await applyStatus(orderId, "YOLDA", actor);
  }
}

/* --------------------------- Hazırlık görseli ----------------------------- */

/** Satıcı buketin fotoğrafını yükler; müşteri takip ekranında görür (madde 22). */
export async function addPreparationPhoto({
  orderId,
  sellerId,
  imageUrl,
  note,
  actor,
}: {
  orderId: string;
  sellerId: string;
  imageUrl: string;
  note: string | null;
  actor: string;
}) {
  const photo = await db.preparationPhoto.create({
    data: { orderId, sellerId, imageUrl, note },
  });

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (order) {
    await db.orderEvent.create({
      data: {
        orderId,
        status: order.status,
        label: "Hazırlık onay görseli eklendi",
        actor,
      },
    });
  }

  return photo;
}

/* ---------------------------- Ödeme hatırlatma ---------------------------- */

/**
 * Bilgilerini yazıp ödemede takılan müşteriye hatırlatma (madde 14).
 *
 * Demo'da gerçek SMS/e-posta gönderilmez; hatırlatmanın gittiği kayda geçer ve
 * müşteri, sipariş takip ekranında ödemeyi tamamlama bağlantısını görür.
 */
export async function sendPaymentReminder({
  orderId,
  actor,
}: {
  orderId: string;
  actor: string;
}) {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Sipariş bulunamadı");
  if (order.paymentStatus === "ODENDI") {
    throw new Error("Bu siparişin ödemesi zaten alınmış.");
  }
  if (order.status === "IPTAL") {
    throw new Error("İptal edilmiş siparişe hatırlatma gönderilemez.");
  }

  const updated = await db.order.update({
    where: { id: orderId },
    data: { reminderCount: { increment: 1 }, lastReminderAt: new Date() },
  });

  await db.orderEvent.create({
    data: {
      orderId,
      status: order.status,
      label: `Ödeme hatırlatması gönderildi (${updated.reminderCount}. kez)`,
      actor,
    },
  });

  return updated;
}

/** Ödemesi yarım kalmış, hâlâ kurtarılabilir siparişler. */
export const ABANDONED_FILTER = {
  paymentStatus: { in: ["BEKLIYOR", "BASARISIZ"] },
  status: { notIn: ["IPTAL", "TESLIM_EDILDI"] },
};

/* --------------------------------- İptal ---------------------------------- */

export async function cancelOrder({
  orderId,
  reason,
  actor,
}: {
  orderId: string;
  reason: string;
  actor: string;
}) {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Sipariş bulunamadı");
  if (!pathTo(order.status as OrderStatus, "IPTAL")) {
    throw new Error("Bu aşamadaki bir sipariş iptal edilemez");
  }

  // Ödeme alınmışsa stok geri yüklenir.
  if (order.paymentStatus === "ODENDI") {
    const items = await db.orderItem.findMany({ where: { orderId } });
    for (const item of items) {
      await db.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
  }

  await db.order.update({
    where: { id: orderId },
    data: { status: "IPTAL", cancelReason: reason },
  });
  await db.orderItem.updateMany({ where: { orderId }, data: { status: "IPTAL" } });
  await db.orderEvent.create({
    data: { orderId, status: "IPTAL", label: `${EVENT_LABEL.IPTAL} — ${reason}`, actor },
  });
}

/* --------------------------------- Rapor ---------------------------------- */

/** Ciroya sayılan siparişler: iptal edilmemiş ve ödemesi alınmış olanlar. */
export const REVENUE_FILTER = {
  status: { not: "IPTAL" },
  paymentStatus: "ODENDI",
} as const;

export function dayKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Admin panelindeki 7 günlük grafiğin verisi. */
export async function last7DaysOrders() {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - 6);

  const orders = await db.order.findMany({
    where: { createdAt: { gte: since }, ...REVENUE_FILTER },
    select: { createdAt: true, total: true },
  });

  const days: { key: string; date: Date; count: number; revenue: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);
    days.push({ key: dayKey(date), date, count: 0, revenue: 0 });
  }

  for (const order of orders) {
    const bucket = days.find((d) => d.key === dayKey(order.createdAt));
    if (bucket) {
      bucket.count += 1;
      bucket.revenue = round2(bucket.revenue + order.total);
    }
  }

  return days;
}
