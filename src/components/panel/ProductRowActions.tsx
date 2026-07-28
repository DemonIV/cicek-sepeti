"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  deleteProduct,
  setProductStock,
  toggleProductActive,
} from "@/app/actions/seller";
import { Icon } from "@/components/ui/Icon";

export function StockEditor({
  productId,
  stock,
}: {
  productId: string;
  stock: number;
}) {
  const [value, setValue] = useState(stock);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const commit = (next: number) => {
    const clamped = Math.max(0, next);
    setValue(clamped);
    setSaved(false);
    startTransition(async () => {
      await setProductStock(productId, clamped);
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
    });
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center rounded-md border border-line-strong bg-surface">
        <button
          type="button"
          aria-label="Stoğu azalt"
          disabled={pending || value <= 0}
          onClick={() => commit(value - 1)}
          className="flex h-7 w-6 items-center justify-center text-plum-700 hover:bg-plum-50 disabled:opacity-30"
        >
          −
        </button>
        <input
          type="number"
          value={value}
          aria-label="Stok adedi"
          onChange={(event) => setValue(Number(event.target.value))}
          onBlur={(event) => commit(Number(event.target.value))}
          className="tabular w-11 border-0 bg-transparent px-0 text-center text-[12.5px] font-semibold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          aria-label="Stoğu artır"
          disabled={pending}
          onClick={() => commit(value + 1)}
          className="flex h-7 w-6 items-center justify-center text-plum-700 hover:bg-plum-50 disabled:opacity-30"
        >
          +
        </button>
      </div>
      {saved && (
        <span className="text-[10px] font-bold uppercase tracking-wider text-plum-600">
          Kaydedildi
        </span>
      )}
    </div>
  );
}

export function ProductActions({
  productId,
  isActive,
}: {
  productId: string;
  isActive: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  return (
    <div className="flex items-center justify-end gap-1">
      {note && <span className="text-[11px] text-muted">{note}</span>}

      <Link
        href={`/satici/urunler/${productId}`}
        className="btn btn-ghost btn-sm"
      >
        Düzenle
      </Link>

      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => toggleProductActive(productId))}
        className="btn btn-ghost btn-sm"
      >
        {isActive ? "Yayından kaldır" : "Yayına al"}
      </button>

      {confirming ? (
        <span className="flex items-center gap-1">
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await deleteProduct(productId);
                if (!result.ok) setNote(result.message);
                setConfirming(false);
              })
            }
            className="btn btn-danger btn-sm"
          >
            Eminim, sil
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="btn btn-ghost btn-sm"
          >
            Vazgeç
          </button>
        </span>
      ) : (
        <button
          type="button"
          aria-label="Ürünü sil"
          onClick={() => setConfirming(true)}
          className="btn btn-ghost btn-sm px-2 text-muted hover:text-[#9c2f2a]"
        >
          <Icon name="trash" size={15} />
        </button>
      )}
    </div>
  );
}
