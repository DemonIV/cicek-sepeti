"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { ProductFormState } from "@/app/actions/seller";
import { ProductImage } from "@/components/ui/ProductImage";
import { formatPrice } from "@/lib/format";

export type ProductFormValues = {
  name: string;
  categoryId: string;
  price: number | "";
  stock: number | "";
  imageUrl: string;
  description: string;
  isActive: boolean;
  isFeatured: boolean;
};

export function ProductForm({
  action,
  categories,
  initial,
  submitLabel,
}: {
  action: (
    state: ProductFormState,
    data: FormData,
  ) => Promise<ProductFormState>;
  categories: { id: string; name: string }[];
  initial: ProductFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<
    ProductFormState,
    FormData
  >(action, {});
  const [imageUrl, setImageUrl] = useState(initial.imageUrl);
  const [price, setPrice] = useState<string>(String(initial.price ?? ""));

  const error = (field: string) => state.errors?.[field];

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-5">
        {state.message && (
          <p className="rounded-md border border-[#f2c6c2] bg-[#fbe0dd] px-4 py-3 text-[13px] font-medium text-[#9c2f2a]">
            {state.message}
          </p>
        )}

        <div className="card card-pad space-y-4">
          <Field label="Ürün adı" error={error("name")}>
            <input
              name="name"
              defaultValue={initial.name}
              className="field"
              placeholder="Örn. 11 Kırmızı Gül Buketi"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Kategori" error={error("categoryId")}>
              <select
                name="categoryId"
                defaultValue={initial.categoryId}
                className="field"
              >
                <option value="">Seç…</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Fiyat (TL)" error={error("price")}>
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                className="field tabular"
                placeholder="1290"
              />
            </Field>

            <Field label="Stok adedi" error={error("stock")}>
              <input
                name="stock"
                type="number"
                min="0"
                defaultValue={initial.stock}
                className="field tabular"
                placeholder="20"
              />
            </Field>
          </div>

          <Field
            label="Görsel adresi"
            error={error("imageUrl")}
            hint="Demo'da dosya yükleme yok; görsel bağlantısı yapıştırılır."
          >
            <input
              name="imageUrl"
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              className="field"
              placeholder="https://images.unsplash.com/photo-…"
            />
          </Field>

          <Field label="Açıklama" error={error("description")}>
            <textarea
              name="description"
              rows={4}
              defaultValue={initial.description}
              className="field"
              placeholder="Neyden hazırlandığını, kaç dal olduğunu ve ambalajı anlat."
            />
          </Field>
        </div>

        <div className="card card-pad space-y-3">
          <Checkbox
            name="isActive"
            defaultChecked={initial.isActive}
            label="Vitrinde yayında"
            hint="Kapatırsan ürün müşterilere görünmez, mevcut siparişler etkilenmez."
          />
          <Checkbox
            name="isFeatured"
            defaultChecked={initial.isFeatured}
            label="Ana sayfada öne çıkar"
            hint="Öne çıkanlar bölümünde listelenir."
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={pending} className="btn btn-primary">
            {pending ? "Kaydediliyor…" : submitLabel}
          </button>
          <Link href="/satici/urunler" className="btn btn-outline">
            Vazgeç
          </Link>
        </div>
      </div>

      {/* --------------------------- Canlı önizleme --------------------------- */}
      <aside className="lg:sticky lg:top-[4.5rem] lg:self-start">
        <p className="field-label">Vitrinde böyle görünecek</p>
        <div className="card overflow-hidden">
          <div className="relative aspect-square bg-plum-50">
            {imageUrl ? (
              <ProductImage src={imageUrl} alt="Ürün önizleme" sizes="320px" />
            ) : null}
          </div>
          <div className="p-3.5">
            <p className="text-[11px] text-muted">Mağazan · şehrin</p>
            <p className="mt-1 line-clamp-2 text-[13.5px] font-semibold leading-snug">
              {initial.name || "Ürün adı"}
            </p>
            <p className="tabular mt-3 font-display text-[1.15rem] font-semibold">
              {price ? formatPrice(Number(price)) : "—"}
            </p>
          </div>
        </div>
      </aside>
    </form>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="field-label">{label}</span>
      {children}
      {hint && !error && (
        <p className="mt-1 text-[11.5px] text-faint">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-[12px] font-medium text-[#9c2f2a]">{error}</p>
      )}
    </div>
  );
}

function Checkbox({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 accent-[var(--color-plum-700)]"
      />
      <span>
        <span className="block text-[13px] font-medium text-plum-950">
          {label}
        </span>
        <span className="block text-[11.5px] leading-snug text-muted">
          {hint}
        </span>
      </span>
    </label>
  );
}
