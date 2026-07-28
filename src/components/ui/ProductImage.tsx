"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Ürün görseli. Uzak görsel yüklenemezse yerel bir çizim yedeğe düşer —
 * sunum sırasında hiçbir yerde kırık görsel ikonu çıkmaz.
 *
 * Kalite notu: fotoğraf bu arayüzün kahraman öğesi olduğu için varsayılan 75
 * yerine 88 ile sıkıştırılır. Fark özellikle yaprak kenarlarında ve pembe
 * geçişlerde görülüyor; dosya büyümesi AVIF sayesinde küçük kalıyor.
 */

/**
 * Yüklenirken boşluk pembeye çalan bir bulanıklıkla dolar, beyaz sıçramaz.
 * 8×8 SVG'nin base64'ü; sabit olarak yazıldı çünkü bu bir istemci bileşeni ve
 * tarayıcıda `Buffer` yok.
 * Kaynak: <rect fill="#f0dde5"/> + <circle cx=4 cy=3 r=3 fill="#ffdde4"/>
 */
const BLUR =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNmMGRkZTUiLz48Y2lyY2xlIGN4PSI0IiBjeT0iMyIgcj0iMyIgZmlsbD0iI2ZmZGRlNCIvPjwvc3ZnPg==";

export function ProductImage({
  src,
  alt,
  sizes = "(max-width: 768px) 50vw, 25vw",
  priority = false,
  className = "",
}: {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) return <ImageFallback className={className} />;

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      quality={88}
      placeholder="blur"
      blurDataURL={BLUR}
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}

export function ImageFallback({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`absolute inset-0 flex items-center justify-center bg-[linear-gradient(155deg,var(--color-plum-50),var(--color-bloom-50))] ${className}`}
    >
      <svg width="52" height="52" viewBox="0 0 48 48" fill="none">
        <g
          stroke="var(--color-plum-300)"
          strokeWidth="1.4"
          strokeLinecap="round"
        >
          <path d="M24 44V24" />
          <path d="M24 34c-5 0-9-3-10-8 5-1 9 2 10 8Z" />
          <path d="M24 30c5-1 8-4 8-9-5 0-8 3-8 9Z" />
        </g>
        <g stroke="var(--color-bloom-300)" strokeWidth="1.4">
          <circle cx="24" cy="14" r="5" />
          <circle cx="17" cy="18" r="4.4" />
          <circle cx="31" cy="18" r="4.4" />
          <circle cx="19.5" cy="9.5" r="4.4" />
          <circle cx="28.5" cy="9.5" r="4.4" />
        </g>
      </svg>
    </div>
  );
}
