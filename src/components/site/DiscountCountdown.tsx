"use client";

import { useEffect, useState } from "react";

/**
 * İndirimin bitişine kalan süre (madde 24).
 *
 * Sunucuda ilk çizimde sabit bir metin basılır, sayaç yalnızca tarayıcıda
 * ilerler — aksi hâlde sunucu ve istemci farklı saniyeyi yazıp hydration
 * uyarısı çıkarır.
 */
export function DiscountCountdown({
  endsAt,
  className = "",
}: {
  endsAt: string;
  className?: string;
}) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const target = new Date(endsAt).getTime();
    const tick = () => setRemaining(Math.max(0, target - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (remaining === null) {
    return (
      <span className={`tabular font-mono ${className}`} suppressHydrationWarning>
        --:--:--
      </span>
    );
  }

  if (remaining === 0) {
    return <span className={className}>İndirim sona erdi</span>;
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (v: number) => String(v).padStart(2, "0");

  return (
    <span className={`tabular font-mono ${className}`}>
      {days > 0 && `${days} gün `}
      {pad(hours)}:{pad(minutes)}:{pad(seconds)}
    </span>
  );
}
