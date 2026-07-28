"use client";

import { useState, useTransition } from "react";
import { advanceSellerOrder } from "@/app/actions/seller";
import { ACTION_LABEL, type OrderStatus } from "@/lib/order-status";
import { Icon } from "@/components/ui/Icon";

export function SellerOrderActions({
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

  if (actions.length === 0) {
    return <span className="text-[12px] text-faint">İşlem yok</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map((target, index) => (
        <button
          key={target}
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              try {
                await advanceSellerOrder(orderId, target);
              } catch (cause) {
                setError(
                  cause instanceof Error ? cause.message : "İşlem yapılamadı.",
                );
              }
            });
          }}
          className={`btn ${index === 0 ? "btn-primary" : "btn-outline"} ${
            size === "sm" ? "btn-sm" : ""
          }`}
        >
          {index === 0 && <Icon name="check" size={15} />}
          {ACTION_LABEL[target]}
        </button>
      ))}

      {error && (
        <span className="text-[12px] font-medium text-[#9c2f2a]">{error}</span>
      )}
    </div>
  );
}
