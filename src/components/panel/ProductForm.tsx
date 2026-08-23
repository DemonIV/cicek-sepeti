"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { ProductFormState } from "@/app/actions/admin";
import { ProductImage } from "@/components/ui/ProductImage";
import { formatPrice } from "@/lib/format";

export type ProductFormValues = {
  name: string;
  sellerId: string;
  categoryId: string;
  price: number | "";
  stock: number | "";
  imageUrl: string;
  description: string;
  isActive: boolean;
  isFeatured: boolean;
  isWeeklyPick: boolean;
  discountPrice: number | "";
  discountStartsAt: string;
  discountEndsAt: string;
  videoUrl: string;
  gallery: string;
  /** Seçili gönderim amacı slug'ları. */
  occasions: string[];
};

/**
 * Ürün formu — yalnızca admin panelinde.
 *
 * Satıcı ürüne dokunamaz (madde 4); ürün bilgisi, galerisi ve zamanlı indirimi
 * operasyon ekibi yönetir (madde 23 ve 24).
 */
export function ProductForm({
  action,
  categories,
  sellers,
  occasions,
  initial,
  submitLabel,
}: {
  action: (
    state: ProductFormState,
    data: FormData,
  ) => Promise<ProductFormState>;
  categories: { id: string; name: string }[];
  sellers: { id: string; storeName: string; city: string }[];
  occasions: { slug: string; name: string }[];
  initial: ProductFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<
    ProductFormState,
    FormData
  >(action, {});
  const [imageUrl, setImageUrl] = useState(initial.imageUrl);
  const [price, setPrice] = useState<string>(String(initial.price ?? ""));
  const [discountPrice, setDiscountPrice] = useState<string>(
    String(initial.discountPrice ?? ""),
  );

  const error = (field: string) => state.errors?.[field];
  const hasDiscount = discountPrice.trim() !== "";

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

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Bayi" error={error("sellerId")}>
              <select
                name="sellerId"
                defaultValue={initial.sellerId}
                className="field"
              >
                <option value="">Seç…</option>
                {sellers.map((seller) => (
                  <option key={seller.id} value={seller.id}>
                    {seller.storeName} — {seller.city}
                  </option>
                ))}
              </select>
            </Field>

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
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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

        {/* ------------------------------ Galeri ------------------------------ */}
        <div className="card card-pad space-y-4">
          <div>
            <h2 className="text-[15px] font-semibold text-plum-950">
              Görseller ve video
            </h2>
            <p className="mt-1 text-[12.5px] text-muted">
              Ürün sayfasında en az üç kare görünmesini öneriyoruz. Demo'da
              dosya deposu yok; adres yapıştırılır.
            </p>
          </div>

          <Field label="Ana görsel adresi" error={error("imageUrl")}>
            <input
              name="imageUrl"
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              className="field"
              placeholder="https://images.unsplash.com/photo-…"
            />
          </Field>

          <Field
            label="Ek görseller"
            error={error("gallery")}
            hint="Her satıra bir adres. Ana görselle birlikte galeriyi oluşturur."
          >
            <textarea
              name="gallery"
              rows={3}
              defaultValue={initial.gallery}
              className="field font-mono text-[12px]"
              placeholder={"https://…\nhttps://…"}
            />
          </Field>

          <Field
            label="Video adresi"
            hint="Boş bırakılabilir. Örn. /video/urun-gul-buketi.mp4"
          >
            <input
              name="videoUrl"
              defaultValue={initial.videoUrl}
              className="field font-mono text-[12px]"
              placeholder="/video/…"
            />
          </Field>
        </div>

        {/* --------------------------- Gönderim amacı -------------------------- */}
        <div className="card card-pad space-y-3">
          <div>
            <h2 className="text-[15px] font-semibold text-plum-950">
              Gönderim amacı
            </h2>
            <p className="mt-1 text-[12.5px] text-muted">
              Ürün hangi niyetle aranıyorsa orada çıksın. Kategori ürünün ne
              olduğunu, amaç niçin gönderildiğini söyler.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {occasions.map((occasion) => (
              <label
                key={occasion.slug}
                className="flex cursor-pointer items-center gap-2 text-[13px] text-plum-900"
              >
                <input
                  type="checkbox"
                  name="occasions"
                  value={occasion.slug}
                  defaultChecked={initial.occasions.includes(occasion.slug)}
                  className="accent-[var(--color-plum-700)]"
                />
                {occasion.name}
              </label>
            ))}
          </div>
        </div>

        {/* ------------------------------ İndirim ----------------------------- */}
        <div className="card card-pad space-y-4">
          <div>
            <h2 className="text-[15px] font-semibold text-plum-950">
              Zamanlı indirim
            </h2>
            <p className="mt-1 text-[12.5px] text-muted">
              İndirimli fiyat yalnızca girdiğin aralıkta geçerlidir; aralık
              bitince fiyat kendiliğinden liste fiyatına döner.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="İndirimli fiyat" error={error("discountPrice")}>
              <input
                name="discountPrice"
                type="number"
                step="0.01"
                min="0"
                value={discountPrice}
                onChange={(event) => setDiscountPrice(event.target.value)}
                className="field tabular"
                placeholder="990"
              />
            </Field>

            <Field label="Başlangıç" error={error("discountStartsAt")}>
              <input
                name="discountStartsAt"
                type="datetime-local"
                defaultValue={initial.discountStartsAt}
                disabled={!hasDiscount}
                className="field"
              />
            </Field>

            <Field label="Bitiş" error={error("discountEndsAt")}>
              <input
                name="discountEndsAt"
                type="datetime-local"
                defaultValue={initial.discountEndsAt}
                disabled={!hasDiscount}
                className="field"
              />
            </Field>
          </div>
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
          <Checkbox
            name="isWeeklyPick"
            defaultChecked={initial.isWeeklyPick}
            label="Haftanın ürünü"
            hint="Ana sayfadaki geniş haftanın ürünü bandında gösterilir."
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={pending} className="btn btn-primary">
            {pending ? "Kaydediliyor…" : submitLabel}
          </button>
          <Link href="/admin/urunler" className="btn btn-outline">
            Vazgeç
          </Link>
        </div>
      </div>

      {/* --------------------------- Canlı önizleme --------------------------- */}
      <aside className="lg:sticky lg:top-[4.5rem] lg:self-start">
        <p className="field-label">Vitrinde böyle görünecek</p>
        <div className="card overflow-hidden rounded-xl">
          <div className="relative aspect-square bg-plum-50">
            {imageUrl ? (
              <ProductImage src={imageUrl} alt="Ürün önizleme" sizes="320px" />
            ) : null}
          </div>
          <div className="p-3.5">
            <p className="text-[11px] text-muted">Mağaza · şehir</p>
            <p className="mt-1 line-clamp-2 text-[13.5px] font-semibold leading-snug">
              {initial.name || "Ürün adı"}
            </p>
            <p className="mt-3 flex items-baseline gap-2">
              <span className="tabular font-display text-[1.15rem] font-semibold text-bloom-700">
                {hasDiscount && Number(discountPrice) > 0
                  ? formatPrice(Number(discountPrice))
                  : price
                    ? formatPrice(Number(price))
                    : "—"}
              </span>
              {hasDiscount && price && (
                <span className="tabular text-[12px] text-faint line-through">
                  {formatPrice(Number(price))}
                </span>
              )}
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
