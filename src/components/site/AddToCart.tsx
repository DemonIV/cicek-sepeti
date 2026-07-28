"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { addToCart } from "@/app/actions/cart";
import { Icon } from "@/components/ui/Icon";

export function AddToCart({
  productId,
  stock,
}: {
  productId: string;
  stock: number;
}) {
  const [quantity, setQuantity] = useState(1);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null,
  );

  if (stock <= 0) {
    return (
      <div className="rounded-lg border border-line bg-plum-50 px-4 py-3.5">
        <p className="text-sm font-semibold text-plum-900">
          Bu ürün şu an tükendi
        </p>
        <p className="mt-1 text-[13px] text-muted">
          Aynı kategoriden benzer aranjmanlara göz atabilirsin.
        </p>
      </div>
    );
  }

  const max = Math.min(stock, 10);

  const submit = () => {
    setResult(null);
    startTransition(async () => {
      setResult(await addToCart(productId, quantity));
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-md border border-line-strong bg-surface">
          <StepButton
            label="Adedi azalt"
            disabled={quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            −
          </StepButton>
          <span className="tabular w-10 text-center text-sm font-semibold">
            {quantity}
          </span>
          <StepButton
            label="Adedi artır"
            disabled={quantity >= max}
            onClick={() => setQuantity((q) => Math.min(max, q + 1))}
          >
            +
          </StepButton>
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="btn btn-primary btn-lg flex-1 sm:flex-none"
        >
          <Icon name="cart" size={17} />
          {pending ? "Ekleniyor…" : "Sepete ekle"}
        </button>
      </div>

      {result && (
        <div
          role="status"
          className={`mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md px-3 py-2.5 text-[13px] ${
            result.ok
              ? "bg-plum-50 text-plum-800"
              : "bg-[#fbe0dd] text-[#9c2f2a]"
          }`}
        >
          <span className="font-medium">{result.message}</span>
          {result.ok && (
            <Link
              href="/sepet"
              className="font-semibold underline underline-offset-4"
            >
              Sepete git →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function StepButton({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-10 w-9 items-center justify-center text-lg text-plum-800 transition-colors hover:bg-plum-50 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
