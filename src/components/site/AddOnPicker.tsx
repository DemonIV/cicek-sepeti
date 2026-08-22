"use client";

import { useState, useTransition } from "react";
import { addToCart } from "@/app/actions/cart";
import { ProductImage } from "@/components/ui/ProductImage";
import { Icon } from "@/components/ui/Icon";
import { formatPrice } from "@/lib/format";

export type AddOnOption = {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  kindLabel: string;
  storeName: string;
};

/**
 * Ek ürünler (madde 6): çiçeğin yanına giden çikolata, balon, pasta, vazo, kart.
 *
 * Ürün sayfasında ve sepette aynı bileşen görünür. Ek ürün başka bir mağazadan
 * (Hediye Deposu) çıktığı için sepet doğal olarak çok satıcılı olur — demo'nun
 * ana iddiası burada kendiliğinden gösterilir.
 */
export function AddOnPicker({
  options,
  title = "Yanında ne gitsin?",
  description = "Ek ürünler çiçekle aynı pakette teslim edilir.",
}: {
  options: AddOnOption[];
  title?: string;
  description?: string;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [added, setAdded] = useState<Record<string, string>>({});
  const [, startTransition] = useTransition();

  if (options.length === 0) return null;

  const add = (option: AddOnOption) => {
    setPendingId(option.id);
    startTransition(async () => {
      const result = await addToCart(option.id, 1);
      setAdded((prev) => ({
        ...prev,
        [option.id]: result.ok ? "Sepete eklendi" : result.message,
      }));
      setPendingId(null);
    });
  };

  return (
    <section>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold text-plum-950">{title}</h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
          {options[0]?.storeName}
        </span>
      </div>
      <p className="mt-1 text-[13px] text-muted">{description}</p>

      <div className="scroll-row mt-4 gap-3">
        {options.map((option) => {
          const status = added[option.id];
          return (
            <div
              key={option.id}
              className="card flex w-[10.5rem] flex-col overflow-hidden rounded-xl sm:w-[11.5rem]"
            >
              <div className="relative aspect-square bg-plum-100">
                <ProductImage
                  src={option.imageUrl}
                  alt={option.name}
                  sizes="184px"
                />
                <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.05em] text-plum-800">
                  {option.kindLabel}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-2.5">
                <p className="line-clamp-2 text-[12.5px] font-semibold leading-snug text-plum-950">
                  {option.name}
                </p>
                <p className="tabular mt-1.5 text-[13.5px] font-semibold text-bloom-700">
                  {formatPrice(option.price)}
                </p>

                <button
                  type="button"
                  onClick={() => add(option)}
                  disabled={pendingId === option.id}
                  className="btn btn-outline btn-sm mt-2.5 w-full"
                >
                  <Icon name="plus" size={14} />
                  {pendingId === option.id ? "Ekleniyor…" : "Ekle"}
                </button>

                {status && (
                  <p
                    role="status"
                    className="mt-1.5 text-[11.5px] font-medium text-plum-700"
                  >
                    {status}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
