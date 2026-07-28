"use client";

import { useState, useTransition } from "react";
import { updateDelivery } from "@/app/actions/courier";
import { ACTION_LABEL, type OrderStatus } from "@/lib/order-status";
import { Icon } from "@/components/ui/Icon";

export function CourierActions({
  orderId,
  actions,
  block = false,
}: {
  orderId: string;
  actions: OrderStatus[];
  block?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<OrderStatus | null>(null);

  if (actions.length === 0) {
    return (
      <span className="text-[12px] text-faint">Bu teslimat tamamlandı</span>
    );
  }

  const run = (target: OrderStatus) => {
    setError(null);
    startTransition(async () => {
      try {
        await updateDelivery(orderId, target);
        setConfirming(null);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "İşlem yapılamadı.");
      }
    });
  };

  return (
    <div className={block ? "space-y-2" : "flex flex-wrap items-center gap-2"}>
      {actions.map((target, index) => {
        const isFinalStep = target === "TESLIM_EDILDI";

        if (isFinalStep && confirming === target) {
          return (
            <div
              key={target}
              className="flex flex-wrap items-center gap-2 rounded-md border border-plum-200 bg-plum-50 px-3 py-2.5"
            >
              <span className="text-[12.5px] font-medium text-plum-900">
                Çiçeği alıcıya teslim ettin mi?
              </span>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(target)}
                className="btn btn-primary btn-sm"
              >
                {pending ? "Kaydediliyor…" : "Evet, teslim ettim"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(null)}
                className="btn btn-ghost btn-sm"
              >
                Vazgeç
              </button>
            </div>
          );
        }

        return (
          <button
            key={target}
            type="button"
            disabled={pending}
            onClick={() => (isFinalStep ? setConfirming(target) : run(target))}
            className={`btn ${index === 0 ? "btn-primary" : "btn-outline"} ${
              block ? "btn-block btn-lg" : "btn-sm"
            }`}
          >
            {isFinalStep && <Icon name="check" size={16} />}
            {ACTION_LABEL[target]}
          </button>
        );
      })}

      {error && (
        <p className="text-[12px] font-medium text-[#9c2f2a]">{error}</p>
      )}
    </div>
  );
}
