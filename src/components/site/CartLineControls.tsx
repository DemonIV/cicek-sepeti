"use client";

import { useTransition } from "react";
import { removeFromCart, setCartQuantity } from "@/app/actions/cart";
import { Icon } from "@/components/ui/Icon";

export function CartLineControls({
  productId,
  quantity,
  stock,
}: {
  productId: string;
  quantity: number;
  stock: number;
}) {
  const [pending, startTransition] = useTransition();
  const max = Math.min(stock, 10);

  const change = (next: number) =>
    startTransition(() => setCartQuantity(productId, next));

  return (
    <div className={`flex items-center gap-3 ${pending ? "opacity-50" : ""}`}>
      <div className="flex items-center rounded-md border border-line-strong bg-surface">
        <button
          type="button"
          aria-label="Adedi azalt"
          disabled={pending || quantity <= 1}
          onClick={() => change(quantity - 1)}
          className="flex h-9 w-8 items-center justify-center text-plum-800 transition-colors hover:bg-plum-50 disabled:opacity-30"
        >
          −
        </button>
        <span className="tabular w-8 text-center text-[13px] font-semibold">
          {quantity}
        </span>
        <button
          type="button"
          aria-label="Adedi artır"
          disabled={pending || quantity >= max}
          onClick={() => change(quantity + 1)}
          className="flex h-9 w-8 items-center justify-center text-plum-800 transition-colors hover:bg-plum-50 disabled:opacity-30"
        >
          +
        </button>
      </div>

      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => removeFromCart(productId))}
        className="flex items-center gap-1.5 text-[12px] font-medium text-muted transition-colors hover:text-[#9c2f2a]"
      >
        <Icon name="trash" size={14} />
        Kaldır
      </button>
    </div>
  );
}
