/**
 * Teslimat bölgesi (madde 12 ve 15).
 *
 * Çiçek kargoyla değil, alıcıya en yakın çiçekçiden gider. Bu yüzden her ürün
 * her mahalleye gönderilemez: operasyon ekibi bayi ↔ mahalle eşleşmesini açar
 * (`SellerArea`), müşteri de siparişi göndereceği mahalleyi seçer.
 *
 * Seçim çerezde tutulur — sepet gibi. Seçim yoksa katalog daraltılmaz; sunumu
 * açan kişi boş bir ekranla karşılaşmasın.
 */

import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "./db";

export const AREA_COOKIE = "cicek_demo_bolge";

export type AreaOption = {
  id: string;
  city: string;
  district: string;
  name: string;
  slug: string;
};

/** Seçili mahalle. Çerez bozuksa veya mahalle silinmişse null. */
export const getSelectedArea = cache(async (): Promise<AreaOption | null> => {
  const store = await cookies();
  const id = store.get(AREA_COOKIE)?.value;
  if (!id) return null;

  const area = await db.neighborhood.findUnique({ where: { id } });
  if (!area) return null;

  return {
    id: area.id,
    city: area.city,
    district: area.district,
    name: area.name,
    slug: area.slug,
  };
});

/** "Kadıköy / Caferağa" — başlıktaki bölge düğmesinin metni. */
export const areaLabel = (area: AreaOption) => `${area.district} / ${area.name}`;
export const areaFullLabel = (area: AreaOption) =>
  `${area.city}, ${area.district}, ${area.name} Mah.`;

/** Şehir → ilçe → mahalle ağacı; bölge seçme ekranı bunu çizer. */
export const getAreaTree = cache(async () => {
  const rows = await db.neighborhood.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      // Yalnızca **çiçek satan onaylı** bayiler sayılır. Onay bekleyen bir
      // bayinin bölgesi ya da yalnızca hediye eki gönderen tedarikçi, mahalleyi
      // açık göstermemeli — yoksa müşteri boş bir katalogla karşılaşır.
      _count: {
        select: {
          sellers: {
            where: {
              seller: {
                status: "APPROVED",
                products: { some: { isActive: true, isAddOn: false } },
              },
            },
          },
        },
      },
    },
  });

  const cities = new Map<
    string,
    Map<string, { id: string; name: string; slug: string; sellerCount: number }[]>
  >();

  for (const row of rows) {
    const districts = cities.get(row.city) ?? new Map();
    const list = districts.get(row.district) ?? [];
    list.push({
      id: row.id,
      name: row.name,
      slug: row.slug,
      sellerCount: row._count.sellers,
    });
    districts.set(row.district, list);
    cities.set(row.city, districts);
  }

  return [...cities.entries()].map(([city, districts]) => ({
    city,
    districts: [...districts.entries()].map(([district, neighborhoods]) => ({
      district,
      neighborhoods,
    })),
  }));
});

/**
 * Seçili bölgeye gönderilebilen ürünlerin Prisma filtresi.
 * Bölge seçilmemişse boş nesne döner — katalog daralmaz.
 */
export async function areaFilter() {
  const area = await getSelectedArea();
  if (!area) return {};
  return { seller: { areas: { some: { neighborhoodId: area.id } } } };
}

/** Bu mağaza seçili bölgeye gönderim yapıyor mu? */
export async function sellerServesSelectedArea(sellerId: string): Promise<boolean> {
  const area = await getSelectedArea();
  if (!area) return true;

  const match = await db.sellerArea.findFirst({
    where: { sellerId, neighborhoodId: area.id },
    select: { id: true },
  });
  return match !== null;
}

/** Belirli bir mahalleye hizmet veren onaylı mağazalar. */
export async function sellersForArea(neighborhoodId: string) {
  const rows = await db.sellerArea.findMany({
    where: { neighborhoodId, seller: { status: "APPROVED" } },
    include: { seller: true },
  });
  return rows.map((row) => row.seller);
}
