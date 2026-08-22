import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { formatDateShort, formatPercent, formatPrice } from "@/lib/format";
import { summarizeEarnings } from "@/lib/pricing";
import { scoreBand } from "@/lib/seller-score";
import { PanelHeader } from "@/components/panel/PanelShell";
import {
  AcceptingToggle,
  AreaToggle,
  DistrictBulkToggle,
  ManagerPicker,
  QuotaEditor,
  ScoreAdjuster,
} from "@/components/panel/SellerControls";
import { CommissionEditor } from "@/components/panel/AdminControls";
import { Badge, SellerStatusBadge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";

type Params = Promise<{ id: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  const seller = await db.seller.findUnique({ where: { id } });
  return { title: seller?.storeName ?? "Bayi" };
}

/**
 * Bayi künyesi — operasyon ekibinin tek ekranda yönettiği her şey:
 * hizmet bölgeleri (madde 15), sipariş alımı (16), puan (17), kota (19),
 * sorumlu kişi (21) ve komisyon oranı.
 */
export default async function AdminSellerDetail({ params }: { params: Params }) {
  const { id } = await params;

  const seller = await db.seller.findUnique({
    where: { id },
    include: {
      user: true,
      accountManager: true,
      areas: true,
      scoreEvents: { orderBy: { createdAt: "desc" }, take: 10 },
      _count: { select: { products: true } },
    },
  });

  if (!seller) notFound();

  const [neighborhoods, admins, items, activeOrders] = await Promise.all([
    db.neighborhood.findMany({ orderBy: { sortOrder: "asc" } }),
    db.user.findMany({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } }),
    db.orderItem.findMany({
      where: {
        sellerId: seller.id,
        status: { not: "IPTAL" },
        order: { paymentStatus: "ODENDI" },
      },
      select: { unitPrice: true, quantity: true, commissionRate: true },
    }),
    db.order.count({
      where: {
        items: { some: { sellerId: seller.id } },
        status: { in: ["ONAYLANDI", "HAZIRLANIYOR", "YOLDA"] },
      },
    }),
  ]);

  const earnings = summarizeEarnings(items);
  const band = scoreBand(seller.score);
  const openAreaIds = new Set(seller.areas.map((area) => area.neighborhoodId));

  // Şehir → ilçe ağacı: bölge ızgarası bunun üzerinden çizilir.
  const cities = new Map<string, Map<string, typeof neighborhoods>>();
  for (const n of neighborhoods) {
    const districts = cities.get(n.city) ?? new Map();
    districts.set(n.district, [...(districts.get(n.district) ?? []), n]);
    cities.set(n.city, districts);
  }

  return (
    <>
      <Link
        href="/admin/saticilar"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-plum-800"
      >
        ← Satıcı yönetimi
      </Link>

      <PanelHeader
        title={seller.storeName}
        description={`${seller.user.name} · ${seller.district ? `${seller.district}, ` : ""}${seller.city} · ${seller._count.products} ürün`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <SellerStatusBadge status={seller.status} />
            <Badge tone={band.tone} dot>
              Puan {seller.score} · {band.label}
            </Badge>
            <AcceptingToggle
              sellerId={seller.id}
              accepting={seller.acceptingOrders}
              reason={seller.pauseReason}
            />
          </div>
        }
      />

      {!seller.acceptingOrders && (
        <p className="mb-6 rounded-lg border border-[#f2c6c2] bg-[#fbe0dd] px-4 py-3 text-[13px] text-[#9c2f2a]">
          Bu bayi şu an sipariş almıyor
          {seller.pauseReason ? ` — ${seller.pauseReason}` : ""}. Ürünleri
          vitrinde görünür ama sepete eklenemez.
        </p>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_1fr]">
        {/* ------------------------- Künye ve ticari ------------------------- */}
        <section className="card card-pad space-y-5">
          <h2 className="text-[15px] font-semibold">Ticari ayarlar</h2>

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <p className="field-label mb-0">Komisyon oranı</p>
              <p className="text-[12px] text-muted">
                Yalnızca yeni siparişleri etkiler; geçmiş kalemler kendi oranını
                korur.
              </p>
            </div>
            <CommissionEditor
              sellerId={seller.id}
              rate={seller.commissionRate}
            />
          </div>

          <div className="border-b border-line pb-4">
            <p className="field-label">Kota</p>
            <QuotaEditor
              sellerId={seller.id}
              dailyQuota={seller.dailyQuota}
              activeQuota={seller.activeQuota}
            />
            <p className="tabular mt-2 text-[12px] text-muted">
              Şu an {activeOrders} açık sipariş taşıyor.
            </p>
          </div>

          <div>
            <p className="field-label">Sorumlu kişi</p>
            <ManagerPicker
              sellerId={seller.id}
              managerId={seller.accountManagerId}
              admins={admins.map((admin) => ({
                id: admin.id,
                name: admin.name,
                title: admin.title,
              }))}
            />
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-faint">
              Seçtiğin kişinin adı ve telefonu bayinin kendi panelinde görünür.
              {seller.accountManager?.phone
                ? ` Şu an: ${seller.accountManager.name} · ${seller.accountManager.phone}`
                : ""}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-4 border-t border-line pt-4 text-[13px]">
            <div>
              <dt className="text-[12px] text-muted">Toplam ciro</dt>
              <dd className="tabular font-semibold">
                {formatPrice(earnings.gross)}
              </dd>
            </div>
            <div>
              <dt className="text-[12px] text-muted">Platform komisyonu</dt>
              <dd className="tabular font-semibold text-bloom-700">
                {formatPrice(earnings.commission)}
              </dd>
            </div>
            <div>
              <dt className="text-[12px] text-muted">Bayi kazancı</dt>
              <dd className="tabular font-semibold">
                {formatPrice(earnings.net)}
              </dd>
            </div>
            <div>
              <dt className="text-[12px] text-muted">Güncel oran</dt>
              <dd className="tabular font-semibold">
                {formatPercent(seller.commissionRate)}
              </dd>
            </div>
          </dl>
        </section>

        {/* ------------------------------ Puan ------------------------------ */}
        <section className="card card-pad space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-semibold">Hizmet puanı</h2>
            <span className="tabular font-display text-[1.6rem] font-semibold leading-none">
              {seller.score}
            </span>
          </div>

          <p className="text-[12.5px] leading-relaxed text-muted">
            Her bayi 100 puanla başlar. Teslimat tarihi geçtiği hâlde yola
            çıkmamış her sipariş otomatik 5 puan düşürür; buradan elle düzeltme
            de yapabilirsin.
          </p>

          <ScoreAdjuster sellerId={seller.id} />

          {seller.scoreEvents.length > 0 && (
            <ul className="space-y-2 border-t border-line pt-3">
              {seller.scoreEvents.map((event) => (
                <li key={event.id} className="flex gap-2.5 text-[12.5px]">
                  <span
                    className={`tabular mt-px w-8 flex-none text-right font-mono font-bold ${
                      event.delta < 0 ? "text-[#9c2f2a]" : "text-plum-700"
                    }`}
                  >
                    {event.delta > 0 ? `+${event.delta}` : event.delta}
                  </span>
                  <span className="min-w-0">
                    <span className="block leading-snug text-plum-900">
                      {event.reason}
                    </span>
                    <span className="block text-[11.5px] text-faint">
                      {formatDateShort(event.createdAt)}
                      {event.orderNo ? ` · ${event.orderNo}` : ""}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* -------------------------- Hizmet bölgeleri -------------------------- */}
      <section className="card card-pad mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold">Hizmet bölgeleri</h2>
            <p className="mt-1 text-[12.5px] text-muted">
              Bu bayinin ürünleri yalnızca açık mahallelere gönderilebilir.
              Kapalı bir mahalleyi seçen müşteri ödeme adımında uyarılır.
            </p>
          </div>
          <span className="flex items-center gap-2 rounded-md bg-plum-50 px-3 py-1.5 text-[12.5px] font-semibold text-plum-800">
            <Icon name="pin" size={14} />
            {seller.areas.length} mahalle açık
          </span>
        </div>

        <div className="mt-5 space-y-6">
          {[...cities.entries()].map(([city, districts]) => (
            <div key={city}>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                {city}
              </h3>
              <div className="mt-2 space-y-3">
                {[...districts.entries()].map(([district, list]) => {
                  const allOpen = list.every((n) => openAreaIds.has(n.id));
                  return (
                    <div
                      key={district}
                      className="rounded-lg border border-line px-3.5 py-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[13px] font-semibold text-plum-950">
                          {district}
                        </p>
                        <DistrictBulkToggle
                          sellerId={seller.id}
                          city={city}
                          district={district}
                          allOpen={allOpen}
                        />
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {list.map((n) => (
                          <AreaToggle
                            key={n.id}
                            sellerId={seller.id}
                            neighborhoodId={n.id}
                            name={n.name}
                            open={openAreaIds.has(n.id)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
