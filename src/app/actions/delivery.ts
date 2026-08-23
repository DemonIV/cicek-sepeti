"use server";

import { cookies } from "next/headers";
import {
  DELIVERY_PREF_COOKIE,
  isDeliverySlotAvailable,
} from "@/lib/delivery-time";

/**
 * Ürün sayfasında seçilen teslimat günü ve saati.
 *
 * Sepet gibi çerezde tutulur; ödeme adımı bu seçimle açılır, böylece müşteri
 * aynı soruyu iki kez cevaplamaz. Kesim saati geçmiş bir seçim kabul edilmez.
 */
export async function setDeliveryPreference(dateIso: string, slot: string) {
  if (!isDeliverySlotAvailable(dateIso, slot, new Date())) {
    return { ok: false as const, message: "Bu saat aralığı artık seçilemiyor." };
  }

  const store = await cookies();
  store.set(DELIVERY_PREF_COOKIE, `${dateIso}|${slot}`, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 3,
  });

  return { ok: true as const, message: "Teslimat zamanı seçildi." };
}

/** Ödeme adımı çerezdeki seçimi okur; geçersizse yok sayar. */
export async function readDeliveryPreference() {
  const store = await cookies();
  const raw = store.get(DELIVERY_PREF_COOKIE)?.value;
  if (!raw) return null;

  const [dateIso, slot] = raw.split("|");
  if (!dateIso || !slot) return null;
  if (!isDeliverySlotAvailable(dateIso, slot, new Date())) return null;

  return { dateIso, slot };
}
