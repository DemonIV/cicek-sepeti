"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-lg flex-col justify-center px-4 py-16 sm:px-6">
      <p className="eyebrow">Bir şeyler ters gitti</p>
      <h1 className="mt-3 text-[2rem] leading-tight">Bu ekran yüklenemedi</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        İşlemi tekrar deneyebilirsin. Sorun sürerse ana sayfadan devam et.
      </p>

      {error.message && (
        <p className="mono mt-4 overflow-x-auto rounded-md bg-plum-50 px-3 py-2.5 text-[12px] text-plum-800">
          {error.message}
        </p>
      )}

      <div className="mt-7 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">
          Tekrar dene
        </button>
        <Link href="/" className="btn btn-outline">
          Ana sayfa
        </Link>
      </div>
    </main>
  );
}
