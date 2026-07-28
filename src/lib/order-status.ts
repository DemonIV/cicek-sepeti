/**
 * Sipariş durum makinesi.
 *
 * Sipariş akışının TEK tanımı burasıdır. Satıcı, kurye ve admin panelleri
 * durum değiştirirken hep bu dosyadaki kurallara sorar; hiçbir ekran kendi
 * geçiş mantığını yazmaz.
 *
 *   BEKLEMEDE → ONAYLANDI → HAZIRLANIYOR → YOLDA → TESLIM_EDILDI
 *   (+ IPTAL, teslim edilmemiş her aşamadan çıkılabilir)
 */

import type { Role, Tone } from "./enums";

export const ORDER_STATUSES = [
  "BEKLEMEDE",
  "ONAYLANDI",
  "HAZIRLANIYOR",
  "YOLDA",
  "TESLIM_EDILDI",
  "IPTAL",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** İptal hariç, doğrusal ilerleyen ana akış. Takip çubuğu bunu kullanır. */
export const ORDER_FLOW = [
  "BEKLEMEDE",
  "ONAYLANDI",
  "HAZIRLANIYOR",
  "YOLDA",
  "TESLIM_EDILDI",
] as const satisfies readonly OrderStatus[];

export type OrderFlowStatus = (typeof ORDER_FLOW)[number];

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; tone: Tone; customerLine: string }
> = {
  BEKLEMEDE: {
    label: "Beklemede",
    tone: "amber",
    customerLine: "Siparişini aldık, ödeme onayı bekleniyor.",
  },
  ONAYLANDI: {
    label: "Onaylandı",
    tone: "teal",
    customerLine: "Ödemen alındı, çiçekçiye iletildi.",
  },
  HAZIRLANIYOR: {
    label: "Hazırlanıyor",
    tone: "violet",
    customerLine: "Çiçekçin buketi hazırlıyor.",
  },
  YOLDA: {
    label: "Yolda",
    tone: "bloom",
    customerLine: "Kurye teslimat için yola çıktı.",
  },
  TESLIM_EDILDI: {
    label: "Teslim edildi",
    tone: "leaf",
    customerLine: "Siparişin alıcısına ulaştı.",
  },
  IPTAL: {
    label: "İptal edildi",
    tone: "neutral",
    customerLine: "Bu sipariş iptal edildi.",
  },
};

/** Akıştaki sıra numarası. IPTAL akış dışıdır (-1). */
export function statusRank(status: OrderStatus): number {
  const index = (ORDER_FLOW as readonly string[]).indexOf(status);
  return index;
}

export function isFinal(status: OrderStatus): boolean {
  return status === "TESLIM_EDILDI" || status === "IPTAL";
}

/* ------------------------------- Geçiş kuralı ------------------------------ */

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  BEKLEMEDE: ["ONAYLANDI", "IPTAL"],
  ONAYLANDI: ["HAZIRLANIYOR", "IPTAL"],
  HAZIRLANIYOR: ["YOLDA", "IPTAL"],
  YOLDA: ["TESLIM_EDILDI"],
  TESLIM_EDILDI: [],
  IPTAL: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/**
 * `from` durumundan `to` durumuna giden ara adımlar dahil yol.
 *
 * Kurye "Teslim edildi" dediğinde sipariş HAZIRLANIYOR'da olabilir; bu durumda
 * ara YOLDA adımı atlanmaz, yol üzerinden yürünür ve her adım için olay kaydı
 * düşülür. Ulaşılamıyorsa null döner.
 */
export function pathTo(from: OrderStatus, to: OrderStatus): OrderStatus[] | null {
  if (from === to) return [];
  if (to === "IPTAL") return canTransition(from, "IPTAL") ? ["IPTAL"] : null;

  const fromRank = statusRank(from);
  const toRank = statusRank(to);
  if (fromRank < 0 || toRank < 0 || toRank <= fromRank) return null;

  return ORDER_FLOW.slice(fromRank + 1, toRank + 1) as OrderStatus[];
}

/* ------------------------------- Rol yetkisi ------------------------------- */

/** Her rolün bir siparişi hangi durumlara taşımaya yetkisi var. */
const ROLE_POWERS: Record<Role, OrderStatus[]> = {
  CUSTOMER: ["IPTAL"],
  SELLER: ["HAZIRLANIYOR", "YOLDA"],
  COURIER: ["YOLDA", "TESLIM_EDILDI"],
  ADMIN: ["ONAYLANDI", "HAZIRLANIYOR", "YOLDA", "TESLIM_EDILDI", "IPTAL"],
};

/**
 * Verili rol, verili durumdaki bir siparişte hangi eylemleri görebilir.
 *
 * Siparişin zaten bulunduğu durum eylem sayılmaz: `pathTo` aynı duruma boş yol
 * döndürür, o yüzden burada ayrıca eleniyor. Aksi hâlde "Hazırlanıyor"daki bir
 * sipariş için "Hazırlamaya başla" butonu görünür kalırdı.
 */
export function allowedActions(role: Role, current: OrderStatus): OrderStatus[] {
  if (isFinal(current)) return [];
  return ROLE_POWERS[role].filter(
    (target) => target !== current && pathTo(current, target) !== null,
  );
}

export function canRoleSet(
  role: Role,
  current: OrderStatus,
  target: OrderStatus,
): boolean {
  return allowedActions(role, current).includes(target);
}

/** Buton etiketi — "ONAYLANDI" değil "Siparişi onayla". */
export const ACTION_LABEL: Record<OrderStatus, string> = {
  BEKLEMEDE: "Beklemeye al",
  ONAYLANDI: "Siparişi onayla",
  HAZIRLANIYOR: "Hazırlamaya başla",
  YOLDA: "Yola çıkar",
  TESLIM_EDILDI: "Teslim edildi olarak işaretle",
  IPTAL: "Siparişi iptal et",
};

/* -------------------------- Çok satıcılı türetme -------------------------- */

/**
 * Sipariş durumu, kalemlerin durumundan türetilir: en geride kalan kalem
 * siparişin durumunu belirler. Böylece iki satıcılı bir siparişte biri
 * hazırlamayı bitirse bile sipariş, diğeri de bitirene kadar "Hazırlanıyor"
 * kalır. Tüm kalemler iptalse sipariş de iptaldir.
 */
export function deriveOrderStatus(itemStatuses: OrderStatus[]): OrderStatus {
  const live = itemStatuses.filter((s) => s !== "IPTAL");
  if (live.length === 0) return "IPTAL";

  return live.reduce((slowest, current) =>
    statusRank(current) < statusRank(slowest) ? current : slowest,
  );
}
