"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { CITIES } from "@/lib/enums";
import { slugify } from "@/lib/format";

/**
 * Vitrinden satıcı başvurusu (23 Ağustos isteği).
 *
 * Admin panelindeki "Satıcı başvuruları" ekranı bugüne dek seed verisiyle
 * doluydu; başvurunun **nereden geldiği** demoda boşluktaydı. Bu form o halkayı
 * kapatır: çiçekçi vitrinden başvurur, kayıt `PENDING` mağaza olarak düşer,
 * operasyon onaylayınca satıcı paneli açılır.
 *
 * Demo notu: gerçek sistemde vergi levhası, IBAN ve sözleşme onayı istenir;
 * burada mağaza künyesi için gereken en az bilgi alınır.
 */

export type ApplyFormState = {
  errors?: Record<string, string>;
  message?: string;
  ok?: boolean;
  storeName?: string;
};

const text = (data: FormData, key: string) => String(data.get(key) ?? "").trim();

export async function submitSellerApplication(
  _prev: ApplyFormState,
  data: FormData,
): Promise<ApplyFormState> {
  const storeName = text(data, "storeName");
  const ownerName = text(data, "ownerName");
  const email = text(data, "email").toLocaleLowerCase("tr");
  const phone = text(data, "phone");
  const city = text(data, "city");
  const district = text(data, "district");
  const about = text(data, "about");

  const errors: Record<string, string> = {};
  if (storeName.length < 3) errors.storeName = "Mağaza adını yaz.";
  if (ownerName.length < 3) errors.ownerName = "Yetkilinin adını yaz.";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    errors.email = "Geçerli bir e-posta gir.";
  if (phone.replace(/\D/g, "").length < 10)
    errors.phone = "Telefonu eksiksiz gir.";
  if (!CITIES.includes(city as (typeof CITIES)[number]))
    errors.city = "Şehir seç.";
  if (district.length < 2) errors.district = "İlçeni yaz.";
  if (about.length < 20)
    errors.about = "Mağazanı birkaç cümleyle anlat (en az 20 karakter).";

  if (Object.keys(errors).length) {
    return { errors, message: "Eksik alanlar var." };
  }

  if (await db.user.findUnique({ where: { email } })) {
    return {
      errors: { email: "Bu e-posta ile zaten bir kayıt var." },
      message: "Bu e-posta kullanılıyor.",
    };
  }

  let slug = slugify(storeName);
  if (await db.seller.findUnique({ where: { slug } })) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }

  await db.user.create({
    data: {
      name: ownerName,
      email,
      phone,
      role: "SELLER",
      seller: {
        create: {
          storeName,
          slug,
          city,
          district,
          phone,
          about,
          status: "PENDING",
          // Komisyon oranı onay sırasında operasyon tarafından ayarlanır;
          // varsayılan şema değeriyle başlar.
        },
      },
    },
  });

  revalidatePath("/admin", "layout");

  return {
    ok: true,
    storeName,
    message: "Başvurun alındı. Operasyon ekibi inceledikten sonra dönüş yapacak.",
  };
}
