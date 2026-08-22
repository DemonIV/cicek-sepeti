"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSeller, getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  addPreparationPhoto,
  markDispatched,
  sellerAdvanceItems,
} from "@/lib/orders";
import type { OrderStatus } from "@/lib/order-status";

/**
 * Satıcı eylemleri.
 *
 * 21 Ağustos 2026'da yetki daraldı (madde 4): satıcı **ürün ekleyemez,
 * düzenleyemez, silemez.** Ürün bilgisini operasyon ekibi yönetir; satıcının
 * ürün üzerindeki tek yetkisi stoğu kapatıp açmaktır. Ürün yönetimi
 * `actions/admin.ts` içine taşındı.
 */

async function requireSeller() {
  const seller = await getCurrentSeller();
  if (!seller) throw new Error("Bu işlem için satıcı hesabı gerekli.");
  return seller;
}

/** Ürünün gerçekten bu satıcıya ait olduğunu doğrular. */
async function requireOwnProduct(productId: string, sellerId: string) {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product || product.sellerId !== sellerId) {
    throw new Error("Bu ürün üzerinde yetkin yok.");
  }
  return product;
}

/* --------------------------------- Stok ---------------------------------- */

/**
 * Stoğu kapatır veya açar (madde 4). Kapalıyken ürün vitrinde "satışa kapalı"
 * görünür, sepete eklenemez; ürün bilgisi ve geçmiş siparişler etkilenmez.
 */
export async function setStockClosed(productId: string, closed: boolean) {
  const seller = await requireSeller();
  await requireOwnProduct(productId, seller.id);

  await db.product.update({
    where: { id: productId },
    data: { stockClosed: closed },
  });

  revalidatePath("/satici", "layout");
  revalidatePath("/", "layout");
}

/* ------------------------------- Siparişler ------------------------------- */

/** Satıcı yalnızca kendi kalemlerini ilerletir. */
export async function advanceSellerOrder(orderId: string, target: OrderStatus) {
  const [seller, user] = await Promise.all([requireSeller(), getCurrentUser()]);

  await sellerAdvanceItems({
    orderId,
    sellerId: seller.id,
    target,
    actor: `Satıcı: ${seller.storeName}${user ? ` (${user.name})` : ""}`,
  });

  revalidatePath("/satici", "layout");
  revalidatePath("/", "layout");
}

/**
 * "Arabaya verildi" (madde 18): sipariş kuryenin listesine bundan sonra düşer.
 * Kalemler aynı anda "Yolda"ya geçer.
 */
export async function dispatchSellerOrder(orderId: string) {
  const [seller, user] = await Promise.all([requireSeller(), getCurrentUser()]);

  await markDispatched({
    orderId,
    sellerId: seller.id,
    actor: `Satıcı: ${seller.storeName}${user ? ` (${user.name})` : ""}`,
  });

  revalidatePath("/satici", "layout");
  revalidatePath("/kurye", "layout");
  revalidatePath("/", "layout");
}

/* -------------------------- Hazırlık onay görseli ------------------------- */

/** Demo'da fotoğraf küçültülüp veri URL'i olarak saklanır; sunucuda iş yok. */
const MAX_PHOTO_BYTES = 600 * 1024;

export async function uploadPreparationPhoto(
  orderId: string,
  imageUrl: string,
  note: string,
) {
  const [seller, user] = await Promise.all([requireSeller(), getCurrentUser()]);

  if (!imageUrl.startsWith("data:image/") && !/^https?:\/\//.test(imageUrl)) {
    return { ok: false as const, message: "Geçerli bir görsel seçilmedi." };
  }
  if (imageUrl.length > MAX_PHOTO_BYTES) {
    return {
      ok: false as const,
      message: "Fotoğraf çok büyük. Daha küçük bir kare dene.",
    };
  }

  const own = await db.orderItem.findFirst({
    where: { orderId, sellerId: seller.id },
    select: { id: true },
  });
  if (!own) {
    return { ok: false as const, message: "Bu siparişte sana ait kalem yok." };
  }

  await addPreparationPhoto({
    orderId,
    sellerId: seller.id,
    imageUrl,
    note: note.trim() || null,
    actor: `Satıcı: ${seller.storeName}${user ? ` (${user.name})` : ""}`,
  });

  revalidatePath("/satici", "layout");
  revalidatePath("/", "layout");

  return { ok: true as const, message: "Onay görseli müşteriye iletildi." };
}

/* --------------------------------- Fatura --------------------------------- */

const MAX_INVOICE_BYTES = 800 * 1024;

/**
 * Satıcı kendi komisyon faturasını yükler (madde 2); finans ekibi admin
 * panelinden inceler (madde 1).
 *
 * Demo notu: gerçek dosya deposu yok. Görsel yüklenirse küçültülmüş bir
 * önizleme saklanır, PDF'te yalnızca dosya bilgileri tutulur.
 */
export async function uploadInvoice(formData: FormData) {
  const [seller, user] = await Promise.all([requireSeller(), getCurrentUser()]);

  const periodLabel = String(formData.get("periodLabel") ?? "").trim();
  const invoiceNo = String(formData.get("invoiceNo") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const fileName = String(formData.get("fileName") ?? "").trim();
  const fileType = String(formData.get("fileType") ?? "").trim();
  const fileSize = Number(formData.get("fileSize") ?? 0);
  const previewUrl = String(formData.get("previewUrl") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!/^\d{4}-\d{2}$/.test(periodLabel)) {
    return { ok: false as const, message: "Dönemi ay olarak seç." };
  }
  if (invoiceNo.length < 3) {
    return { ok: false as const, message: "Fatura numarasını yaz." };
  }
  if (!(amount > 0)) {
    return { ok: false as const, message: "Fatura tutarı sıfırdan büyük olmalı." };
  }
  if (!fileName) {
    return { ok: false as const, message: "Yüklenecek dosyayı seç." };
  }

  await db.invoice.create({
    data: {
      sellerId: seller.id,
      periodLabel,
      invoiceNo,
      amount,
      fileName,
      fileType: fileType || "application/octet-stream",
      fileSize: Math.max(0, Math.trunc(fileSize)),
      previewUrl:
        previewUrl.startsWith("data:image/") &&
        previewUrl.length <= MAX_INVOICE_BYTES
          ? previewUrl
          : null,
      note: note || null,
      status: "BEKLIYOR",
      uploadedBy: `Satıcı: ${user?.name ?? seller.storeName}`,
    },
  });

  revalidatePath("/satici/faturalar");
  revalidatePath("/admin/finans");

  return { ok: true as const, message: "Fatura yüklendi, finans incelemesine düştü." };
}
