"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  submitProductRequest,
  type ProductRequestFormState,
} from "@/app/actions/seller";
import { ProductImage } from "@/components/ui/ProductImage";
import { Icon } from "@/components/ui/Icon";
import { formatPrice } from "@/lib/format";

/**
 * Bayinin yeni ürün başvurusu.
 *
 * Admin ürün formunun sadeleştirilmiş hâli: fiyat ve içerik girilir ama
 * yayın/öne çıkarma/indirim gibi vitrin kararları burada yoktur — onlar
 * operasyonun işidir. Form gönderildiğinde ürün oluşmaz, başvuru oluşur.
 */
export function ProductRequestForm({
  categories,
  storeName,
  city,
}: {
  categories: { id: string; name: string }[];
  storeName: string;
  city: string;
}) {
  const [state, formAction, pending] = useActionState<
    ProductRequestFormState,
    FormData
  >(submitProductRequest, {});
  const [imageUrl, setImageUrl] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const error = (field: string) => state.errors?.[field];

  if (state.ok) {
    return (
      <div className="card card-pad max-w-xl space-y-4 text-center">
        <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-plum-50 text-plum-700">
          <Icon name="check" size={20} />
        </span>
        <h2 className="text-[17px] font-semibold text-plum-950">
          Başvurun iletildi
        </h2>
        <p className="text-[13px] leading-relaxed text-muted">
          {state.message} Sonucu <strong>Ürünlerim</strong> sayfasındaki
          &ldquo;Başvurularım&rdquo; bölümünden takip edebilirsin.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-1">
          <Link href="/satici/urunler" className="btn btn-primary btn-sm">
            Ürünlerime dön
          </Link>
          <Link
            href="/satici/urunler/basvuru"
            className="btn btn-outline btn-sm"
          >
            Bir ürün daha öner
          </Link>
        </div>
      </div>
    );
  }

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
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="field"
              placeholder="Örn. 11 Kırmızı Gül Buketi"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Kategori" error={error("categoryId")}>
              <select name="categoryId" defaultValue="" className="field">
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
                defaultValue={10}
                className="field tabular"
              />
            </Field>
          </div>

          <Field label="Açıklama" error={error("description")}>
            <textarea
              name="description"
              rows={4}
              className="field"
              placeholder="Neyden hazırlandığını, kaç dal olduğunu ve ambalajı anlat."
            />
          </Field>
        </div>

        <div className="card card-pad space-y-4">
          <div>
            <h2 className="text-[15px] font-semibold text-plum-950">
              Görseller ve video
            </h2>
            <p className="mt-1 text-[12.5px] text-muted">
              Ürün sayfasında en az üç kare görünmesini öneriyoruz. Demo&apos;da
              dosya deposu yok; görsel adresi yapıştırılır.
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
              className="field font-mono text-[12px]"
              placeholder={"https://…\nhttps://…"}
            />
          </Field>

          <Field
            label="Video adresi"
            error={error("videoUrl")}
            hint="Boş bırakılabilir."
          >
            <input
              name="videoUrl"
              className="field font-mono text-[12px]"
              placeholder="/video/…"
            />
          </Field>
        </div>

        <div className="card card-pad">
          <Field
            label="Operasyona notun (isteğe bağlı)"
            hint="Örn. sezonluk ürün, hafta içi hazırlanabiliyor."
          >
            <input name="sellerNote" maxLength={180} className="field" />
          </Field>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={pending} className="btn btn-primary">
            {pending ? "Gönderiliyor…" : "Onaya gönder"}
          </button>
          <Link href="/satici/urunler" className="btn btn-outline">
            Vazgeç
          </Link>
        </div>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-[4.5rem] lg:self-start">
        <div>
          <p className="field-label">Onaylanırsa vitrinde böyle görünecek</p>
          <div className="card overflow-hidden rounded-xl">
            <div className="relative aspect-square bg-plum-50">
              {imageUrl ? (
                <ProductImage src={imageUrl} alt="Ürün önizleme" sizes="320px" />
              ) : null}
            </div>
            <div className="p-3.5">
              <p className="text-[11px] text-muted">
                {storeName} · {city}
              </p>
              <p className="mt-1 line-clamp-2 text-[13.5px] font-semibold leading-snug">
                {name || "Ürün adı"}
              </p>
              <p className="mt-3 tabular font-display text-[1.15rem] font-semibold text-bloom-700">
                {price ? formatPrice(Number(price)) : "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2.5 rounded-lg border border-line bg-surface px-3.5 py-3">
          <Icon name="alert" size={16} className="mt-0.5 flex-none text-plum-400" />
          <p className="text-[11.5px] leading-relaxed text-muted">
            Gönderdiğin ürün <strong>hemen satışa çıkmaz</strong>. Operasyon
            ekibi bilgiyi ve görseli inceleyip onaylar; onaydan sonra fiyat ve
            içerik değişikliği yine operasyondan geçer, sen stoğu açıp
            kapatabilirsin.
          </p>
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
      {hint && !error && <p className="mt-1 text-[11.5px] text-faint">{hint}</p>}
      {error && (
        <p className="mt-1 text-[12px] font-medium text-[#9c2f2a]">{error}</p>
      )}
    </div>
  );
}
