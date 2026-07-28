"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { assignCourier, cancelOrder, changeOrderStatus } from "@/lib/orders";
import type { OrderStatus } from "@/lib/order-status";
import type { SellerStatus } from "@/lib/enums";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("Bu işlem için admin hesabı gerekli.");
  }
  return user;
}

/* ------------------------------ Satıcı yönetimi --------------------------- */

export async function setSellerStatus(sellerId: string, status: SellerStatus) {
  await requireAdmin();

  await db.seller.update({ where: { id: sellerId }, data: { status } });

  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
}

export async function setCommissionRate(sellerId: string, percent: number) {
  await requireAdmin();

  const clamped = Math.min(40, Math.max(0, percent));
  await db.seller.update({
    where: { id: sellerId },
    // Oran yüzde olarak girilir, oran olarak saklanır. Mevcut siparişlerin
    // komisyonu değişmez; her kalem kendi oranını sipariş anında dondurur.
    data: { commissionRate: Math.round(clamped * 10) / 1000 },
  });

  revalidatePath("/admin", "layout");
}

/* ------------------------------ Sipariş yönetimi -------------------------- */

export async function assignOrderCourier(orderId: string, courierId: string) {
  const admin = await requireAdmin();

  await assignCourier({ orderId, courierId, actor: `Admin: ${admin.name}` });

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

  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
}

/* -------------------------------- Ürünler --------------------------------- */

export async function setProductVisibility(productId: string, isActive: boolean) {
  await requireAdmin();

  await db.product.update({ where: { id: productId }, data: { isActive } });

  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
}
