"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  AREA_COOKIE,
  AREA_PROMPT_COOKIE,
  searchAreas,
} from "@/lib/delivery-area";
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

/* ---------------------- Adres seçme modalı (23 Ağustos) ------------------- */

/**
 * Modaldaki arama kutusu. İstemci her tuşta değil, kısa bir beklemeden sonra
 * çağırır; sonuç mahalleleri ve tanınmış noktaları birlikte döner.
 */
export async function searchDeliveryPoints(query: string) {
  return searchAreas(query);
}

/**
 * Modalden bölge seçimi — sayfa değiştirmeden, yerinde.
 * `setDeliveryArea` sunucu tarafında yönlendirdiği için ayrı duruyor.
 */
export async function chooseDeliveryArea(neighborhoodId: string) {
  const area = await db.neighborhood.findUnique({
    where: { id: neighborhoodId },
  });
  if (!area) return { ok: false as const, message: "Bölge bulunamadı." };

  const store = await cookies();
  store.set(AREA_COOKIE, area.id, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
  store.set(AREA_PROMPT_COOKIE, "1", {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });

  revalidatePath("/", "layout");
  return {
    ok: true as const,
    message: `${area.district} / ${area.name} seçildi.`,
  };
}

/**
 * "Şimdilik geç": modal bir daha kendiliğinden açılmaz.
 *
 * Demo kararı — gerçek sistemde adres seçimi zorunlu tutulabilir; sunumu açan
 * kişi kapalı bir kapıyla karşılaşmasın diye burada geçilebilir bırakıldı.
 * Bölge seçilmezse katalog daralmaz.
 */
export async function dismissAreaPrompt() {
  const store = await cookies();
  store.set(AREA_PROMPT_COOKIE, "1", {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
  });
}
