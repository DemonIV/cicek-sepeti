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

/**
 * "Adres seçmek ister misin?" modalı bir kez soruldu mu? Müşteri seçim
 * yapmadan kapattıysa her sayfada tekrar açılıp sunumu kesmesin diye.
 */
export const AREA_PROMPT_COOKIE = "cicek_demo_bolge_soruldu";

/** Modal kendiliğinden açılsın mı? Bölge seçilmemiş ve daha önce sorulmamışsa. */
export const shouldAskForArea = cache(async () => {
  const [store, area] = await Promise.all([cookies(), getSelectedArea()]);
  if (area) return false;
  return store.get(AREA_PROMPT_COOKIE)?.value !== "1";
});

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

/* ------------------------------ Adres arama ------------------------------- */

/**
 * "Nereye göndereceksin?" kutusundaki arama (23 Ağustos isteği).
 *
 * Müşteri mahalle adını bilmeyebilir; okulu, hastaneyi, plazayı bilir. Bu
 * yüzden hem mahalleler hem de `Landmark` kayıtları taranır ve sonuç her
 * durumda bir **mahalleye** işaret eder — teslimat bölgesi mahalle üzerinden
 * belirlenir.
 */
export type AreaSearchHit = {
  neighborhoodId: string;
  /** Kalın yazılan ad: mahalle ya da nokta adı. */
  title: string;
  /** "İstanbul, Kadıköy · Caferağa Mah." */
  subtitle: string;
  /** Nokta türü; mahallenin kendisi ise null. */
  kind: string | null;
  /** Oraya hizmet veren onaylı çiçekçi sayısı; 0 ise seçilemez. */
  sellerCount: number;
};

/** Onaylı ve çiçek satan bayilerin sayısı — mahallenin "açık" olma ölçütü. */
const sellerCountFilter = {
  where: {
    seller: {
      status: "APPROVED",
      products: { some: { isActive: true, isAddOn: false } },
    },
  },
} as const;

export async function searchAreas(query: string): Promise<AreaSearchHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const [neighborhoods, landmarks] = await Promise.all([
    db.neighborhood.findMany({
      where: {
        OR: [{ name: { contains: q } }, { district: { contains: q } }],
      },
      include: { _count: { select: { sellers: sellerCountFilter } } },
      orderBy: { sortOrder: "asc" },
      take: 8,
    }),
    db.landmark.findMany({
      where: { name: { contains: q } },
      include: {
        neighborhood: {
          include: { _count: { select: { sellers: sellerCountFilter } } },
        },
      },
      take: 8,
    }),
  ]);

  const hits: AreaSearchHit[] = [
    ...neighborhoods.map((n) => ({
      neighborhoodId: n.id,
      title: `${n.name} Mah.`,
      subtitle: `${n.city}, ${n.district}`,
      kind: null,
      sellerCount: n._count.sellers,
    })),
    ...landmarks.map((l) => ({
      neighborhoodId: l.neighborhoodId,
      title: l.name,
      subtitle: `${l.neighborhood.city}, ${l.neighborhood.district} · ${l.neighborhood.name} Mah.`,
      kind: l.kind,
      sellerCount: l.neighborhood._count.sellers,
    })),
  ];

  // Açık mahalleler önce: kapalı bir sonuç listenin başında görünüp
  // müşteriyi boşuna uğraştırmasın.
  hits.sort((a, b) => Number(b.sellerCount > 0) - Number(a.sellerCount > 0));
  return hits.slice(0, 10);
}

/** Modaldaki "Kayıtlı Adresler" listesi — yalnızca mahallesi bilinen adresler. */
export async function savedAddressesForArea(userId: string) {
  const rows = await db.address.findMany({
    where: { userId },
    include: {
      neighborhood: {
        include: { _count: { select: { sellers: sellerCountFilter } } },
      },
    },
    orderBy: [{ isDefault: "desc" }, { title: "asc" }],
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    fullAddress: row.fullAddress,
    city: row.city,
    district: row.district,
    neighborhoodId: row.neighborhoodId,
    neighborhoodName: row.neighborhood?.name ?? null,
    sellerCount: row.neighborhood?._count.sellers ?? 0,
  }));
}

export type SavedAddressOption = Awaited<
  ReturnType<typeof savedAddressesForArea>
>[number];
