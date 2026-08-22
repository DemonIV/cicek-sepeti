"use client";

import { useState } from "react";

/**
 * Demo'nun imza öğesi: hediye notu kartı.
 *
 * Aynı kart müşterinin checkout ekranında yazılır, sipariş takibinde,
 * satıcının hazırlık ekranında ve kuryenin teslimat detayında birebir aynı
 * şekilde görünür. Dört rolü birbirine bağlayan somut nesne budur.
 */

export function GiftNoteCard({
  text,
  from,
  className = "",
}: {
  text: string;
  /** Gönderici adı — istenmemişse yazılmaz, kart imzasız gider. */
  from?: string | null;
  className?: string;
}) {
  return (
    <figure className={`gift-note ${className}`}>
      <figcaption className="gift-note-label">Hediye notu</figcaption>
      <p className="gift-note-body">“{text}”</p>
      {from && (
        <p className="relative mt-3 text-right font-mono text-[10px] uppercase tracking-[0.12em] text-bloom-600">
          {from}
        </p>
      )}
    </figure>
  );
}

/**
 * Kart notu alanı. Gönderici adı kutucuğu isteğe bağlıdır (madde 13): kimi
 * gönderi bilerek imzasızdır, o yüzden kutu varsayılan olarak kapalıdır ve
 * açıldığında müşterinin adıyla dolar.
 */
export function GiftNoteField({
  name = "giftNote",
  defaultValue = "",
  maxLength = 220,
  senderDefault = "",
}: {
  name?: string;
  defaultValue?: string;
  maxLength?: number;
  senderDefault?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [signed, setSigned] = useState(false);
  const [sender, setSender] = useState(senderDefault);

  return (
    <div className="space-y-3">
      <div className="gift-note">
        <div className="flex items-baseline justify-between">
          <label htmlFor={name} className="gift-note-label">
            Hediye notu
          </label>
          <span className="relative font-mono text-[10px] text-bloom-400">
            {value.length}/{maxLength}
          </span>
        </div>

        <textarea
          id={name}
          name={name}
          rows={3}
          maxLength={maxLength}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Kartın üzerine el yazısıyla yazılacak mesajı buraya yaz…"
          className="gift-note-textarea"
        />

        {signed && sender.trim() && (
          <p className="relative mt-2 text-right font-mono text-[10px] uppercase tracking-[0.12em] text-bloom-600">
            {sender.trim()}
          </p>
        )}

        <p className="relative mt-1 text-[11px] leading-snug text-bloom-700/70">
          Not, çiçekçi tarafından karta el yazısıyla yazılır ve alıcıya çiçekle
          birlikte teslim edilir.
        </p>
      </div>

      <label className="flex cursor-pointer items-start gap-2.5 rounded-md bg-plum-50 px-3 py-2.5">
        <input
          type="checkbox"
          checked={signed}
          onChange={(event) => {
            setSigned(event.target.checked);
            if (event.target.checked && !sender) setSender(senderDefault);
          }}
          className="mt-0.5 accent-[var(--color-plum-700)]"
        />
        <span className="text-[13px] leading-snug text-plum-800">
          Kartın altına gönderici ismi yazılsın
          <span className="block text-[11.5px] text-muted">
            İşaretlemezsen kart imzasız gider.
          </span>
        </span>
      </label>

      {signed && (
        <div>
          <label htmlFor="senderName" className="field-label">
            Gönderici ismi
          </label>
          <input
            id="senderName"
            name="senderName"
            className="field"
            maxLength={60}
            value={sender}
            onChange={(event) => setSender(event.target.value)}
            placeholder="Örn. Zeynep'ten"
          />
        </div>
      )}
    </div>
  );
}
