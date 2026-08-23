"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { formatPrice } from "@/lib/format";

export type FilterOption = { value: string; label: string; hint?: string };

export const SORT_OPTIONS: FilterOption[] = [
  { value: "onerilen", label: "Önerilen" },
  { value: "fiyat-artan", label: "Fiyat: düşükten yükseğe" },
  { value: "fiyat-azalan", label: "Fiyat: yüksekten düşüğe" },
  { value: "yeni", label: "En yeniler" },
];

export function CatalogFilters({
  categories,
  occasions,
  sellers,
  priceBounds,
  total,
}: {
  categories: FilterOption[];
  /** Gönderim amacı — "ne için": doğum günü, geçmiş olsun, tebrik… */
  occasions: FilterOption[];
  sellers: FilterOption[];
  priceBounds: { min: number; max: number };
  total: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value === null || value === "") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    startTransition(() =>
      router.push(`/urunler?${next.toString()}`, { scroll: false }),
    );
  };

  const active = {
    kategori: params.get("kategori") ?? "",
    amac: params.get("amac") ?? "",
    satici: params.get("satici") ?? "",
    maxFiyat: params.get("maxFiyat") ?? "",
    sirala: params.get("sirala") ?? "onerilen",
    q: params.get("q") ?? "",
  };

  const hasFilter =
    active.kategori ||
    active.amac ||
    active.satici ||
    active.maxFiyat ||
    active.q;

  return (
    <div
      className={
        pending ? "opacity-60 transition-opacity" : "transition-opacity"
      }
    >
      <div className="flex items-baseline justify-between gap-3 border-b border-line pb-3">
        <p className="text-sm font-semibold text-plum-950">Filtreler</p>
        {hasFilter && (
          <button
            type="button"
            onClick={() => startTransition(() => router.push("/urunler"))}
            className="text-[12px] font-semibold text-bloom-600 hover:underline"
          >
            Temizle
          </button>
        )}
      </div>

      <p className="tabular py-3 text-xs text-muted">
        {total} ürün listeleniyor
      </p>

      <FilterGroup label="Ne için gönderiliyor?">
        <OptionButton
          label="Fark etmez"
          selected={!active.amac}
          onClick={() => update("amac", null)}
        />
        {occasions.map((option) => (
          <OptionButton
            key={option.value}
            label={option.label}
            hint={option.hint}
            selected={active.amac === option.value}
            onClick={() =>
              update("amac", active.amac === option.value ? null : option.value)
            }
          />
        ))}
      </FilterGroup>

      <FilterGroup label="Kategori">
        <OptionButton
          label="Tüm kategoriler"
          selected={!active.kategori}
          onClick={() => update("kategori", null)}
        />
        {categories.map((option) => (
          <OptionButton
            key={option.value}
            label={option.label}
            hint={option.hint}
            selected={active.kategori === option.value}
            onClick={() =>
              update(
                "kategori",
                active.kategori === option.value ? null : option.value,
              )
            }
          />
        ))}
      </FilterGroup>

      <FilterGroup label="Satıcı">
        <OptionButton
          label="Tüm satıcılar"
          selected={!active.satici}
          onClick={() => update("satici", null)}
        />
        {sellers.map((option) => (
          <OptionButton
            key={option.value}
            label={option.label}
            hint={option.hint}
            selected={active.satici === option.value}
            onClick={() =>
              update(
                "satici",
                active.satici === option.value ? null : option.value,
              )
            }
          />
        ))}
      </FilterGroup>

      <FilterGroup label="En yüksek fiyat">
        <div className="px-1 pt-1">
          <input
            type="range"
            min={priceBounds.min}
            max={priceBounds.max}
            step={50}
            defaultValue={active.maxFiyat || priceBounds.max}
            onChange={(event) => update("maxFiyat", event.target.value)}
            className="w-full accent-[var(--color-bloom-600)]"
            aria-label="En yüksek fiyat"
          />
          <div className="tabular mt-1 flex justify-between text-[11px] text-muted">
            <span>{formatPrice(priceBounds.min)}</span>
            <span className="font-semibold text-plum-900">
              {formatPrice(Number(active.maxFiyat || priceBounds.max))}
            </span>
          </div>
        </div>
      </FilterGroup>
    </div>
  );
}

export function SortSelect() {
  const router = useRouter();
  const params = useSearchParams();

  return (
    <label className="flex items-center gap-2 text-xs text-muted">
      <span className="whitespace-nowrap">Sırala</span>
      <select
        className="field py-1.5 text-[13px]"
        value={params.get("sirala") ?? "onerilen"}
        onChange={(event) => {
          const next = new URLSearchParams(params.toString());
          next.set("sirala", event.target.value);
          router.push(`/urunler?${next.toString()}`, { scroll: false });
        }}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-line py-4">
      <p className="field-label mb-2">{label}</p>
      <div className="space-y-0.5">{children}</div>
    </section>
  );
}

function OptionButton({
  label,
  hint,
  selected,
  onClick,
}: {
  label: string;
  hint?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors ${
        selected
          ? "bg-plum-900 font-semibold text-white"
          : "text-plum-800 hover:bg-plum-50"
      }`}
    >
      <span className="truncate">{label}</span>
      {hint && (
        <span
          className={`tabular flex-none text-[11px] ${
            selected ? "text-white/60" : "text-faint"
          }`}
        >
          {hint}
        </span>
      )}
    </button>
  );
}
