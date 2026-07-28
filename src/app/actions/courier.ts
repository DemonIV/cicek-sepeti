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
