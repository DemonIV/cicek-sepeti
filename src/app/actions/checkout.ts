"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getCartDetail, writeCart } from "@/lib/cart";
import { createOrderFromCart, settlePayment } from "@/lib/orders";
import { DELIVERY_SLOTS } from "@/lib/enums";

export type CheckoutState = {
  errors?: Record<string, string>;
  message?: string;
};

const required = (value: FormDataEntryValue | null) =>
  typeof value === "string" ? value.trim() : "";

export async function placeOrder(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const user = await getCurrentUser();
  if (!user) {
    return { message: "Oturum bulunamadı. Sağ üstten bir müşteri hesabı seç." };
  }
  if (user.role !== "CUSTOMER") {
    return {
      message:
        "Sipariş yalnızca müşteri rolüyle verilebilir. Sağ üstteki menüden Müşteri'ye geç.",
    };
  }

  const cart = await getCartDetail();
  if (cart.items.length === 0) redirect("/sepet");

  const recipientName = required(formData.get("recipientName"));
  const recipientPhone = required(formData.get("recipientPhone"));
  const deliveryCity = required(formData.get("deliveryCity"));
  const deliveryAddress = required(formData.get("deliveryAddress"));
  const deliveryDateRaw = required(formData.get("deliveryDate"));
  const deliverySlot = required(formData.get("deliverySlot"));
  const giftNote = required(formData.get("giftNote"));

  const errors: Record<string, string> = {};
  if (recipientName.length < 3) errors.recipientName = "Alıcının adını yaz.";
  if (recipientPhone.replace(/\D/g, "").length < 10)
    errors.recipientPhone = "Geçerli bir telefon numarası gir.";
  if (!deliveryCity) errors.deliveryCity = "Teslimat şehrini seç.";
  if (deliveryAddress.length < 10)
    errors.deliveryAddress = "Adresi mahalle ve kapı numarasıyla birlikte yaz.";
  if (!deliveryDateRaw) errors.deliveryDate = "Teslimat tarihi seç.";
  if (!DELIVERY_SLOTS.includes(deliverySlot as (typeof DELIVERY_SLOTS)[number]))
    errors.deliverySlot = "Teslimat saati seç.";

  if (Object.keys(errors).length > 0) {
    return { errors, message: "Eksik alanlar var, aşağıda işaretledik." };
  }

  const order = await createOrderFromCart(
    {
      customerId: user.id,
      recipientName,
      recipientPhone,
      deliveryCity,
      deliveryAddress,
      giftNote: giftNote || null,
      deliveryDate: new Date(`${deliveryDateRaw}T12:00:00`),
      deliverySlot,
    },
    cart.items,
  );

  await writeCart([]);
  revalidatePath("/", "layout");
  redirect(`/odeme/${order.orderNo}`);
}

/** Sahte 3D Secure sonucu. Demo'da hem başarılı hem başarısız gösterilebilsin. */
export async function confirmPayment(orderNo: string, success: boolean) {
  await settlePayment(orderNo, success);
  revalidatePath("/", "layout");

  if (success) redirect(`/siparis/${orderNo}?yeni=1`);
  redirect(`/odeme/${orderNo}?hata=1`);
}
