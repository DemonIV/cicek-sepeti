"use client";

import { useState, useTransition } from "react";
import { confirmPayment } from "@/app/actions/checkout";
import { Icon } from "@/components/ui/Icon";
import { formatPrice } from "@/lib/format";

/**
 * Sahte ödeme ekranı. Gerçek bir sanal POS entegrasyonu yoktur; amaç sunumda
 * hem başarılı hem başarısız ödeme akışını gösterebilmek.
 */
export function PaymentSimulator({
  orderNo,
  total,
  failedBefore,
}: {
  orderNo: string;
  total: number;
  failedBefore: boolean;
}) {
  const [step, setStep] = useState<"card" | "secure">("card");
  const [pending, startTransition] = useTransition();
  const [card, setCard] = useState({
    number: "5528 7900 0000 0008",
    holder: "DEMO KULLANICI",
    expiry: "12/29",
    cvv: "000",
  });

  const settle = (success: boolean) =>
    startTransition(() => confirmPayment(orderNo, success));

  if (step === "secure") {
    return (
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-line bg-plum-950 px-5 py-3.5 text-white">
          <p className="text-[13px] font-semibold">3D Secure doğrulama</p>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-plum-300">
            Simülasyon
          </span>
        </div>

        <div className="px-5 py-7 sm:px-8">
          <p className="text-[13px] leading-relaxed text-muted">
            Bankan, kartın sahibine doğrulama kodu gönderdi. Gerçek sistemde bu
            adım bankanın kendi sayfasında geçer; demoda sonucu sen seçiyorsun.
          </p>

          <div className="mt-5 rounded-lg border border-line bg-plum-50 px-4 py-4">
            <p className="field-label">Doğrulama kodu</p>
            <div className="flex gap-2">
              {["4", "8", "1", "9", "0", "2"].map((digit, index) => (
                <span
                  key={index}
                  className="tabular flex h-11 w-9 items-center justify-center rounded-md border border-line-strong bg-surface font-mono text-lg font-bold text-plum-950"
                >
                  {digit}
                </span>
              ))}
            </div>
            <p className="mt-2.5 text-[11.5px] text-muted">
              {card.number.slice(-4)} ile biten karta ait doğrulama.
            </p>
          </div>

          <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => settle(true)}
              className="btn btn-primary btn-lg"
            >
              <Icon name="check" size={16} />
              {pending ? "İşleniyor…" : "Doğrula ve öde"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => settle(false)}
              className="btn btn-danger btn-lg"
            >
              Başarısız senaryoyu göster
            </button>
          </div>

          <button
            type="button"
            onClick={() => setStep("card")}
            className="mt-4 text-[13px] text-muted underline underline-offset-4 hover:text-plum-800"
          >
            Kart bilgilerine dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card card-pad">
      {failedBefore && (
        <div className="mb-5 rounded-md border border-[#f2c6c2] bg-[#fbe0dd] px-4 py-3">
          <p className="text-[13px] font-semibold text-[#9c2f2a]">
            Ödeme alınamadı
          </p>
          <p className="mt-1 text-[12.5px] leading-snug text-[#9c2f2a]/85">
            Banka işlemi reddetti. Siparişin duruyor, tekrar deneyebilirsin.
          </p>
        </div>
      )}

      {/* Kart görseli */}
      <div className="relative overflow-hidden rounded-lg bg-plum-950 px-5 py-6 text-white">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-bloom-600/25" />
        <div className="absolute -bottom-14 -right-2 h-32 w-32 rounded-full bg-plum-600/25" />

        <div className="relative flex items-start justify-between">
          <div className="h-7 w-10 rounded-sm bg-[linear-gradient(135deg,#d8c27a,#b3954a)]" />
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/50">
            Demo kart
          </span>
        </div>

        <p className="tabular relative mt-6 font-mono text-[1.05rem] tracking-[0.14em]">
          {card.number}
        </p>

        <div className="relative mt-5 flex items-end justify-between text-[11px]">
          <div>
            <p className="text-white/45">Kart sahibi</p>
            <p className="mt-0.5 font-semibold tracking-wide">{card.holder}</p>
          </div>
          <div className="text-right">
            <p className="text-white/45">Son kullanma</p>
            <p className="tabular mt-0.5 font-mono font-semibold">
              {card.expiry}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        <div>
          <label htmlFor="card-number" className="field-label">
            Kart numarası
          </label>
          <input
            id="card-number"
            className="field tabular font-mono"
            value={card.number}
            onChange={(event) =>
              setCard({ ...card, number: event.target.value })
            }
            inputMode="numeric"
          />
        </div>

        <div>
          <label htmlFor="card-holder" className="field-label">
            Kart üzerindeki isim
          </label>
          <input
            id="card-holder"
            className="field"
            value={card.holder}
            onChange={(event) =>
              setCard({ ...card, holder: event.target.value })
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="card-expiry" className="field-label">
              Son kullanma
            </label>
            <input
              id="card-expiry"
              className="field tabular font-mono"
              value={card.expiry}
              onChange={(event) =>
                setCard({ ...card, expiry: event.target.value })
              }
            />
          </div>
          <div>
            <label htmlFor="card-cvv" className="field-label">
              CVV
            </label>
            <input
              id="card-cvv"
              className="field tabular font-mono"
              value={card.cvv}
              onChange={(event) =>
                setCard({ ...card, cvv: event.target.value })
              }
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setStep("secure")}
        className="btn btn-primary btn-lg btn-block mt-6"
      >
        {formatPrice(total)} öde
        <Icon name="arrow-right" size={16} />
      </button>

      <p className="mt-3 text-center text-[11.5px] leading-relaxed text-faint">
        Bu ekran bir simülasyondur. Girilen bilgiler hiçbir yere gönderilmez,
        kaydedilmez ve gerçek bir tahsilat yapılmaz.
      </p>
    </div>
  );
}
