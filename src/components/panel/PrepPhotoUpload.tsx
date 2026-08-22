"use client";

import { useRef, useState, useTransition } from "react";
import { uploadPreparationPhoto } from "@/app/actions/seller";
import { Icon } from "@/components/ui/Icon";

/**
 * Hazırlık onay görseli (madde 22).
 *
 * Çiçekçi buketi hazırlayınca fotoğrafını çeker; müşteri sipariş takibinde
 * aynı kareyi görür. Demo'da dosya deposu yok: fotoğraf tarayıcıda 900 px'e
 * küçültülüp veri URL'i olarak saklanır — sunucuda görsel işleme yapılmaz
 * (küçük bir kutuda çalışabilmesi için bilinçli bir sınır).
 */
const MAX_EDGE = 900;
const QUALITY = 0.72;

async function shrink(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Tarayıcı görseli işleyemedi.");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", QUALITY);
}

export function PrepPhotoUpload({ orderId }: { orderId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
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
      setPreview(await shrink(file));
    } catch {
      setMessage({ ok: false, text: "Fotoğraf okunamadı, başka bir kare dene." });
    } finally {
      setWorking(false);
    }
  };

  const send = () => {
    if (!preview) return;
    startTransition(async () => {
      const result = await uploadPreparationPhoto(orderId, preview, note);
      setMessage({ ok: result.ok, text: result.message });
      if (result.ok) {
        setPreview(null);
        setNote("");
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  };

  return (
    <div className="card card-pad">
      <div className="flex items-center gap-2.5">
        <Icon name="camera" size={17} className="text-plum-500" />
        <h2 className="text-[15px] font-semibold">Hazırlık onay görseli</h2>
      </div>
      <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
        Buketin fotoğrafını çek; müşteri sipariş takip ekranında görür. Telefonla
        açtıysan doğrudan kamerayı kullanabilirsin.
      </p>

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
          {/* Veri URL'i olduğu için next/image yerine düz img: optimize
              edilecek bir uzak kaynak yok. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Yüklenecek hazırlık fotoğrafı"
            className="aspect-square w-full max-w-[16rem] rounded-lg border border-line object-cover"
          />

          <div>
            <label htmlFor="prep-note" className="field-label">
              Not (isteğe bağlı)
            </label>
            <input
              id="prep-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={120}
              className="field"
              placeholder="Örn. Kurdelesi bağlandı, kart iliştirildi."
            />
          </div>

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
