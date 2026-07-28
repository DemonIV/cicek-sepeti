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
  from?: string;
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

export function GiftNoteField({
  name = "giftNote",
  defaultValue = "",
  maxLength = 220,
}: {
  name?: string;
  defaultValue?: string;
  maxLength?: number;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
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

      <p className="relative mt-1 text-[11px] leading-snug text-bloom-700/70">
        Not, çiçekçi tarafından karta yazılır ve alıcıya çiçekle birlikte teslim
        edilir. Gönderen adı görünmez, istersen sen ekle.
      </p>
    </div>
  );
}
