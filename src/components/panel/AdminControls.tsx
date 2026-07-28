"use client";

import { useState, useTransition } from "react";
import {
  adminChangeStatus,
  assignOrderCourier,
  setCommissionRate,
  setProductVisibility,
  setSellerStatus,
} from "@/app/actions/admin";
import { ACTION_LABEL, type OrderStatus } from "@/lib/order-status";
import { Icon } from "@/components/ui/Icon";

/* ---------------------------- Satıcı başvurusu ---------------------------- */

export function SellerApplicationActions({ sellerId }: { sellerId: string }) {
  const [pending, startTransition] = useTransition();
  const [rejecting, setRejecting] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(() => setSellerStatus(sellerId, "APPROVED"))
        }
        className="btn btn-primary btn-sm"
      >
        <Icon name="check" size={15} />
        Onayla
      </button>

      {rejecting ? (
        <>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(() => setSellerStatus(sellerId, "REJECTED"))
            }
            className="btn btn-danger btn-sm"
          >
            Eminim, reddet
          </button>
          <button
            type="button"
            onClick={() => setRejecting(false)}
            className="btn btn-ghost btn-sm"
          >
            Vazgeç
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setRejecting(true)}
          className="btn btn-outline btn-sm"
        >
          Reddet
        </button>
      )}
    </div>
  );
}

export function SellerStatusToggle({
  sellerId,
  status,
}: {
  sellerId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      className="field w-auto py-1.5 text-[12.5px]"
      value={status}
      disabled={pending}
      aria-label="Mağaza durumu"
      onChange={(event) =>
        startTransition(() =>
          setSellerStatus(
            sellerId,
            event.target.value as "PENDING" | "APPROVED" | "REJECTED",
          ),
        )
      }
    >
      <option value="APPROVED">Onaylı</option>
      <option value="PENDING">Onay bekliyor</option>
      <option value="REJECTED">Reddedildi</option>
    </select>
  );
}

/* ------------------------------ Komisyon oranı ---------------------------- */

export function CommissionEditor({
  sellerId,
  rate,
}: {
  sellerId: string;
  rate: number;
}) {
  const [value, setValue] = useState(
    (rate * 100).toFixed(1).replace(/\.0$/, ""),
  );
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const commit = () => {
    const percent = Number(value);
    if (!Number.isFinite(percent)) return;
    setSaved(false);
    startTransition(async () => {
      await setCommissionRate(sellerId, percent);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center rounded-md border border-line-strong bg-surface px-2">
        <span className="text-[12px] text-muted">%</span>
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) =>
            event.key === "Enter" && event.currentTarget.blur()
          }
          aria-label="Komisyon oranı yüzdesi"
          className="tabular w-12 border-0 bg-transparent px-1 py-1.5 text-[12.5px] font-semibold outline-none"
          inputMode="decimal"
        />
      </div>
      {pending && <span className="text-[10px] text-muted">…</span>}
      {saved && (
        <span className="text-[10px] font-bold uppercase tracking-wider text-plum-600">
          Kaydedildi
        </span>
      )}
    </div>
  );
}

/* ------------------------------- Kurye atama ------------------------------ */

export function CourierAssigner({
  orderId,
  courierId,
  couriers,
  compact = false,
}: {
  orderId: string;
  courierId: string | null;
  couriers: { id: string; name: string; city: string | null }[];
  compact?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(courierId ?? "");

  return (
    <select
      className={`field w-auto ${compact ? "py-1.5 text-[12.5px]" : ""}`}
      value={value}
      disabled={pending}
      aria-label="Kurye ata"
      onChange={(event) => {
        const next = event.target.value;
        setValue(next);
        if (next) startTransition(() => assignOrderCourier(orderId, next));
      }}
    >
      <option value="">Kurye seç…</option>
      {couriers.map((courier) => (
        <option key={courier.id} value={courier.id}>
          {courier.name}
          {courier.city ? ` — ${courier.city}` : ""}
        </option>
      ))}
    </select>
  );
}

/* ---------------------------- Sipariş durumu ------------------------------ */

export function AdminOrderActions({
  orderId,
  actions,
  size = "sm",
}: {
  orderId: string;
  actions: OrderStatus[];
  size?: "sm" | "lg";
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (actions.length === 0) {
    return <span className="text-[12px] text-faint">İşlem yok</span>;
  }

  const run = (target: OrderStatus) => {
    setError(null);
    startTransition(async () => {
      try {
        await adminChangeStatus(orderId, target);
        setConfirmCancel(false);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "İşlem yapılamadı.");
      }
    });
  };

  const forward = actions.filter((a) => a !== "IPTAL");
  const canCancel = actions.includes("IPTAL");

  return (
    <div className="flex flex-wrap items-center gap-2">
      {forward.map((target, index) => (
        <button
          key={target}
          type="button"
          disabled={pending}
          onClick={() => run(target)}
          className={`btn ${index === 0 ? "btn-primary" : "btn-outline"} ${
            size === "sm" ? "btn-sm" : ""
          }`}
        >
          {ACTION_LABEL[target]}
        </button>
      ))}

      {canCancel &&
        (confirmCancel ? (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => run("IPTAL")}
              className={`btn btn-danger ${size === "sm" ? "btn-sm" : ""}`}
            >
              Eminim, iptal et
            </button>
            <button
              type="button"
              onClick={() => setConfirmCancel(false)}
              className={`btn btn-ghost ${size === "sm" ? "btn-sm" : ""}`}
            >
              Vazgeç
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmCancel(true)}
            className={`btn btn-ghost ${size === "sm" ? "btn-sm" : ""} text-muted`}
          >
            İptal et
          </button>
        ))}

      {error && (
        <span className="text-[12px] font-medium text-[#9c2f2a]">{error}</span>
      )}
    </div>
  );
}

/* ------------------------------ Ürün görünürlüğü -------------------------- */

export function ProductVisibilityToggle({
  productId,
  isActive,
}: {
  productId: string;
  isActive: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(() => setProductVisibility(productId, !isActive))
      }
      className="btn btn-outline btn-sm"
    >
      {isActive ? "Yayından kaldır" : "Yayına al"}
    </button>
  );
}
