"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { changeOrderStatus } from "@/lib/orders";
import type { OrderStatus } from "@/lib/order-status";

/**
 * Kurye, yalnızca kendisine atanmış teslimatların durumunu değiştirebilir.
 * "Teslim edildi" doğrudan işaretlense bile ara "Yolda" adımı geçmişe yazılır;
 * bu mantık `lib/orders.ts` içindedir.
 */
export async function updateDelivery(orderId: string, target: OrderStatus) {
  const user = await getCurrentUser();
  if (!user || user.role !== "COURIER") {
    throw new Error("Bu işlem için kurye hesabı gerekli.");
  }

  const delivery = await db.delivery.findUnique({ where: { orderId } });
  if (!delivery || delivery.courierId !== user.id) {
    throw new Error("Bu teslimat sana atanmamış.");
  }

  await changeOrderStatus({
    orderId,
    target,
    role: "COURIER",
    actor: `Kurye: ${user.name}`,
  });

  revalidatePath("/kurye", "layout");
  revalidatePath("/", "layout");
}

/**
 * Teslim anı fotoğrafı.
 *
 * Kurye çiçeği bıraktığı kareyi çeker, müşteri sipariş takibinde görür —
 * demo senaryosu bununla kapanır. Zorunlu değil: kamerası olmayan bir
 * makinede sunum yapılabilsin diye teslimat fotoğrafsız da tamamlanır.
 * Fotoğraf teslimattan önce de sonra da yüklenebilir.
 */
export async function uploadDeliveryProof(orderId: string, dataUrl: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "COURIER") {
    return { ok: false, message: "Bu işlem için kurye hesabı gerekli." };
  }

  const delivery = await db.delivery.findUnique({ where: { orderId } });
  if (!delivery || delivery.courierId !== user.id) {
    return { ok: false, message: "Bu teslimat sana atanmamış." };
  }
  if (!dataUrl.startsWith("data:image/")) {
    return { ok: false, message: "Fotoğraf okunamadı, başka bir kare dene." };
  }

  await db.delivery.update({
    where: { orderId },
    data: { proofPhotoUrl: dataUrl },
  });

  revalidatePath("/kurye", "layout");
  revalidatePath("/", "layout");

  return { ok: true, message: "Teslim fotoğrafı müşteriye iletildi." };
}

/** Yanlış kare gittiyse kurye kaldırabilsin. */
export async function removeDeliveryProof(orderId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "COURIER") {
    return { ok: false, message: "Bu işlem için kurye hesabı gerekli." };
  }

  const delivery = await db.delivery.findUnique({ where: { orderId } });
  if (!delivery || delivery.courierId !== user.id) {
    return { ok: false, message: "Bu teslimat sana atanmamış." };
  }

  await db.delivery.update({
    where: { orderId },
    data: { proofPhotoUrl: null },
  });

  revalidatePath("/kurye", "layout");
  revalidatePath("/", "layout");

  return { ok: true, message: "Fotoğraf kaldırıldı." };
}
