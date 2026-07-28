/**
 * Uygulamadaki tüm sabit değer kümeleri.
 *
 * SQLite Prisma enum desteklemediği için veritabanında bu alanlar String tutulur.
 * Tek doğruluk kaynağı burasıdır — ekranlarda elle string yazılmaz.
 */

/* ---------------------------------- Rol ---------------------------------- */

export const ROLES = ["CUSTOMER", "SELLER", "COURIER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABEL: Record<Role, string> = {
  CUSTOMER: "Müşteri",
  SELLER: "Satıcı",
  COURIER: "Kurye",
  ADMIN: "Admin",
};

export const ROLE_DESCRIPTION: Record<Role, string> = {
  CUSTOMER: "Alışveriş yapan son kullanıcı",
  SELLER: "Ürünlerini ve siparişlerini yöneten çiçekçi",
  COURIER: "Teslimatları taşıyan kurye",
  ADMIN: "Platformu yöneten operasyon ekibi",
};

/** Rol değiştirildiğinde gidilecek varsayılan sayfa. */
export const ROLE_HOME: Record<Role, string> = {
  CUSTOMER: "/",
  SELLER: "/satici",
  COURIER: "/kurye",
  ADMIN: "/admin",
};

/* ------------------------------ Satıcı durumu ----------------------------- */

export const SELLER_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type SellerStatus = (typeof SELLER_STATUSES)[number];

export const SELLER_STATUS_META: Record<
  SellerStatus,
  { label: string; tone: Tone }
> = {
  PENDING: { label: "Onay bekliyor", tone: "amber" },
  APPROVED: { label: "Onaylı", tone: "leaf" },
  REJECTED: { label: "Reddedildi", tone: "neutral" },
};

/* ----------------------------- Teslimat durumu ---------------------------- */

export const DELIVERY_STATUSES = [
  "ATANMADI",
  "ATANDI",
  "YOLDA",
  "TESLIM_EDILDI",
] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export const DELIVERY_STATUS_META: Record<
  DeliveryStatus,
  { label: string; tone: Tone }
> = {
  ATANMADI: { label: "Kurye atanmadı", tone: "neutral" },
  ATANDI: { label: "Kurye atandı", tone: "teal" },
  YOLDA: { label: "Yolda", tone: "bloom" },
  TESLIM_EDILDI: { label: "Teslim edildi", tone: "leaf" },
};

/* ------------------------------ Ödeme durumu ------------------------------ */

export const PAYMENT_STATUSES = ["BEKLIYOR", "ODENDI", "BASARISIZ"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_META: Record<
  PaymentStatus,
  { label: string; tone: Tone }
> = {
  BEKLIYOR: { label: "Ödeme bekleniyor", tone: "amber" },
  ODENDI: { label: "Ödendi", tone: "leaf" },
  BASARISIZ: { label: "Ödeme başarısız", tone: "danger" },
};

/* -------------------------------- Rozet tonu ------------------------------- */

/** Rozet ve durum göstergelerinin renk tonu. globals.css'teki `.tone-*` ile eşleşir. */
export type Tone =
  | "leaf"
  | "bloom"
  | "amber"
  | "teal"
  | "violet"
  | "neutral"
  | "danger";

/* --------------------------------- Şehirler -------------------------------- */

export const CITIES = [
  "İstanbul",
  "Ankara",
  "İzmir",
  "Bursa",
  "Antalya",
  "Kayseri",
] as const;

export const DELIVERY_SLOTS = [
  "09:00 - 12:00",
  "12:00 - 15:00",
  "15:00 - 18:00",
  "18:00 - 21:00",
] as const;
