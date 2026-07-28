/** Veritabanı boşken gösterilir — sunumda boş bir ekranla karşılaşmamak için. */
export function SetupNotice() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
      <p className="eyebrow">Kurulum</p>
      <h1 className="mt-3 text-3xl">Veritabanı henüz doldurulmadı</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Demo içeriği (mağazalar, ürünler, siparişler) seed komutuyla
        oluşturulur. Terminalde aşağıdaki komutu çalıştırıp sayfayı yenile.
      </p>
      <pre className="mt-5 overflow-x-auto rounded-lg border border-line bg-plum-950 px-4 py-3.5 font-mono text-[13px] text-plum-100">
        npx prisma migrate dev{"\n"}npm run seed
      </pre>
      <p className="mt-4 text-xs text-faint">
        Seed komutu her çalıştığında veriyi sıfırlayıp yeniden kurar.
      </p>
    </main>
  );
}
