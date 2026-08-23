import "server-only";

/**
 * Denetim izi (madde 20).
 *
 * Üç kişi aynı admin paneline kendi ismiyle giriyor. Kimin neyi değiştirdiği
 * kayıt altına alınmazsa "komisyonu kim düşürmüş?" sorusunun cevabı olmaz.
 * Yetki değiştiren her admin eylemi buradan geçer.
 */

import { db } from "./db";
import type { SessionUser } from "./auth";

export type AuditAction =
  | "seller.approve"
  | "seller.reject"
  | "seller.commission"
  | "seller.quota"
  | "seller.pause"
  | "seller.resume"
  | "seller.area"
  | "seller.manager"
  | "seller.score"
  | "order.courier"
  | "order.status"
  | "order.reminder"
  | "product.visibility"
  | "product.update"
  | "product.create"
  | "invoice.approve"
  | "invoice.reject"
  | "invoice.upload"
  | "productRequest.approve"
  | "productRequest.reject";

export const AUDIT_ACTION_LABEL: Record<AuditAction, string> = {
  "seller.approve": "Bayi onayı",
  "seller.reject": "Bayi reddi",
  "seller.commission": "Komisyon oranı",
  "seller.quota": "Kota ayarı",
  "seller.pause": "Sipariş alımı durduruldu",
  "seller.resume": "Sipariş alımı açıldı",
  "seller.area": "Bölge eşleşmesi",
  "seller.manager": "Sorumlu ataması",
  "seller.score": "Puan düzeltmesi",
  "order.courier": "Kurye atama",
  "order.status": "Sipariş durumu",
  "order.reminder": "Ödeme hatırlatma",
  "product.visibility": "Ürün yayını",
  "product.update": "Ürün güncelleme",
  "product.create": "Ürün ekleme",
  "invoice.approve": "Fatura onayı",
  "invoice.reject": "Fatura reddi",
  "invoice.upload": "Fatura yükleme",
  "productRequest.approve": "Ürün başvurusu onayı",
  "productRequest.reject": "Ürün başvurusu reddi",
};

export async function logAudit({
  actor,
  action,
  summary,
  entity,
  entityId,
}: {
  actor: Pick<SessionUser, "id" | "name" | "role">;
  action: AuditAction;
  summary: string;
  entity: string;
  entityId?: string;
}) {
  await db.auditLog.create({
    data: {
      userId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action,
      summary,
      entity,
      entityId: entityId ?? null,
    },
  });
}
