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

export type AreaTree = {
  city: string;
  districts: {
    district: string;
    neighborhoods: { id: string; name: string; sellerCount: number }[];
  }[];
}[];

export function CheckoutForm({
  addresses,
  areaTree,
  selectedAreaId,
  slots,
  defaultSlot,
  customer,
  defaultDate,
  minDate,
}: {
  addresses: SavedAddress[];
  /** Şehir → ilçe → mahalle ağacı; teslimat bölgesi buradan seçilir. */
  areaTree: AreaTree;
  selectedAreaId: string | null;
  slots: readonly string[];
  /** Ürün sayfasında seçilen saat aralığı — varsa ön dolu gelir. */
  defaultSlot?: string;
  customer: { name: string; phone: string | null };
  defaultDate: string;
  minDate: string;
}) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(
    placeOrder,
    {},
  );

  // Başlangıç bölgesi: başlıktan seçilmiş mahalle varsa o, yoksa müşterinin
  // kayıtlı adresine en yakın eşleşme, o da yoksa ilk mahalle.
  const initial = findInitialArea(areaTree, selectedAreaId, addresses[0]);
  const [city, setCity] = useState(initial.city);
  const [district, setDistrict] = useState(initial.district);
  const [neighborhoodId, setNeighborhoodId] = useState(initial.neighborhoodId);
  const [address, setAddress] = useState(
    addresses[0] ? addresses[0].fullAddress : "",
  );

  const districts =
    areaTree.find((entry) => entry.city === city)?.districts ?? [];
  const neighborhoods =
    districts.find((entry) => entry.district === district)?.neighborhoods ?? [];
  const neighborhood = neighborhoods.find((n) => n.id === neighborhoodId);

  // Şehir/ilçe değişince hizmete açık ilk mahalle seçilir.
  const firstOpen = (list: { id: string; sellerCount: number }[]) =>
    (list.find((n) => n.sellerCount > 0) ?? list[0])?.id ?? "";

  const changeCity = (nextCity: string) => {
    const nextDistricts =
      areaTree.find((entry) => entry.city === nextCity)?.districts ?? [];
    const nextDistrict =
      nextDistricts.find((d) => d.neighborhoods.some((n) => n.sellerCount > 0)) ??
      nextDistricts[0];
    setCity(nextCity);
    setDistrict(nextDistrict?.district ?? "");
    setNeighborhoodId(firstOpen(nextDistrict?.neighborhoods ?? []));
  };

  const changeDistrict = (nextDistrict: string) => {
    const found = districts.find((entry) => entry.district === nextDistrict);
    setDistrict(nextDistrict);
    setNeighborhoodId(firstOpen(found?.neighborhoods ?? []));
  };
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [selfDelivery, setSelfDelivery] = useState(false);

  const toggleSelfDelivery = (checked: boolean) => {
    setSelfDelivery(checked);
    setRecipientName(checked ? customer.name : "");
    setRecipientPhone(checked ? (customer.phone ?? "") : "");
  };

  const applyAddress = (saved: SavedAddress) => {
    const cityEntry = areaTree.find((entry) => entry.city === saved.city);
    if (cityEntry) {
      const districtEntry =
        cityEntry.districts.find((entry) => entry.district === saved.district) ??
        cityEntry.districts[0];
      setCity(saved.city);
      setDistrict(districtEntry?.district ?? "");
      setNeighborhoodId(districtEntry?.neighborhoods[0]?.id ?? "");
    }
    setAddress(saved.fullAddress);
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

        {/* Şehir → ilçe → mahalle: sipariş, o mahalleye hizmet veren çiçekçiye
            düşer. Hizmet veren yoksa mahalle seçilemez (madde 12). */}
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Şehir" error={error("deliveryCity")}>
            <select
              name="deliveryCity"
              className="field"
              value={city}
              onChange={(event) => changeCity(event.target.value)}
            >
              {areaTree.map((entry) => (
                <option key={entry.city} value={entry.city}>
                  {entry.city}
                </option>
              ))}
            </select>
          </Field>

          <Field label="İlçe" error={error("deliveryDistrict")}>
            <select
              name="deliveryDistrict"
              className="field"
              value={district}
              onChange={(event) => changeDistrict(event.target.value)}
            >
              {districts.map((entry) => (
                <option key={entry.district} value={entry.district}>
                  {entry.district}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Mahalle" error={error("neighborhoodId")}>
            <select
              name="neighborhoodId"
              className="field"
              value={neighborhoodId}
              onChange={(event) => setNeighborhoodId(event.target.value)}
            >
              {neighborhoods.map((entry) => (
                <option
                  key={entry.id}
                  value={entry.id}
                  disabled={entry.sellerCount === 0}
                >
                  {entry.name}
                  {entry.sellerCount === 0 ? " (kapalı)" : ""}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {neighborhood && (
          <p className="mt-2 text-[12px] text-muted">
            {neighborhood.sellerCount > 0
              ? `${neighborhood.name} mahallesine ${neighborhood.sellerCount} çiçekçi hizmet veriyor.`
              : `${neighborhood.name} mahallesi henüz hizmete kapalı.`}
          </p>
        )}

        <div className="mt-4">
          <Field
            label="Açık adres"
            error={error("deliveryAddress")}
            hint="Cadde/sokak, bina ve daire numarası"
          >
            <textarea
              name="deliveryAddress"
              rows={3}
              className="field"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Moda Cad. No:42 D:7"
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
              defaultValue={defaultSlot ?? slots[1]}
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
        <GiftNoteField senderDefault={customer.name} />
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

/**
 * Açılıştaki bölge: başlıkta seçili mahalle → kayıtlı adres → hizmete açık ilk
 * mahalle. Kapalı bir mahalle asla seçili gelmez; müşterinin kayıtlı adresi
 * hizmet dışı bir şehirdeyse açık ilk şehre düşer.
 */
function findInitialArea(
  tree: AreaTree,
  selectedAreaId: string | null,
  saved: SavedAddress | undefined,
) {
  if (selectedAreaId) {
    for (const city of tree) {
      for (const district of city.districts) {
        const match = district.neighborhoods.find((n) => n.id === selectedAreaId);
        if (match) {
          return {
            city: city.city,
            district: district.district,
            neighborhoodId: match.id,
          };
        }
      }
    }
  }

  const isOpen = (n: { sellerCount: number }) => n.sellerCount > 0;
  const hasOpen = (d: { neighborhoods: { sellerCount: number }[] }) =>
    d.neighborhoods.some(isOpen);

  const savedCity = tree.find((entry) => entry.city === saved?.city);
  const cityEntry =
    (savedCity && savedCity.districts.some(hasOpen) ? savedCity : null) ??
    tree.find((entry) => entry.districts.some(hasOpen)) ??
    tree[0];

  const savedDistrict = cityEntry?.districts.find(
    (entry) => entry.district === saved?.district,
  );
  const districtEntry =
    (savedDistrict && hasOpen(savedDistrict) ? savedDistrict : null) ??
    cityEntry?.districts.find(hasOpen) ??
    cityEntry?.districts[0];

  const neighborhood =
    districtEntry?.neighborhoods.find(isOpen) ?? districtEntry?.neighborhoods[0];

  return {
    city: cityEntry?.city ?? "",
    district: districtEntry?.district ?? "",
    neighborhoodId: neighborhood?.id ?? "",
  };
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
