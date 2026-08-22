"use client";

import { useState, useTransition } from "react";
import {
  adjustSellerScore,
  remindPayment,
  reviewInvoice,
  runLateScan,
  setAccountManager,
  setDistrictAreas,
  setSellerAccepting,
  setSellerQuota,
  toggleSellerArea,
} from "@/app/actions/admin";
import { Icon } from "@/components/ui/Icon";

/* ------------------------- Sipariş alımını durdurma ----------------------- */
/* Madde 16: bayi tatilde, yoğun ya da sorunluysa akış tek anahtarla kesilir. */

export function AcceptingToggle({
  sellerId,
  accepting,
  reason,
}: {
  sellerId: string;
  accepting: boolean;
  reason: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [asking, setAsking] = useState(false);
  const [text, setText] = useState(reason ?? "");

  if (accepting) {
    return asking ? (
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Sebep (bayiye görünür)"
          className="field w-auto py-1.5 text-[12.5px] sm:w-64"
        />
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await setSellerAccepting(sellerId, false, text);
              setAsking(false);
            })
          }
          className="btn btn-danger btn-sm"
        >
          Durdur
        </button>
        <button
          type="button"
          onClick={() => setAsking(false)}
          className="btn btn-ghost btn-sm"
        >
          Vazgeç
        </button>
      </div>
    ) : (
      <button
        type="button"
        onClick={() => setAsking(true)}
        className="btn btn-outline btn-sm"
      >
        <Icon name="close" size={14} />
        Sipariş alımını durdur
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => setSellerAccepting(sellerId, true))}
      className="btn btn-primary btn-sm"
    >
      <Icon name="check" size={14} />
      Sipariş alımını aç
    </button>
  );
}

/* --------------------------------- Kota ----------------------------------- */
/* Madde 19: gün bazlı ve sipariş bazlı kota. */

export function QuotaEditor({
  sellerId,
  dailyQuota,
  activeQuota,
}: {
  sellerId: string;
  dailyQuota: number | null;
  activeQuota: number | null;
}) {
  const [daily, setDaily] = useState(dailyQuota ? String(dailyQuota) : "");
  const [active, setActive] = useState(activeQuota ? String(activeQuota) : "");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const commit = () => {
    setSaved(false);
    startTransition(async () => {
      await setSellerQuota(
        sellerId,
        daily.trim() ? Number(daily) : null,
        active.trim() ? Number(active) : null,
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    });
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="dailyQuota" className="field-label">
            Gün bazlı kota
          </label>
          <input
            id="dailyQuota"
            value={daily}
            onChange={(event) => setDaily(event.target.value)}
            inputMode="numeric"
            placeholder="Sınırsız"
            className="field tabular"
          />
          <p className="mt-1 text-[11.5px] text-faint">
            Bir günde teslim edebileceği en fazla sipariş.
          </p>
        </div>

        <div>
          <label htmlFor="activeQuota" className="field-label">
            Sipariş bazlı kota
          </label>
          <input
            id="activeQuota"
            value={active}
            onChange={(event) => setActive(event.target.value)}
            inputMode="numeric"
            placeholder="Sınırsız"
            className="field tabular"
          />
          <p className="mt-1 text-[11.5px] text-faint">
            Aynı anda üzerinde taşıyabileceği açık sipariş.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={commit}
          disabled={pending}
          className="btn btn-outline btn-sm"
        >
          {pending ? "Kaydediliyor…" : "Kotayı kaydet"}
        </button>
        {saved && (
          <span className="text-[11px] font-bold uppercase tracking-wider text-plum-600">
            Kaydedildi
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ Sorumlu kişi ------------------------------ */
/* Madde 21: bayi bu ismi ve numarayı kendi panelinde görür. */

export function ManagerPicker({
  sellerId,
  managerId,
  admins,
}: {
  sellerId: string;
  managerId: string | null;
  admins: { id: string; name: string; title: string | null }[];
}) {
  const [value, setValue] = useState(managerId ?? "");
  const [pending, startTransition] = useTransition();

  return (
    <select
      className="field"
      value={value}
      disabled={pending}
      aria-label="Sorumlu kişi"
      onChange={(event) => {
        const next = event.target.value;
        setValue(next);
        startTransition(() => setAccountManager(sellerId, next));
      }}
    >
      <option value="">Sorumlu atanmadı</option>
      {admins.map((admin) => (
        <option key={admin.id} value={admin.id}>
          {admin.name}
          {admin.title ? ` — ${admin.title}` : ""}
        </option>
      ))}
    </select>
  );
}

/* ---------------------------- Hizmet bölgeleri ---------------------------- */
/* Madde 15: hangi bayi hangi mahalleye hizmet veriyor, operasyon açar. */

export function AreaToggle({
  sellerId,
  neighborhoodId,
  name,
  open,
}: {
  sellerId: string;
  neighborhoodId: string;
  name: string;
  open: boolean;
}) {
  const [value, setValue] = useState(open);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={value}
      onClick={() => {
        setValue((prev) => !prev);
        startTransition(() => toggleSellerArea(sellerId, neighborhoodId));
      }}
      className={`rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
        value
          ? "border-plum-700 bg-plum-900 text-white"
          : "border-line-strong bg-surface text-plum-700 hover:border-plum-300"
      }`}
    >
      {name}
    </button>
  );
}

export function DistrictBulkToggle({
  sellerId,
  city,
  district,
  allOpen,
}: {
  sellerId: string;
  city: string;
  district: string;
  allOpen: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(() =>
          setDistrictAreas(sellerId, city, district, !allOpen),
        )
      }
      className="btn btn-ghost btn-sm text-[12px]"
    >
      {allOpen ? "İlçeyi kapat" : "İlçenin tamamını aç"}
    </button>
  );
}

/* ---------------------------------- Puan ---------------------------------- */
/* Madde 17: otomatik gecikme cezasının yanında elle düzeltme. */

export function ScoreAdjuster({ sellerId }: { sellerId: string }) {
  const [delta, setDelta] = useState("-5");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div>
        <label htmlFor="scoreDelta" className="field-label">
          Puan
        </label>
        <input
          id="scoreDelta"
          value={delta}
          onChange={(event) => setDelta(event.target.value)}
          className="field tabular w-20"
          inputMode="numeric"
        />
      </div>
      <div className="min-w-[12rem] flex-1">
        <label htmlFor="scoreReason" className="field-label">
          Sebep
        </label>
        <input
          id="scoreReason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className="field"
          placeholder="Örn. Müşteri şikâyeti"
        />
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await adjustSellerScore(sellerId, Number(delta), reason);
            setReason("");
            setDone(true);
            setTimeout(() => setDone(false), 1800);
          })
        }
        className="btn btn-outline btn-sm"
      >
        {pending ? "…" : "Uygula"}
      </button>
      {done && (
        <span className="text-[11px] font-bold uppercase tracking-wider text-plum-600">
          İşlendi
        </span>
      )}
    </div>
  );
}

export function LateScanButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const written = await runLateScan();
            setResult(
              written > 0
                ? `${written} gecikme bulundu, puanlar düşüldü.`
                : "Cezalandırılmamış gecikme yok.",
            );
          })
        }
        className="btn btn-outline btn-sm"
      >
        <Icon name="shield" size={14} />
        {pending ? "Taranıyor…" : "Gecikmeleri tara"}
      </button>
      {result && <span className="text-[12px] text-muted">{result}</span>}
    </div>
  );
}

/* -------------------------------- Faturalar ------------------------------- */
/* Madde 1: finans ekibi bayi faturasını inceler. */

export function InvoiceReview({ invoiceId }: { invoiceId: string }) {
  const [pending, startTransition] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");

  if (rejecting) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Ret sebebi"
          className="field w-auto py-1.5 text-[12.5px] sm:w-48"
        />
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await reviewInvoice(invoiceId, "REDDEDILDI", note);
              setRejecting(false);
            })
          }
          className="btn btn-danger btn-sm"
        >
          Reddet
        </button>
        <button
          type="button"
          onClick={() => setRejecting(false)}
          className="btn btn-ghost btn-sm"
        >
          Vazgeç
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(() => reviewInvoice(invoiceId, "ONAYLANDI"))
        }
        className="btn btn-primary btn-sm"
      >
        <Icon name="check" size={14} />
        Onayla
      </button>
      <button
        type="button"
        onClick={() => setRejecting(true)}
        className="btn btn-ghost btn-sm"
      >
        Reddet
      </button>
    </div>
  );
}

/* --------------------------- Ödeme hatırlatması --------------------------- */
/* Madde 14: ödemede takılan müşteriye tek tıkla hatırlatma. */

export function PaymentReminderButton({
  orderId,
  reminderCount,
}: {
  orderId: string;
  reminderCount: number;
}) {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await remindPayment(orderId);
            setSent(true);
            setTimeout(() => setSent(false), 2600);
          })
        }
        className="btn btn-outline btn-sm"
      >
        <Icon name="bell" size={14} />
        {pending
          ? "Gönderiliyor…"
          : reminderCount > 0
            ? "Tekrar hatırlat"
            : "Ödeme hatırlat"}
      </button>
      {sent && (
        <span className="text-[11.5px] font-medium text-plum-600">
          Hatırlatma gönderildi
        </span>
      )}
    </div>
  );
}
