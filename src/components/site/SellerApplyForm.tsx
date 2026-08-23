"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  submitSellerApplication,
  type ApplyFormState,
} from "@/app/actions/apply";
import { CITIES } from "@/lib/enums";
import { Icon } from "@/components/ui/Icon";

/**
 * Vitrindeki satıcı başvuru formu. Gönderilen kayıt admin panelindeki
 * "Satıcı başvuruları" ekranına düşer; onaya kadar mağaza vitrinde görünmez.
 */
export function SellerApplyForm() {
  const [state, formAction, pending] = useActionState<ApplyFormState, FormData>(
    submitSellerApplication,
    {},
  );

  const error = (field: string) => state.errors?.[field];

  if (state.ok) {
    return (
      <div className="card card-pad space-y-4 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-fern-100 text-fern-700">
          <Icon name="check" size={22} />
        </span>
        <h2 className="font-display text-[1.4rem] leading-tight text-plum-950">
          Başvurun alındı
        </h2>
        <p className="mx-auto max-w-md text-[13.5px] leading-relaxed text-muted">
          <strong className="text-plum-900">{state.storeName}</strong> için
          başvurun operasyon ekibine iletildi. Mağaza künyeni inceleyip hizmet
          bölgelerini ve komisyon oranını belirledikten sonra sana dönecekler.
        </p>
        <p className="mx-auto max-w-md rounded-md bg-plum-50 px-4 py-3 text-[12.5px] leading-relaxed text-plum-800">
          Demo ipucu: rol değiştiriciden <strong>Admin</strong> hesabına geçip{" "}
          <Link href="/admin/basvurular" className="link-underline font-semibold">
            Satıcı başvuruları
          </Link>{" "}
          ekranında bu başvuruyu görebilir, onaylayabilirsin.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="card card-pad space-y-5">
      {state.message && (
        <p className="rounded-md border border-[#f2c6c2] bg-[#fbe0dd] px-4 py-3 text-[13px] font-medium text-[#9c2f2a]">
          {state.message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mağaza adı" error={error("storeName")}>
          <input name="storeName" className="field" placeholder="Örn. Lale Çiçekçilik" />
        </Field>
        <Field label="Yetkili adı soyadı" error={error("ownerName")}>
          <input name="ownerName" className="field" placeholder="Ad Soyad" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="E-posta" error={error("email")}>
          <input
            name="email"
            type="email"
            className="field"
            placeholder="magaza@ornek.com"
          />
        </Field>
        <Field label="Telefon" error={error("phone")}>
          <input
            name="phone"
            className="field"
            placeholder="0532 000 00 00"
            inputMode="tel"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Şehir" error={error("city")}>
          <select name="city" defaultValue="" className="field">
            <option value="">Seç…</option>
            {CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </Field>
        <Field label="İlçe" error={error("district")}>
          <input name="district" className="field" placeholder="Örn. Kadıköy" />
        </Field>
      </div>

      <Field
        label="Mağazanı anlat"
        error={error("about")}
        hint="Kaç yıldır çiçekçilik yapıyorsun, günde kaç sipariş hazırlayabilirsin, hangi semtlere yetişebilirsin?"
      >
        <textarea
          name="about"
          rows={4}
          className="field"
          placeholder="2009'dan beri Kadıköy'de atölyemiz var. Günde 25 buket hazırlayabiliyoruz; Moda, Caferağa ve Göztepe'ye kendi kuryemizle yetişiyoruz."
        />
      </Field>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Gönderiliyor…" : "Başvuruyu gönder"}
        </button>
        <p className="text-[11.5px] leading-relaxed text-faint">
          Demo notu: gerçek sistemde vergi levhası, IBAN ve sözleşme onayı da
          istenir.
        </p>
      </div>
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
