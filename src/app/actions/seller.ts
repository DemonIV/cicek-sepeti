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
 * 21 Ağustos 2026'da yetki daraldı (madde 4): satıcı **mevcut ürünü
 * düzenleyemez, silemez.** Ürün bilgisini operasyon ekibi yönetir; satıcının
 * ürün üzerindeki tek doğrudan yetkisi stoğu kapatıp açmaktır. Ürün yönetimi
 * `actions/admin.ts` içine taşındı.
 *
 * 23 Ağustos 2026'da bir kapı açıldı: satıcı mağazasına **yeni ürün
 * başvurusu** yapabilir (`submitProductRequest`). Başvuru vitrine çıkmaz;
 * ürün ancak admin onayında oluşur (`reviewProductRequest`, actions/admin.ts).
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

/* ----------------------------- Ürün başvurusu ----------------------------- */

export type ProductRequestFormState = {
  errors?: Record<string, string>;
  message?: string;
  ok?: boolean;
};

/**
 * Bayi kendi mağazasına yeni ürün önerir; ürün ancak operasyon onayından sonra
 * yayına çıkar.
 *
 * Madde 4'le çelişmez: bayi mevcut bir ürünün bilgisini hâlâ değiştiremez.
 * Buradan gelen kayıt bir **başvurudur**; onaylanana kadar vitrinde görünmez,
 * onaylandıktan sonra da düzenleme yetkisi operasyondadır.
 */
export async function submitProductRequest(
  _prev: ProductRequestFormState,
  data: FormData,
): Promise<ProductRequestFormState> {
  const seller = await requireSeller();

  const str = (key: string) => String(data.get(key) ?? "").trim();

  const name = str("name");
  const categoryId = str("categoryId");
  const description = str("description");
  const price = Number(data.get("price") ?? 0);
  const stock = Number(data.get("stock") ?? 0);
  const imageUrl = str("imageUrl");
  const videoUrl = str("videoUrl");
  const sellerNote = str("sellerNote");
  const galleryUrls = str("gallery")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const errors: Record<string, string> = {};
  if (name.length < 3) errors.name = "Ürün adı en az 3 karakter olmalı.";
  if (!categoryId) errors.categoryId = "Kategori seç.";
  if (!(price > 0)) errors.price = "Fiyat sıfırdan büyük olmalı.";
  if (!Number.isInteger(stock) || stock < 0)
    errors.stock = "Stok 0 veya daha büyük bir tam sayı olmalı.";
  if (description.length < 10)
    errors.description = "Kısa bir açıklama yaz (en az 10 karakter).";
  if (!/^https?:\/\//.test(imageUrl))
    errors.imageUrl = "Görsel için http(s) ile başlayan bir adres gir.";
  if (videoUrl && !/^(https?:\/\/|\/)/.test(videoUrl))
    errors.videoUrl = "Video adresi http(s) ile başlamalı.";
  if (galleryUrls.some((url) => !/^https?:\/\//.test(url)))
    errors.gallery = "Her satırda http(s) ile başlayan bir adres olmalı.";

  if (Object.keys(errors).length) {
    return { errors, message: "Eksik alanlar var." };
  }

  await db.productRequest.create({
    data: {
      sellerId: seller.id,
      categoryId,
      name,
      description,
      price,
      stock,
      imageUrl,
      galleryUrls: galleryUrls.join("\n"),
      videoUrl: videoUrl || null,
      sellerNote: sellerNote || null,
      status: "BEKLIYOR",
    },
  });

  revalidatePath("/satici/urunler");
  revalidatePath("/admin/urunler", "layout");

  return {
    ok: true,
    message: "Başvurun operasyon ekibine iletildi. Onaylanınca ürün vitrine çıkar.",
  };
}

/** Bayi kendi bekleyen başvurusunu geri çeker. */
export async function withdrawProductRequest(requestId: string) {
  const seller = await requireSeller();

  const request = await db.productRequest.findUnique({
    where: { id: requestId },
  });
  if (!request || request.sellerId !== seller.id) {
    throw new Error("Bu başvuru üzerinde yetkin yok.");
  }
  if (request.status !== "BEKLIYOR") {
    throw new Error("Yalnızca inceleme bekleyen başvuru geri çekilebilir.");
  }

  await db.productRequest.delete({ where: { id: requestId } });

  revalidatePath("/satici/urunler");
  revalidatePath("/admin/urunler", "layout");
}
