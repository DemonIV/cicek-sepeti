"use client";

import { useRef, useState, useTransition } from "react";
import { uploadInvoice } from "@/app/actions/seller";
import { Icon } from "@/components/ui/Icon";

/**
 * Fatura yükleme (madde 2).
 *
 * Demo notu: gerçek bir dosya deposu yok. Seçilen dosyanın adı, türü ve boyutu
 * kaydedilir; görsel seçildiyse küçültülmüş bir önizleme de saklanır, böylece
 * finans ekranında gerçekten bir şey görünür. PDF'te yalnızca dosya bilgisi
 * tutulur. Gerçek sistemde burada bir nesne deposu (S3/Blob) olur.
 */
const MAX_EDGE = 1100;

async function shrinkImage(file: File): Promise<string | null> {
  if (!file.type.startsWith("image/")) return null;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const context = canvas.getContext("2d");
  if (!context) return null;
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", 0.7);
}

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export function InvoiceUpload({ defaultPeriod }: { defaultPeriod: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  const choose = async (picked: File | undefined) => {
    setMessage(null);
    setFile(picked ?? null);
    setPreview(picked ? await shrinkImage(picked).catch(() => null) : null);
  };

  const submit = (formData: FormData) => {
    if (!file) {
      setMessage({ ok: false, text: "Önce fatura dosyasını seç." });
      return;
    }

    formData.set("fileName", file.name);
    formData.set("fileType", file.type || "application/octet-stream");
    formData.set("fileSize", String(file.size));
    if (preview) formData.set("previewUrl", preview);

    startTransition(async () => {
      const result = await uploadInvoice(formData);
      setMessage({ ok: result.ok, text: result.message });
      if (result.ok) {
        formRef.current?.reset();
        setFile(null);
        setPreview(null);
      }
    });
  };

  return (
    <form ref={formRef} action={submit} className="card card-pad space-y-4">
      <div className="flex items-center gap-2.5">
        <Icon name="file" size={17} className="text-plum-500" />
        <h2 className="text-[15px] font-semibold">Fatura yükle</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="periodLabel" className="field-label">
            Dönem
          </label>
          <input
            id="periodLabel"
            name="periodLabel"
            type="month"
            defaultValue={defaultPeriod}
            className="field"
          />
        </div>

        <div>
          <label htmlFor="invoiceNo" className="field-label">
            Fatura no
          </label>
          <input
            id="invoiceNo"
            name="invoiceNo"
            className="field"
            placeholder="GUL-202608-114"
          />
        </div>

        <div>
          <label htmlFor="amount" className="field-label">
            Tutar (TL)
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            className="field tabular"
            placeholder="4.250,00"
          />
        </div>
      </div>

      <div>
        <label htmlFor="invoiceFile" className="field-label">
          Fatura dosyası (PDF veya görsel)
        </label>
        <input
          id="invoiceFile"
          type="file"
          accept="application/pdf,image/*"
          onChange={(event) => choose(event.target.files?.[0])}
          className="block w-full text-[12.5px] text-muted file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-line-strong file:bg-surface file:px-3 file:py-1.5 file:text-[12.5px] file:font-semibold file:text-plum-800"
        />
        {file && (
          <p className="mt-1.5 text-[12px] text-muted">
            {file.name} · {formatSize(file.size)}
            {preview ? " · önizleme hazırlandı" : ""}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="note" className="field-label">
          Açıklama (isteğe bağlı)
        </label>
        <input
          id="note"
          name="note"
          maxLength={140}
          className="field"
          placeholder="Örn. Temmuz dönemi komisyon faturası"
        />
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary btn-sm">
        {pending ? "Yükleniyor…" : "Faturayı gönder"}
      </button>

      {message && (
        <p
          role="status"
          className={`rounded-md px-3 py-2 text-[12.5px] font-medium ${
            message.ok
              ? "bg-plum-50 text-plum-800"
              : "bg-[#fbe0dd] text-[#9c2f2a]"
          }`}
        >
          {message.text}
        </p>
      )}

      <p className="text-[11.5px] leading-relaxed text-faint">
        Demo notu: dosya sunucuya kaydedilmez; adı, türü ve boyutu kayda geçer,
        görsel seçilirse küçültülmüş bir önizleme saklanır. Gerçek sistemde
        dosya güvenli bir depoya yüklenir.
      </p>
    </form>
  );
}
