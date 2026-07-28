"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentSeller, getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/format";
import { sellerAdvanceItems } from "@/lib/orders";
import type { OrderStatus } from "@/lib/order-status";

export type ProductFormState = { errors?: Record<string, string>; message?: string };

const text = (data: FormData, key: string) => String(data.get(key) ?? "").trim();
const num = (data: FormData, key: string) => Number(data.get(key) ?? 0);

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

function validate(data: FormData) {
  const errors: Record<string, string> = {};
  const name = text(data, "name");
  const price = num(data, "price");
  const stock = num(data, "stock");
  const description = text(data, "description");
  const categoryId = text(data, "categoryId");
  const imageUrl = text(data, "imageUrl");

  if (name.length < 3) errors.name = "Ürün adı en az 3 karakter olmalı.";
  if (!categoryId) errors.categoryId = "Kategori seç.";
  if (!(price > 0)) errors.price = "Fiyat sıfırdan büyük olmalı.";
  if (!Number.isInteger(stock) || stock < 0) errors.stock = "Stok 0 veya daha büyük bir tam sayı olmalı.";
  if (description.length < 10) errors.description = "Kısa bir açıklama yaz (en az 10 karakter).";
  if (!/^https?:\/\//.test(imageUrl)) errors.imageUrl = "Görsel için http(s) ile başlayan bir adres gir.";

  return {
    errors,
    values: { name, price, stock, description, categoryId, imageUrl },
  };
}

export async function createProduct(
  _prev: ProductFormState,
  data: FormData,
): Promise<ProductFormState> {
  const seller = await requireSeller();
  const { errors, values } = validate(data);
  if (Object.keys(errors).length) {
    return { errors, message: "Eksik alanlar var." };
  }

  let slug = slugify(values.name);
  if (await db.product.findUnique({ where: { slug } })) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }

  await db.product.create({
    data: {
      ...values,
      slug,
      sellerId: seller.id,
      isActive: data.get("isActive") === "on",
      isFeatured: data.get("isFeatured") === "on",
    },
  });

  revalidatePath("/satici/urunler");
  revalidatePath("/", "layout");
  redirect("/satici/urunler?eklendi=1");
}

export async function updateProduct(
  productId: string,
  _prev: ProductFormState,
  data: FormData,
): Promise<ProductFormState> {
  const seller = await requireSeller();
  await requireOwnProduct(productId, seller.id);

  const { errors, values } = validate(data);
  if (Object.keys(errors).length) {
    return { errors, message: "Eksik alanlar var." };
  }

  await db.product.update({
    where: { id: productId },
    data: {
      ...values,
      isActive: data.get("isActive") === "on",
      isFeatured: data.get("isFeatured") === "on",
    },
  });

  revalidatePath("/satici/urunler");
  revalidatePath("/", "layout");
  redirect("/satici/urunler?guncellendi=1");
}

export async function deleteProduct(productId: string) {
  const seller = await requireSeller();
  await requireOwnProduct(productId, seller.id);

  // Siparişi olan ürün silinmez; yalnızca yayından kaldırılır — geçmiş bozulmasın.
  const usage = await db.orderItem.count({ where: { productId } });
  if (usage > 0) {
    await db.product.update({ where: { id: productId }, data: { isActive: false } });
    revalidatePath("/satici/urunler");
    return { ok: false as const, message: "Siparişi olan ürün silinemez, yayından kaldırıldı." };
  }

  await db.product.delete({ where: { id: productId } });
  revalidatePath("/satici/urunler");
  revalidatePath("/", "layout");
  return { ok: true as const, message: "Ürün silindi." };
}

export async function setProductStock(productId: string, stock: number) {
  const seller = await requireSeller();
  await requireOwnProduct(productId, seller.id);

  await db.product.update({
    where: { id: productId },
    data: { stock: Math.max(0, Math.trunc(stock)) },
  });

  revalidatePath("/satici/urunler");
  revalidatePath("/", "layout");
}

export async function toggleProductActive(productId: string) {
  const seller = await requireSeller();
  const product = await requireOwnProduct(productId, seller.id);

  await db.product.update({
    where: { id: productId },
    data: { isActive: !product.isActive },
  });

  revalidatePath("/satici/urunler");
  revalidatePath("/", "layout");
}

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
