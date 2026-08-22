"use client";

import { useState } from "react";
import { ProductImage } from "@/components/ui/ProductImage";
import { Icon } from "@/components/ui/Icon";

export type GalleryItem = {
  id: string;
  url: string;
  kind: "IMAGE" | "VIDEO";
};

/**
 * Ürün galerisi (madde 23): en az üç fotoğraf, varsa tanıtım videosu.
 *
 * Kare çerçeve katalogdaki kartla aynı; küçük görseller altta şerit olarak
 * durur, telefonda yatay kaydırılır. Video seçilince aynı çerçevede oynar —
 * ayrı bir pencere açılmaz, sunum akışı bölünmez.
 */
export function ProductGallery({
  items,
  alt,
  poster,
}: {
  items: GalleryItem[];
  alt: string;
  poster: string;
}) {
  const [activeId, setActiveId] = useState(items[0]?.id);
  const active = items.find((item) => item.id === activeId) ?? items[0];

  if (!active) {
    return (
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-line bg-plum-100">
        <ProductImage src={poster} alt={alt} priority sizes="(max-width: 1024px) 100vw, 480px" />
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-line bg-plum-100 shadow-[var(--shadow-lift)]">
        {active.kind === "VIDEO" ? (
          <video
            key={active.id}
            src={active.url}
            poster={poster}
            controls
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <ProductImage
            key={active.id}
            src={active.url}
            alt={alt}
            priority
            sizes="(max-width: 1024px) 100vw, 480px"
          />
        )}
      </div>

      {items.length > 1 && (
        <div className="scroll-row mt-3 gap-2.5">
          {items.map((item) => {
            const isActive = item.id === active.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveId(item.id)}
                aria-label={
                  item.kind === "VIDEO" ? "Tanıtım videosu" : "Ürün fotoğrafı"
                }
                aria-current={isActive}
                className={`relative size-[4.5rem] flex-none overflow-hidden rounded-lg border-2 bg-plum-100 transition-colors sm:size-20 ${
                  isActive ? "border-bloom-600" : "border-line hover:border-plum-300"
                }`}
              >
                {item.kind === "VIDEO" ? (
                  <>
                    <ProductImage src={poster} alt="" sizes="80px" />
                    <span className="absolute inset-0 grid place-items-center bg-plum-950/45 text-white">
                      <Icon name="play" size={20} className="fill-current" />
                    </span>
                  </>
                ) : (
                  <ProductImage src={item.url} alt="" sizes="80px" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
