"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const FRAME_STYLE_ID = "phone-frame-style";

const SCREENS = [
  { path: "/", label: "Ana sayfa" },
  { path: "/kategori/buketler", label: "Kategori" },
  { path: "/sepet", label: "Sepet" },
  { path: "/odeme", label: "Ödeme" },
  { path: "/hesabim", label: "Siparişlerim" },
];

export function PhonePreview({ trackingPath }: { trackingPath?: string }) {
  const screens = trackingPath
    ? [
        ...SCREENS.slice(0, 4),
        { path: trackingPath, label: "Sipariş takibi" },
        SCREENS[4],
      ]
    : SCREENS;

  const [active, setActive] = useState(screens[0].path);
  // Ekran, demo şeridi gizlenene kadar gösterilmez: aksi hâlde her geçişte
  // şerit bir an görünüp kayboluyor.
  const [ready, setReady] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);

  /**
   * Çerçevenin içi "uygulama" gibi görünsün: demo şeridi ve rol değiştirici
   * telefonun içinde durmasın.
   *
   * Gizleme, iframe belgesine eklenen bir stil etiketiyle yapılıyor; `<html>`
   * üzerine öznitelik koymak, içerideki React hydrate olurken sunucudan gelen
   * HTML ile uyuşmazlık uyarısı üretiyordu.
   */
  const markAsPhoneFrame = useCallback(() => {
    const doc = frameRef.current?.contentDocument;
    if (!doc?.head) return;

    if (!doc.getElementById(FRAME_STYLE_ID)) {
      const style = doc.createElement("style");
      style.id = FRAME_STYLE_ID;
      style.textContent = "[data-demo-bar]{display:none}";
      doc.head.appendChild(style);
    }

    setReady(true);
  }, []);

  // Yalnızca onLoad'a güvenilemez: iframe, bileşen hydrate olmadan yüklenmiş
  // olabilir. Effect hem o durumu hem sonraki yüklemeleri yakalar.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    markAsPhoneFrame();
    frame.addEventListener("load", markAsPhoneFrame);
    return () => frame.removeEventListener("load", markAsPhoneFrame);
  }, [active, markAsPhoneFrame]);

  return (
    <div className="grid gap-10 lg:grid-cols-[auto_1fr] lg:items-start">
      <div className="mx-auto">
        {/* Telefon çerçevesi */}
        <div className="relative rounded-[2.6rem] border border-white/12 bg-[#170812] p-3 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)]">
          {/* Genişlik gerçek iPhone ölçüsü (390px): çerçeve dar olursa ürün
              ızgarası telefonda olduğundan sıkışık görünüyordu. */}
          <div className="relative h-[43rem] w-[24.375rem] overflow-hidden rounded-[2rem] bg-white">
            {/* Çentik */}
            <div className="pointer-events-none absolute left-1/2 top-0 z-20 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-[#170812]" />

            {!ready && (
              <div className="absolute inset-0 z-10 grid place-items-center bg-white">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
                  Yükleniyor
                </span>
              </div>
            )}

            <iframe
              key={active}
              ref={frameRef}
              src={active}
              title="Mobil önizleme"
              className={`h-full w-full border-0 transition-opacity duration-200 ${
                ready ? "opacity-100" : "opacity-0"
              }`}
              onLoad={markAsPhoneFrame}
            />
          </div>

          {/* Yan tuşlar */}
          <span className="absolute -left-[3px] top-28 h-10 w-[3px] rounded-l bg-white/15" />
          <span className="absolute -left-[3px] top-44 h-16 w-[3px] rounded-l bg-white/15" />
          <span className="absolute -right-[3px] top-36 h-20 w-[3px] rounded-r bg-white/15" />
        </div>

        <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-plum-300/60">
          390 px genişlik · iPhone ölçüsü
        </p>
      </div>

      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-bloom-300">
          Önizleme
        </p>
        <h1 className="mt-3 text-[clamp(1.9rem,4vw,2.8rem)] leading-tight text-white">
          Mobil deneyim
        </h1>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-plum-100/70">
          Çerçevenin içindeki, ayrı bir taklit ekran değil — müşteri arayüzünün
          telefon genişliğinde çalışan hâli. Tıklayabilir, sepete ürün ekleyip
          ödeme adımına kadar gidebilirsin.
        </p>

        <div className="mt-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-plum-300/60">
            Ekranlar
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {screens.map((screen) => (
              <button
                key={screen.path}
                type="button"
                onClick={() => {
                  if (screen.path === active) return;
                  setReady(false);
                  setActive(screen.path);
                }}
                className={`rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
                  active === screen.path
                    ? "bg-white text-plum-950"
                    : "border border-white/15 text-plum-100/80 hover:bg-white/10"
                }`}
              >
                {screen.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 max-w-lg rounded-lg border border-white/12 bg-white/5 px-5 py-4">
          <p className="text-[13px] font-semibold text-white">
            Bu bir web önizlemesidir
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-plum-100/65">
            Gerçek projede bu akış native bir iOS/Android uygulamasına taşınır:
            anlık bildirim, adres için harita seçici, kurye tarafında barkod
            okuma ve konum paylaşımı eklenir. Demo kapsamında ayrı bir mobil
            uygulama geliştirilmedi.
          </p>
        </div>
      </div>
    </div>
  );
}
