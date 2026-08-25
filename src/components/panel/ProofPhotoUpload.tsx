"use client";

import { useRef, useState, useTransition } from "react";
import {
  removeDeliveryProof,
  uploadDeliveryProof,
} from "@/app/actions/courier";
import { shrinkToDataUrl } from "@/lib/image-shrink";
import { Icon } from "@/components/ui/Icon";

/**
 * Teslim anı fotoğrafı.
 *
 * Çiçekçinin hazırlık karesinin (madde 22) teslimat tarafındaki karşılığı:
 * kurye çiçeği bıraktığı yeri çeker, müşteri takip ekranında görür. Ürün
 * açıklamalarında verilen "kurye teslimatında fotoğraf gönderilir" sözünün
 * arayüzdeki karşılığı budur.
 *
 * Zorunlu değil — kamerası olmayan bir makinede sunum yapılabilsin diye
 * teslimat fotoğrafsız da tamamlanabilir.
 */
export function ProofPhotoUpload({
  orderId,
  existing,
  delivered,
}: {
  orderId: string;
  existing: string | null;
  delivered: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();
  const [working, setWorking] = useState(false);

  const choose = async (file: File | undefined) => {
    if (!file) return;
    setMessage(null);
    setWorking(true);
    try {
      setPreview(await shrinkToDataUrl(file));
    } catch {
      setMessage({ ok: false, text: "Fotoğraf okunamadı, başka bir kare dene." });
    } finally {
      setWorking(false);
    }
  };

  const send = () => {
    if (!preview) return;
    startTransition(async () => {
      const result = await uploadDeliveryProof(orderId, preview);
      setMessage({ ok: result.ok, text: result.message });
      if (result.ok) {
        setPreview(null);
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  };

  const drop = () => {
    startTransition(async () => {
      const result = await removeDeliveryProof(orderId);
      setMessage({ ok: result.ok, text: result.message });
    });
  };

  return (
    <div className="card card-pad">
      <div className="flex items-center gap-2.5">
        <Icon name="camera" size={17} className="text-plum-500" />
        <h2 className="text-[15px] font-semibold">Teslim anı fotoğrafı</h2>
      </div>
      <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
        {delivered
          ? "Çiçeği bıraktığın kareyi ekle; müşteri sipariş takibinde görür."
          : "Çiçeği bıraktığında bir kare çek. Teslimatı işaretlemeden önce de sonra da yükleyebilirsin."}{" "}
        Zorunlu değil.
      </p>

      {existing && !preview && (
        <div className="mt-3 space-y-2">
          {/* Veri URL'i olduğu için next/image yerine düz img. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={existing}
            alt="Teslim anı fotoğrafı"
            className="aspect-square w-full max-w-[16rem] rounded-lg border border-line object-cover"
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge tone-leaf">Müşteriye iletildi</span>
            <button
              type="button"
              onClick={drop}
              disabled={pending}
              className="btn btn-ghost btn-sm"
            >
              Kaldır
            </button>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(event) => choose(event.target.files?.[0])}
        className="mt-3 block w-full text-[12.5px] text-muted file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-line-strong file:bg-surface file:px-3 file:py-1.5 file:text-[12.5px] file:font-semibold file:text-plum-800"
      />

      {working && (
        <p className="mt-2 text-[12px] text-muted">Fotoğraf hazırlanıyor…</p>
      )}

      {preview && (
        <div className="mt-3 space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Yüklenecek teslim fotoğrafı"
            className="aspect-square w-full max-w-[16rem] rounded-lg border border-line object-cover"
          />
          <button
            type="button"
            onClick={send}
            disabled={pending}
            className="btn btn-primary btn-sm"
          >
            <Icon name="check" size={15} />
            {pending ? "Gönderiliyor…" : "Müşteriye gönder"}
          </button>
        </div>
      )}

      {message && (
        <p
          role="status"
          className={`mt-3 rounded-md px-3 py-2 text-[12.5px] font-medium ${
            message.ok
              ? "bg-plum-50 text-plum-800"
              : "bg-[#fbe0dd] text-[#9c2f2a]"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
