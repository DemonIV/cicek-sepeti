"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  assignCourier,
  cancelOrder,
  changeOrderStatus,
  sendPaymentReminder,
} from "@/lib/orders";
import type { OrderStatus } from "@/lib/order-status";
import type { SellerStatus } from "@/lib/enums";
import { slugify } from "@/lib/format";
import { logAudit } from "@/lib/audit";
import { addScoreEvent, scanLateOrders } from "@/lib/seller-score";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("Bu işlem için admin hesabı gerekli.");
  }
  return user;
}

/* ------------------------------ Satıcı yönetimi --------------------------- */

export async function setSellerStatus(sellerId: string, status: SellerStatus) {
  const admin = await requireAdmin();

  const seller = await db.seller.update({
    where: { id: sellerId },
    data: {
      status,
      // Onaylanan bayinin sorumlusu, onaylayan admindir.
      ...(status === "APPROVED" ? { accountManagerId: admin.id } : {}),
    },
  });

  await logAudit({
    actor: admin,
    action: status === "APPROVED" ? "seller.approve" : "seller.reject",
    summary: `${seller.storeName} başvurusu ${
      status === "APPROVED" ? "onaylandı" : "reddedildi"
    }`,
    entity: "Seller",
    entityId: sellerId,
  });

  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
}

export async function setCommissionRate(sellerId: string, percent: number) {
  const admin = await requireAdmin();

  const clamped = Math.min(40, Math.max(0, percent));
  const seller = await db.seller.update({
    where: { id: sellerId },
    // Oran yüzde olarak girilir, oran olarak saklanır. Mevcut siparişlerin
    // komisyonu değişmez; her kalem kendi oranını sipariş anında dondurur.
    data: { commissionRate: Math.round(clamped * 10) / 1000 },
  });

  await logAudit({
    actor: admin,
    action: "seller.commission",
    summary: `${seller.storeName} komisyon oranı %${clamped} yapıldı`,
    entity: "Seller",
    entityId: sellerId,
  });

  revalidatePath("/admin", "layout");
}

/** Bayinin sipariş alımını durdurur veya açar (madde 16). */
export async function setSellerAccepting(
  sellerId: string,
  accepting: boolean,
  reason = "",
) {
  const admin = await requireAdmin();

  const seller = await db.seller.update({
    where: { id: sellerId },
    data: {
      acceptingOrders: accepting,
      pauseReason: accepting ? null : reason.trim() || "Operasyon kararı",
    },
  });

  await logAudit({
    actor: admin,
    action: accepting ? "seller.resume" : "seller.pause",
    summary: accepting
      ? `${seller.storeName} yeniden sipariş almaya başladı`
      : `${seller.storeName} sipariş alımı durduruldu${
          reason.trim() ? ` — ${reason.trim()}` : ""
        }`,
    entity: "Seller",
    entityId: sellerId,
  });

  revalidatePath("/admin", "layout");
  revalidatePath("/satici", "layout");
  revalidatePath("/", "layout");
}

/** Gün bazlı ve sipariş bazlı kota (madde 19). */
export async function setSellerQuota(
  sellerId: string,
  dailyQuota: number | null,
  activeQuota: number | null,
) {
  const admin = await requireAdmin();

  const clean = (value: number | null) =>
    value === null || Number.isNaN(value) || value <= 0
      ? null
      : Math.min(999, Math.trunc(value));

  const seller = await db.seller.update({
    where: { id: sellerId },
    data: { dailyQuota: clean(dailyQuota), activeQuota: clean(activeQuota) },
  });

  await logAudit({
    actor: admin,
    action: "seller.quota",
    summary: `${seller.storeName} kotası güncellendi (günlük ${
      seller.dailyQuota ?? "sınırsız"
    }, açık sipariş ${seller.activeQuota ?? "sınırsız"})`,
    entity: "Seller",
    entityId: sellerId,
  });

  revalidatePath("/admin", "layout");
  revalidatePath("/satici", "layout");
}

/** Bayinin sorumlusu — satıcı panelinde adı ve numarası görünür (madde 21). */
export async function setAccountManager(sellerId: string, managerId: string) {
  const admin = await requireAdmin();

  const [seller, manager] = await Promise.all([
    db.seller.findUnique({ where: { id: sellerId } }),
    managerId ? db.user.findUnique({ where: { id: managerId } }) : null,
  ]);
  if (!seller) throw new Error("Bayi bulunamadı");

  await db.seller.update({
    where: { id: sellerId },
    data: { accountManagerId: manager?.id ?? null },
  });

  await logAudit({
    actor: admin,
    action: "seller.manager",
    summary: `${seller.storeName} sorumlusu ${manager?.name ?? "kaldırıldı"}`,
    entity: "Seller",
    entityId: sellerId,
  });

  revalidatePath("/admin", "layout");
  revalidatePath("/satici", "layout");
}

/** Bayi ↔ mahalle eşleşmesi (madde 15). */
export async function toggleSellerArea(
  sellerId: string,
  neighborhoodId: string,
) {
  const admin = await requireAdmin();

  const [seller, neighborhood, existing] = await Promise.all([
    db.seller.findUnique({ where: { id: sellerId } }),
    db.neighborhood.findUnique({ where: { id: neighborhoodId } }),
    db.sellerArea.findFirst({ where: { sellerId, neighborhoodId } }),
  ]);
  if (!seller || !neighborhood) throw new Error("Kayıt bulunamadı");

  if (existing) {
    await db.sellerArea.delete({ where: { id: existing.id } });
  } else {
    await db.sellerArea.create({ data: { sellerId, neighborhoodId } });
  }

  await logAudit({
    actor: admin,
    action: "seller.area",
    summary: `${seller.storeName} için ${neighborhood.district} / ${
      neighborhood.name
    } bölgesi ${existing ? "kapatıldı" : "açıldı"}`,
    entity: "SellerArea",
    entityId: sellerId,
  });

  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
}

/** Bir ilçenin tüm mahallelerini tek seferde aç/kapat. */
export async function setDistrictAreas(
  sellerId: string,
  city: string,
  district: string,
  open: boolean,
) {
  const admin = await requireAdmin();

  const [seller, neighborhoods] = await Promise.all([
    db.seller.findUnique({ where: { id: sellerId } }),
    db.neighborhood.findMany({ where: { city, district } }),
  ]);
  if (!seller) throw new Error("Bayi bulunamadı");

  if (open) {
    for (const n of neighborhoods) {
      const exists = await db.sellerArea.findFirst({
        where: { sellerId, neighborhoodId: n.id },
      });
      if (!exists) {
        await db.sellerArea.create({
          data: { sellerId, neighborhoodId: n.id },
        });
      }
    }
  } else {
    await db.sellerArea.deleteMany({
      where: { sellerId, neighborhoodId: { in: neighborhoods.map((n) => n.id) } },
    });
  }

  await logAudit({
    actor: admin,
    action: "seller.area",
    summary: `${seller.storeName} için ${district} ilçesinin tamamı ${
      open ? "açıldı" : "kapatıldı"
    }`,
    entity: "SellerArea",
    entityId: sellerId,
  });

  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
}

/** Elle puan düzeltmesi (madde 17). */
export async function adjustSellerScore(
  sellerId: string,
  delta: number,
  reason: string,
) {
  const admin = await requireAdmin();

  const seller = await db.seller.findUnique({ where: { id: sellerId } });
  if (!seller) throw new Error("Bayi bulunamadı");

  const clean = Math.max(-50, Math.min(50, Math.trunc(delta)));
  if (clean === 0) return;

  await addScoreEvent({
    sellerId,
    delta: clean,
    reason: reason.trim() || "Operasyon düzeltmesi",
  });

  await logAudit({
    actor: admin,
    action: "seller.score",
    summary: `${seller.storeName} puanı ${clean > 0 ? "+" : ""}${clean} (${
      reason.trim() || "operasyon düzeltmesi"
    })`,
    entity: "Seller",
    entityId: sellerId,
  });

  revalidatePath("/admin", "layout");
  revalidatePath("/satici", "layout");
}

/** Geciken siparişleri tarar, cezalandırılmamışlara otomatik −5 puan yazar. */
export async function runLateScan() {
  const admin = await requireAdmin();
  const written = await scanLateOrders();

  if (written > 0) {
    await logAudit({
      actor: admin,
      action: "seller.score",
      summary: `Gecikme taraması: ${written} sipariş için puan düşüldü`,
      entity: "Seller",
    });
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/satici", "layout");
  return written;
}

/* ------------------------------ Sipariş yönetimi -------------------------- */

export async function assignOrderCourier(orderId: string, courierId: string) {
  const admin = await requireAdmin();

  await assignCourier({ orderId, courierId, actor: `Admin: ${admin.name}` });

  const order = await db.order.findUnique({ where: { id: orderId } });
  await logAudit({
    actor: admin,
    action: "order.courier",
    summary: `${order?.orderNo ?? orderId} siparişine kurye atandı`,
    entity: "Order",
    entityId: orderId,
  });

  revalidatePath("/admin", "layout");
  revalidatePath("/kurye", "layout");
  revalidatePath("/", "layout");
}

export async function adminChangeStatus(orderId: string, target: OrderStatus) {
  const admin = await requireAdmin();

  if (target === "IPTAL") {
    await cancelOrder({
      orderId,
      reason: "Operasyon ekibi tarafından iptal edildi",
      actor: `Admin: ${admin.name}`,
    });
  } else {
    await changeOrderStatus({
      orderId,
      target,
      role: "ADMIN",
      actor: `Admin: ${admin.name}`,
    });
  }

  const order = await db.order.findUnique({ where: { id: orderId } });
  await logAudit({
    actor: admin,
    action: "order.status",
    summary: `${order?.orderNo ?? orderId} durumu ${target} yapıldı`,
    entity: "Order",
    entityId: orderId,
  });

  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
}

/** Ödemede takılan müşteriye hatırlatma (madde 14). */
export async function remindPayment(orderId: string) {
  const admin = await requireAdmin();

  const order = await sendPaymentReminder({
    orderId,
    actor: `Admin: ${admin.name}`,
  });

  await logAudit({
    actor: admin,
    action: "order.reminder",
    summary: `${order.orderNo} için ödeme hatırlatması gönderildi (${order.reminderCount}. kez)`,
    entity: "Order",
    entityId: orderId,
  });

  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");

  return {
    ok: true as const,
    message: `${order.recipientName} için hatırlatma gönderildi.`,
  };
}

/* -------------------------------- Faturalar ------------------------------- */

export async function reviewInvoice(
  invoiceId: string,
  status: "ONAYLANDI" | "REDDEDILDI",
  note = "",
) {
  const admin = await requireAdmin();

  const invoice = await db.invoice.update({
    where: { id: invoiceId },
    data: {
      status,
      note: note.trim() || undefined,
      reviewedAt: new Date(),
      reviewedBy: admin.name,
    },
    include: { seller: true },
  });

  await logAudit({
    actor: admin,
    action: status === "ONAYLANDI" ? "invoice.approve" : "invoice.reject",
    summary: `${invoice.seller.storeName} — ${invoice.periodLabel} faturası ${
      status === "ONAYLANDI" ? "onaylandı" : "reddedildi"
    }`,
    entity: "Invoice",
    entityId: invoiceId,
  });

  revalidatePath("/admin/finans");
  revalidatePath("/satici/faturalar");
}

/* -------------------------------- Ürünler --------------------------------- */

export async function setProductVisibility(productId: string, isActive: boolean) {
  const admin = await requireAdmin();

  const product = await db.product.update({
    where: { id: productId },
    data: { isActive },
  });

  await logAudit({
    actor: admin,
    action: "product.visibility",
    summary: `${product.name} ${isActive ? "yayına alındı" : "yayından kaldırıldı"}`,
    entity: "Product",
    entityId: productId,
  });

  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
}

export type ProductFormState = { errors?: Record<string, string>; message?: string };

const text = (data: FormData, key: string) => String(data.get(key) ?? "").trim();
const num = (data: FormData, key: string) => Number(data.get(key) ?? 0);

/**
 * Ürün bilgisini yalnızca operasyon ekibi düzenler (madde 4). Satıcı ürüne
 * dokunamaz; stok kapatma yetkisi `actions/seller.ts` içindedir.
 */
function validate(data: FormData) {
  const errors: Record<string, string> = {};
  const name = text(data, "name");
  const price = num(data, "price");
  const stock = num(data, "stock");
  const description = text(data, "description");
  const categoryId = text(data, "categoryId");
  const sellerId = text(data, "sellerId");
  const imageUrl = text(data, "imageUrl");
  const discountPriceRaw = text(data, "discountPrice");
  const discountPrice = discountPriceRaw ? Number(discountPriceRaw) : null;
  const discountStartsAt = text(data, "discountStartsAt");
  const discountEndsAt = text(data, "discountEndsAt");
  const videoUrl = text(data, "videoUrl");
  const gallery = text(data, "gallery");

  if (name.length < 3) errors.name = "Ürün adı en az 3 karakter olmalı.";
  if (!sellerId) errors.sellerId = "Bayi seç.";
  if (!categoryId) errors.categoryId = "Kategori seç.";
  if (!(price > 0)) errors.price = "Fiyat sıfırdan büyük olmalı.";
  if (!Number.isInteger(stock) || stock < 0)
    errors.stock = "Stok 0 veya daha büyük bir tam sayı olmalı.";
  if (description.length < 10)
    errors.description = "Kısa bir açıklama yaz (en az 10 karakter).";
  if (!/^https?:\/\//.test(imageUrl))
    errors.imageUrl = "Görsel için http(s) ile başlayan bir adres gir.";

  if (discountPrice !== null) {
    if (!(discountPrice > 0) || discountPrice >= price) {
      errors.discountPrice = "İndirimli fiyat, liste fiyatından küçük olmalı.";
    }
    if (!discountStartsAt || !discountEndsAt) {
      errors.discountStartsAt = "İndirimin başlangıç ve bitiş zamanını gir.";
    } else if (new Date(discountEndsAt) <= new Date(discountStartsAt)) {
      errors.discountEndsAt = "Bitiş, başlangıçtan sonra olmalı.";
    }
  }

  // Galeri: her satır bir görsel adresi (madde 23).
  const galleryUrls = gallery
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (galleryUrls.some((url) => !/^https?:\/\//.test(url))) {
    errors.gallery = "Her satırda http(s) ile başlayan bir adres olmalı.";
  }

  return {
    errors,
    values: {
      name,
      price,
      stock,
      description,
      categoryId,
      sellerId,
      imageUrl,
      discountPrice,
      discountStartsAt: discountPrice && discountStartsAt ? new Date(discountStartsAt) : null,
      discountEndsAt: discountPrice && discountEndsAt ? new Date(discountEndsAt) : null,
      videoUrl: videoUrl || null,
      galleryUrls,
    },
  };
}

/** Ürünün gönderim amaçlarını baştan yazar (formdaki kutucuklar). */
async function writeOccasions(productId: string, slugs: string[]) {
  await db.productOccasion.deleteMany({ where: { productId } });
  if (!slugs.length) return;

  const occasions = await db.occasion.findMany({
    where: { slug: { in: slugs } },
    select: { id: true },
  });

  await db.productOccasion.createMany({
    data: occasions.map((occasion) => ({
      productId,
      occasionId: occasion.id,
    })),
  });
}

async function writeGallery(
  productId: string,
  mainImage: string,
  galleryUrls: string[],
  videoUrl: string | null,
) {
  await db.productMedia.deleteMany({ where: { productId } });

  const media = [
    { url: mainImage, kind: "IMAGE", sortOrder: 0 },
    ...galleryUrls.map((url, index) => ({
      url,
      kind: "IMAGE",
      sortOrder: index + 1,
    })),
  ];
  if (videoUrl) {
    media.push({ url: videoUrl, kind: "VIDEO", sortOrder: media.length });
  }

  await db.productMedia.createMany({
    data: media.map((item) => ({ ...item, productId })),
  });
}

export async function createProduct(
  _prev: ProductFormState,
  data: FormData,
): Promise<ProductFormState> {
  const admin = await requireAdmin();
  const { errors, values } = validate(data);
  if (Object.keys(errors).length) {
    return { errors, message: "Eksik alanlar var." };
  }

  let slug = slugify(values.name);
  if (await db.product.findUnique({ where: { slug } })) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }

  const product = await db.product.create({
    data: {
      name: values.name,
      price: values.price,
      stock: values.stock,
      description: values.description,
      categoryId: values.categoryId,
      sellerId: values.sellerId,
      imageUrl: values.imageUrl,
      slug,
      isActive: data.get("isActive") === "on",
      isFeatured: data.get("isFeatured") === "on",
      isWeeklyPick: data.get("isWeeklyPick") === "on",
      discountPrice: values.discountPrice,
      discountStartsAt: values.discountStartsAt,
      discountEndsAt: values.discountEndsAt,
      videoUrl: values.videoUrl,
    },
  });

  await writeGallery(product.id, values.imageUrl, values.galleryUrls, values.videoUrl);
  await writeOccasions(product.id, data.getAll("occasions").map(String));

  await logAudit({
    actor: admin,
    action: "product.create",
    summary: `${product.name} eklendi`,
    entity: "Product",
    entityId: product.id,
  });

  revalidatePath("/admin/urunler");
  revalidatePath("/", "layout");
  redirect("/admin/urunler?eklendi=1");
}

export async function updateProduct(
  productId: string,
  _prev: ProductFormState,
  data: FormData,
): Promise<ProductFormState> {
  const admin = await requireAdmin();
  const { errors, values } = validate(data);
  if (Object.keys(errors).length) {
    return { errors, message: "Eksik alanlar var." };
  }

  const product = await db.product.update({
    where: { id: productId },
    data: {
      name: values.name,
      price: values.price,
      stock: values.stock,
      description: values.description,
      categoryId: values.categoryId,
      sellerId: values.sellerId,
      imageUrl: values.imageUrl,
      isActive: data.get("isActive") === "on",
      isFeatured: data.get("isFeatured") === "on",
      isWeeklyPick: data.get("isWeeklyPick") === "on",
      discountPrice: values.discountPrice,
      discountStartsAt: values.discountStartsAt,
      discountEndsAt: values.discountEndsAt,
      videoUrl: values.videoUrl,
    },
  });

  await writeGallery(productId, values.imageUrl, values.galleryUrls, values.videoUrl);
  await writeOccasions(productId, data.getAll("occasions").map(String));

  await logAudit({
    actor: admin,
    action: "product.update",
    summary: `${product.name} güncellendi`,
    entity: "Product",
    entityId: productId,
  });

  revalidatePath("/admin/urunler");
  revalidatePath("/", "layout");
  redirect("/admin/urunler?guncellendi=1");
}

/* ----------------------------- Ürün başvuruları --------------------------- */

/**
 * Bayinin ürün başvurusunu inceler.
 *
 * Onaylanırsa başvuru gerçek bir `Product`'a dönüşür ve vitrine çıkar;
 * reddedilirse sebep bayinin panelinde görünür. Ürün oluştuktan sonra
 * düzenleme yetkisi yine operasyondadır (madde 4).
 */
export async function reviewProductRequest(
  requestId: string,
  status: "ONAYLANDI" | "REDDEDILDI",
  note = "",
) {
  const admin = await requireAdmin();

  const request = await db.productRequest.findUnique({
    where: { id: requestId },
    include: { seller: true },
  });
  if (!request) throw new Error("Başvuru bulunamadı.");
  if (request.status !== "BEKLIYOR") {
    throw new Error("Bu başvuru zaten sonuçlanmış.");
  }

  let productId: string | null = null;

  if (status === "ONAYLANDI") {
    let slug = slugify(request.name);
    if (await db.product.findUnique({ where: { slug } })) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }

    const product = await db.product.create({
      data: {
        sellerId: request.sellerId,
        categoryId: request.categoryId,
        name: request.name,
        slug,
        description: request.description,
        price: request.price,
        stock: request.stock,
        imageUrl: request.imageUrl,
        videoUrl: request.videoUrl,
        isActive: true,
      },
    });
    productId = product.id;

    const galleryUrls = request.galleryUrls
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    await writeGallery(product.id, request.imageUrl, galleryUrls, request.videoUrl);
  }

  await db.productRequest.update({
    where: { id: requestId },
    data: {
      status,
      reviewNote: note.trim() || null,
      reviewedAt: new Date(),
      reviewedBy: admin.name,
      productId,
    },
  });

  await logAudit({
    actor: admin,
    action:
      status === "ONAYLANDI" ? "productRequest.approve" : "productRequest.reject",
    summary: `${request.seller.storeName} — "${request.name}" ürün başvurusu ${
      status === "ONAYLANDI" ? "onaylandı ve yayına alındı" : "reddedildi"
    }`,
    entity: "ProductRequest",
    entityId: requestId,
  });

  revalidatePath("/admin", "layout");
  revalidatePath("/satici", "layout");
  revalidatePath("/", "layout");
}
