import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-lg flex-col justify-center px-4 py-16 sm:px-6">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 text-[2rem] leading-tight">Bu sayfayı bulamadık</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Aradığın ürün yayından kaldırılmış ya da bağlantı yanlış olabilir.
        Katalogdan devam edebilirsin.
      </p>

      <div className="mt-7 flex flex-wrap gap-3">
        <Link href="/urunler" className="btn btn-primary">
          Ürünlere göz at
        </Link>
        <Link href="/" className="btn btn-outline">
          Ana sayfa
        </Link>
      </div>
    </main>
  );
}
