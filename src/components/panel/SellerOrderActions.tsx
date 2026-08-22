"use client";

import { useState, useTransition } from "react";
import { advanceSellerOrder, dispatchSellerOrder } from "@/app/actions/seller";
import { ACTION_LABEL, type OrderStatus } from "@/lib/order-status";
import { Icon } from "@/components/ui/Icon";

/**
 * Satıcının sipariş üzerindeki eylemleri.
 *
 * "Yola çıkar" adımı 21 Ağustos 2026'da **"Arabaya verildi"** oldu (madde 18):
 * bayi siparişi araca teslim ettiğini işaretler, sipariş o anda kuryenin
 * "işlem gören teslimatlar" listesine düşer. Kurye, arabaya verilmemiş bir
 * siparişi almaya gitmez.
 */
export function SellerOrderActions({
  orderId,
  actions,
  canDispatch = false,
  dispatched = false,
  size = "sm",
}: {
  orderId: string;
  actions: OrderStatus[];
  canDispatch?: boolean;
  dispatched?: boolean;
  size?: "sm" | "lg";
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // YOLDA'ya geçiş artık ayrı bir düğmeyle (arabaya verme) yapılır.
  const plainActions = actions.filter((target) => target !== "YOLDA");
  const showDispatch = canDispatch && actions.includes("YOLDA");

  if (plainActions.length === 0 && !showDispatch) {
    return (
      <span className="text-[12px] text-faint">
        {dispatched ? "Arabaya verildi" : "İşlem yok"}
      </span>
    );
  }

  const run = (fn: () => Promise<void>) => {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "İşlem yapılamadı.");
      }
    });
  };

  const buttonSize = size === "sm" ? "btn-sm" : "";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {plainActions.map((target, index) => (
        <button
          key={target}
          type="button"
          disabled={pending}
          onClick={() => run(() => advanceSellerOrder(orderId, target))}
          className={`btn ${index === 0 ? "btn-primary" : "btn-outline"} ${buttonSize}`}
        >
          {index === 0 && <Icon name="check" size={15} />}
          {ACTION_LABEL[target]}
        </button>
      ))}

      {showDispatch && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => dispatchSellerOrder(orderId))}
          className={`btn ${plainActions.length === 0 ? "btn-primary" : "btn-outline"} ${buttonSize}`}
        >
          <Icon name="truck" size={15} />
          Arabaya verildi
        </button>
      )}

      {error && (
        <span className="text-[12px] font-medium text-[#9c2f2a]">{error}</span>
      )}
    </div>
  );
}
