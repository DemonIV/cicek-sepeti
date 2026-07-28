import type { Tone } from "@/lib/enums";
import {
  DELIVERY_STATUS_META,
  PAYMENT_STATUS_META,
  SELLER_STATUS_META,
  type DeliveryStatus,
  type PaymentStatus,
  type SellerStatus,
} from "@/lib/enums";
import { ORDER_STATUS_META, type OrderStatus } from "@/lib/order-status";

export function Badge({
  tone = "neutral",
  dot = false,
  children,
  className = "",
}: {
  tone?: Tone;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`badge tone-${tone} ${className}`}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  );
}

export function OrderStatusBadge({ status }: { status: string }) {
  const meta = ORDER_STATUS_META[status as OrderStatus];
  if (!meta) return null;
  return (
    <Badge tone={meta.tone} dot>
      {meta.label}
    </Badge>
  );
}

export function DeliveryStatusBadge({ status }: { status: string }) {
  const meta = DELIVERY_STATUS_META[status as DeliveryStatus];
  if (!meta) return null;
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export function SellerStatusBadge({ status }: { status: string }) {
  const meta = SELLER_STATUS_META[status as SellerStatus];
  if (!meta) return null;
  return (
    <Badge tone={meta.tone} dot>
      {meta.label}
    </Badge>
  );
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const meta = PAYMENT_STATUS_META[status as PaymentStatus];
  if (!meta) return null;
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
