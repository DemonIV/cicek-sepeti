"use client";

import { useActionState, useState } from "react";
import { placeOrder, type CheckoutState } from "@/app/actions/checkout";
import { GiftNoteField } from "@/components/ui/GiftNote";
import { Icon } from "@/components/ui/Icon";

export type SavedAddress = {
  id: string;
  title: string;
  city: string;
  district: string;
  fullAddress: string;
};

export function CheckoutForm({
  addresses,
  cities,
  slots,
  customer,
  defaultDate,
  minDate,
}: {
  addresses: SavedAddress[];
  cities: readonly string[];
  slots: readonly string[];
  customer: { name: string; phone: string | null };
  defaultDate: string;
  minDate: string;
}) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(
    placeOrder,
    {},
  );

  const [city, setCity] = useState(addresses[0]?.city ?? cities[0]);
  const [address, setAddress] = useState(
    addresses[0]
      ? `${addresses[0].district} — ${addresses[0].fullAddress}`
      : "",
  );
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [selfDelivery, setSelfDelivery] = useState(false);

  const toggleSelfDelivery = (checked: boolean) => {
    setSelfDelivery(checked);
    setRecipientName(checked ? customer.name : "");
    setRecipientPhone(checked ? (customer.phone ?? "") : "");
  };

  const applyAddress = (saved: SavedAddress) => {
    setCity(saved.city);
    setAddress(`${saved.district} — ${saved.fullAddress}`);
  };

  const error = (field: string) => state.errors?.[field];

  return (
    <form action={action} className="space-y-8">
      {state.message && (
        <p className="rounded-md border border-[#f2c6c2] bg-[#fbe0dd] px-4 py-3 text-[13px] font-medium text-[#9c2f2a]">
          {state.message}
        </p>
      )}

      {/* ------------------------------- Alıcı ------------------------------- */}
      <section className="card card-pad">
        <div className="flex items-center gap-2.5">
          <Icon name="user" size={17} className="text-plum-500" />
          <h2 className="text-base font-semibold">Çiçeği kim alacak?</h2>
        </div>
        <p className="mt-1 text-[13px] text-muted">
          Kurye bu isim ve numarayla iletişim kurar.
        </p>

        <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-md bg-plum-50 px-3 py-2.5">
          <input
            type="checkbox"
            checked={selfDelivery}
            onChange={(event) => toggleSelfDelivery(event.target.checked)}
            className="mt-0.5 accent-[var(--color-plum-700)]"
          />
          <span className="text-[13px] leading-snug text-plum-800">
            Çiçeği ben teslim alacağım — alıcı bilgilerine kendi adımı yaz.
          </span>
        </label>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Alıcının adı soyadı" error={error("recipientName")}>
            <input
              name="recipientName"
              className="field"
              placeholder="Örn. Elif Tunç"
              value={recipientName}
              onChange={(event) => setRecipientName(event.target.value)}
            />
          </Field>

          <Field label="Alıcının telefonu" error={error("recipientPhone")}>
            <input
              name="recipientPhone"
              className="field"
              inputMode="tel"
              placeholder="05XX XXX XX XX"
              value={recipientPhone}
              onChange={(event) => setRecipientPhone(event.target.value)}
            />
          </Field>
        </div>
      </section>

      {/* ------------------------------- Adres ------------------------------- */}
      <section className="card card-pad">
        <div className="flex items-center gap-2.5">
          <Icon name="pin" size={17} className="text-plum-500" />
          <h2 className="text-base font-semibold">Teslimat adresi</h2>
        </div>

        {addresses.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {addresses.map((saved) => (
              <button
                key={saved.id}
                type="button"
                onClick={() => applyAddress(saved)}
                className="rounded-md border border-line bg-surface px-3 py-1.5 text-[12.5px] text-plum-800 transition-colors hover:border-plum-400 hover:bg-plum-50"
              >
                <span className="font-semibold">{saved.title}</span>
                <span className="text-muted"> · {saved.district}</span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 grid gap-4">
          <Field label="Şehir" error={error("deliveryCity")}>
            <select
              name="deliveryCity"
              className="field"
              value={city}
              onChange={(event) => setCity(event.target.value)}
            >
              {cities.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Açık adres"
            error={error("deliveryAddress")}
            hint="Mahalle, cadde, bina ve daire numarası"
          >
            <textarea
              name="deliveryAddress"
              rows={3}
              className="field"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Caferağa Mah. Moda Cad. No:42 D:7"
            />
          </Field>
        </div>
      </section>

      {/* ------------------------------ Zamanlama ---------------------------- */}
      <section className="card card-pad">
        <div className="flex items-center gap-2.5">
          <Icon name="clock" size={17} className="text-plum-500" />
          <h2 className="text-base font-semibold">Ne zaman teslim edilsin?</h2>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Teslimat tarihi" error={error("deliveryDate")}>
            <input
              type="date"
              name="deliveryDate"
              className="field"
              defaultValue={defaultDate}
              min={minDate}
            />
          </Field>

          <Field label="Teslimat saati" error={error("deliverySlot")}>
            <select
              name="deliverySlot"
              className="field"
              defaultValue={slots[1]}
            >
              {slots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      {/* ----------------------------- Hediye notu --------------------------- */}
      <section>
        <div className="mb-4 flex items-center gap-2.5">
          <Icon name="tag" size={17} className="text-plum-500" />
          <h2 className="text-base font-semibold">Karta ne yazalım?</h2>
        </div>
        <GiftNoteField />
      </section>

      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary btn-lg btn-block"
      >
        {pending ? "Sipariş oluşturuluyor…" : "Ödeme adımına geç"}
        <Icon name="arrow-right" size={16} />
      </button>
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
