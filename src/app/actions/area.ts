"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AREA_COOKIE } from "@/lib/delivery-area";
import { db } from "@/lib/db";

/**
 * Teslimat bölgesi seçimi (madde 12). Sepet gibi çerezde tutulur; müşteri
 * hesabına bağlı değil, çünkü demo'da rol tek tıkla değişiyor.
 */
export async function setDeliveryArea(formData: FormData) {
  const neighborhoodId = String(formData.get("neighborhoodId") ?? "");
  const target = String(formData.get("target") ?? "");

  const area = await db.neighborhood.findUnique({ where: { id: neighborhoodId } });
  if (!area) return;

  const store = await cookies();
  store.set(AREA_COOKIE, area.id, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });

  revalidatePath("/", "layout");
  redirect(target || "/urunler");
}

export async function clearDeliveryArea() {
  const store = await cookies();
  store.delete(AREA_COOKIE);
  revalidatePath("/", "layout");
}
