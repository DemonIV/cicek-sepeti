"use client";

import { useState, useTransition } from "react";
import { setStockClosed } from "@/app/actions/seller";
import { Icon } from "@/components/ui/Icon";

/**
 * Satıcının ürün üzerindeki tek yetkisi (madde 4): stoğu kapatmak ve açmak.
 *
 * Ürün adı, fiyatı, görseli ve açıklaması operasyon ekibindedir; bu yüzden
 * satır üzerinde düzenleme, silme veya yayından kaldırma düğmesi yoktur.
 */
export function StockToggle({
  productId,
  closed,
}: {
  productId: string;
  closed: boolean;
}) {
  const [value, setValue] = useState(closed);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    const next = !value;
    setValue(next);
    startTransition(() => setStockClosed(productId, next));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={value}
      className={`btn btn-sm gap-2 ${value ? "btn-primary" : "btn-outline"}`}
    >
      <Icon name={value ? "check" : "close"} size={14} />
      {pending ? "…" : value ? "Stoğu aç" : "Stoğu kapat"}
    </button>
  );
}
