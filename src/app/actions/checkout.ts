"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getCartDetail, writeCart } from "@/lib/cart";
import { createOrderFromCart, settlePayment } from "@/lib/orders";
import { DELIVERY_SLOTS } from "@/lib/enums";
import { isDeliverySlotAvailable } from "@/lib/delivery-time";
import { db } from "@/lib/db";

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
  const deliveryDistrict = required(formData.get("deliveryDistrict"));
  const neighborhoodId = required(formData.get("neighborhoodId"));
  const deliveryAddress = required(formData.get("deliveryAddress"));
  const deliveryDateRaw = required(formData.get("deliveryDate"));
  const deliverySlot = required(formData.get("deliverySlot"));
  const giftNote = required(formData.get("giftNote"));
  const senderName = required(formData.get("senderName"));

  const errors: Record<string, string> = {};
  if (recipientName.length < 3) errors.recipientName = "Alıcının adını yaz.";
  if (recipientPhone.replace(/\D/g, "").length < 10)
    errors.recipientPhone = "Geçerli bir telefon numarası gir.";
  if (!deliveryCity) errors.deliveryCity = "Teslimat şehrini seç.";
  if (!deliveryDistrict) errors.deliveryDistrict = "İlçe seç.";
  if (!neighborhoodId) errors.neighborhoodId = "Teslimat mahallesini seç.";
  if (deliveryAddress.length < 8)
    errors.deliveryAddress = "Adresi cadde ve kapı numarasıyla birlikte yaz.";
  if (!deliveryDateRaw) errors.deliveryDate = "Teslimat tarihi seç.";
  if (!DELIVERY_SLOTS.includes(deliverySlot as (typeof DELIVERY_SLOTS)[number]))
    errors.deliverySlot = "Teslimat saati seç.";

  // Aynı gün teslimatın bir kesim saati var (`lib/delivery-time.ts`): 18.00'den
  // sonra bugüne, geçmiş bir saat aralığına sipariş alınmaz.
  if (
    deliveryDateRaw &&
    !errors.deliverySlot &&
    !isDeliverySlotAvailable(deliveryDateRaw, deliverySlot, new Date())
  ) {
    errors.deliverySlot =
      "Bu gün ve saat için sipariş penceresi kapandı. Daha ileri bir zaman seç.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors, message: "Eksik alanlar var, aşağıda işaretledik." };
  }

  // Her ürün her mahalleye gönderilemez (madde 12): sepetteki her mağazanın
  // seçilen mahalleye hizmet vermesi gerekir. Vermeyeni adıyla söyleriz ki
  // müşteri ne yapacağını bilsin.
  const serving = await db.sellerArea.findMany({
    where: {
      neighborhoodId,
      sellerId: { in: [...new Set(cart.items.map((item) => item.sellerId))] },
    },
    select: { sellerId: true },
  });
  const servingIds = new Set(serving.map((row) => row.sellerId));
  const blocked = cart.groups.filter((group) => !servingIds.has(group.sellerId));

  if (blocked.length > 0) {
    const names = blocked.map((group) => group.storeName).join(", ");
    return {
      errors: { neighborhoodId: "Bu mahalleye gönderim yapılamıyor." },
      message: `${names} seçtiğin mahalleye teslimat yapmıyor. Başka bir mahalle seç ya da bu mağazanın ürünlerini sepetten çıkar.`,
    };
  }

  const order = await createOrderFromCart(
    {
      customerId: user.id,
      recipientName,
      recipientPhone,
      deliveryCity,
      deliveryDistrict: deliveryDistrict || null,
      neighborhoodId: neighborhoodId || null,
      deliveryAddress,
      giftNote: giftNote || null,
      // Kutucuk işaretlenmediyse gönderici adı gitmez — kart imzasız kalır.
      senderName: giftNote ? senderName || null : null,
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
