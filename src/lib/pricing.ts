/**
 * Para hesabı: kargo, sipariş toplamı ve satıcı komisyonu.
 * Bu dosya dışında hiçbir yerde çarpma/çıkarma ile tutar hesaplanmaz.
 */

/** Bu tutarın üzerindeki siparişlerde teslimat ücretsiz. */
export const FREE_SHIPPING_THRESHOLD = 1000;
export const SHIPPING_FEE = 79.9;

export function calculateShipping(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}

export type PricedLine = {
  unitPrice: number;
  quantity: number;
};

export type CommissionedLine = PricedLine & {
  commissionRate: number;
};

export const lineTotal = (line: PricedLine) => round2(line.unitPrice * line.quantity);

/** Platformun bu kalemden aldığı komisyon. */
export const lineCommission = (line: CommissionedLine) =>
  round2(lineTotal(line) * line.commissionRate);

/** Satıcı kazancı = kalem tutarı − (kalem tutarı × komisyon oranı). */
export const lineEarning = (line: CommissionedLine) =>
  round2(lineTotal(line) - lineCommission(line));

export type EarningSummary = {
  gross: number;
  commission: number;
  net: number;
};

export function summarizeEarnings(lines: CommissionedLine[]): EarningSummary {
  const gross = round2(lines.reduce((sum, l) => sum + lineTotal(l), 0));
  const commission = round2(lines.reduce((sum, l) => sum + lineCommission(l), 0));
  return { gross, commission, net: round2(gross - commission) };
}

export type CartTotals = {
  subtotal: number;
  shipping: number;
  total: number;
  itemCount: number;
};

export function cartTotals(lines: PricedLine[]): CartTotals {
  const subtotal = round2(lines.reduce((sum, l) => sum + lineTotal(l), 0));
  const shipping = calculateShipping(subtotal);
  return {
    subtotal,
    shipping,
    total: round2(subtotal + shipping),
    itemCount: lines.reduce((sum, l) => sum + l.quantity, 0),
  };
}

/** Kuruş yuvarlaması — kayan nokta artıklarını temizler. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
