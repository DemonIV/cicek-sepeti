import Link from "next/link";
import type { Metadata } from "next";
import { getAreaTree, getSelectedArea, areaFullLabel } from "@/lib/delivery-area";
import { setDeliveryArea, clearDeliveryArea } from "@/app/actions/area";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = {
  title: "Teslimat bölgesi",
  description:
    "Siparişini göndereceğin şehri, ilçeyi ve mahalleyi seç. Çiçek, o mahalleye hizmet veren en yakın çiçekçiden çıkar.",
};

/**
 * Bölge seçimi (madde 12).
 *
 * Çiçek kargoyla değil, alıcıya en yakın çiçekçiden gider — bu yüzden ürünler
 * bölgeye göre değişir. Mahallenin yanındaki rakam oraya hizmet veren çiçekçi
 * sayısıdır; sıfırsa o mahalle henüz kapalıdır ve seçilemez.
 */
export default async function DeliveryAreaPage({
  searchParams,
}: {
  searchParams: Promise<{ sehir?: string; devam?: string }>;
}) {
  const params = await searchParams;
  const [tree, selected] = await Promise.all([getAreaTree(), getSelectedArea()]);

  const activeCity =
    tree.find((c) => c.city === params.sehir)?.city ??
    selected?.city ??
    tree[0]?.city;
  const city = tree.find((c) => c.city === activeCity);
  const target = params.devam ?? "/urunler";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 md:py-12">
      <p className="eyebrow">Teslimat</p>
      <h1 className="section-title mt-2">Siparişi nereye göndereceksin?</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
        Çiçeği kargoya vermiyoruz: sipariş, alıcının mahallesine hizmet veren
        çiçekçiye düşer. Bu yüzden katalog seçtiğin bölgeye göre daralır — her
        ürün her mahalleye gönderilemez.
      </p>

      {selected && (
        <div className="card mt-6 flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="flex items-center gap-2 text-sm">
            <Icon name="pin" size={16} className="text-bloom-600" />
            <span className="font-semibold text-plum-950">
              {areaFullLabel(selected)}
            </span>
            <span className="text-muted">seçili</span>
          </p>
          <form action={clearDeliveryArea}>
            <button type="submit" className="btn btn-outline btn-sm">
              Seçimi kaldır
            </button>
          </form>
        </div>
      )}

      {/* Şehirler */}
      <nav className="scroll-row mt-8 gap-2">
        {tree.map((entry) => (
          <Link
            key={entry.city}
            href={`/teslimat-bolgesi?sehir=${encodeURIComponent(entry.city)}${
              params.devam ? `&devam=${encodeURIComponent(params.devam)}` : ""
            }`}
            className={
              entry.city === activeCity
                ? "btn btn-dark btn-sm"
                : "btn btn-outline btn-sm"
            }
          >
            {entry.city}
          </Link>
        ))}
      </nav>

      {!city ? (
        <div className="mt-8">
          <EmptyState
            title="Bölge listesi boş"
            description="Mahalleler henüz tanımlanmamış. Seed komutunu çalıştırman gerekebilir."
          />
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {city.districts.map((district) => (
            <section key={district.district} className="card p-5">
              <h2 className="text-[15px] font-semibold text-plum-950">
                {district.district}
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {district.neighborhoods.map((n) => {
                  const isSelected = selected?.id === n.id;
                  const closed = n.sellerCount === 0;

                  return (
                    <form key={n.id} action={setDeliveryArea}>
                      <input type="hidden" name="neighborhoodId" value={n.id} />
                      <input type="hidden" name="target" value={target} />
                      <button
                        type="submit"
                        disabled={closed}
                        title={
                          closed
                            ? "Bu mahalleye hizmet veren çiçekçi henüz yok"
                            : `${n.sellerCount} çiçekçi hizmet veriyor`
                        }
                        className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                          isSelected
                            ? "border-bloom-600 bg-bloom-600 text-white"
                            : closed
                              ? "cursor-not-allowed border-line bg-plum-50 text-faint"
                              : "border-line-strong bg-surface text-plum-800 hover:border-bloom-400 hover:text-bloom-700"
                        }`}
                      >
                        {n.name}
                        <span
                          className={`tabular font-mono text-[10px] ${
                            isSelected ? "text-bloom-100" : "text-faint"
                          }`}
                        >
                          {closed ? "kapalı" : n.sellerCount}
                        </span>
                      </button>
                    </form>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="mt-8 text-xs leading-relaxed text-faint">
        Mahalle yanındaki rakam, oraya hizmet veren çiçekçi sayısıdır. Bu
        eşleşmeyi operasyon ekibi admin panelinden açar (Satıcı yönetimi →
        Hizmet bölgeleri).
      </p>
    </div>
  );
}
