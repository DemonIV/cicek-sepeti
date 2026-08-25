/**
 * Demo veritabanını sıfırdan kurar. `npm run seed` her çalıştığında mevcut
 * veriyi siler ve aynı içeriği yeniden üretir — sunumdan önce tek komutla
 * temiz bir başlangıç.
 *
 * Rastgelelik sabit tohumlu: her kurulumda aynı sipariş tablosu oluşur, sunum
 * yapan kişi ekranda sürprizle karşılaşmaz.
 */

import { PrismaClient } from "@prisma/client";
import {
  CATEGORIES,
  COURIERS,
  CUSTOMERS,
  GIFT_NOTES,
  PRODUCTS,
  SELLERS,
} from "./seed-data";
import {
  ADD_ONS,
  ADDON_SELLER,
  ADMINS,
  CROP_VARIANTS,
  DISCOUNTS,
  INVOICE_MONTHS,
  LANDMARKS,
  NEIGHBORHOODS,
  OCCASIONS,
  PACKAGING_SHOTS,
  PRODUCT_REQUESTS,
  PRODUCT_VIDEOS,
  REVIEW_CITIES,
  REVIEW_REPLIES,
  REVIEW_TEXTS,
  SELLER_AREAS,
  WEEKLY_PICK_SLUG,
} from "./seed-extra";

const db = new PrismaClient();

/* ----------------------------- Yardımcılar -------------------------------- */

/** Sabit tohumlu üreteç — seed her çalıştığında aynı sonucu verir. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rnd = mulberry32(20260727);
const rint = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1));
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)];
const chance = (p: number) => rnd() < p;

const DAY = 24 * 60 * 60 * 1000;
const now = new Date();
const daysAgo = (days: number, hour = 10) => {
  const d = new Date(now.getTime() - days * DAY);
  d.setHours(hour, rint(0, 59), 0, 0);
  return d;
};
const daysFromNow = (days: number, hour = 10) => daysAgo(-days, hour);

const slugify = (input: string) => {
  const map: Record<string, string> = {
    ç: "c", ğ: "g", ı: "i", İ: "i", ö: "o", ş: "s", ü: "u",
    Ç: "c", Ğ: "g", Ö: "o", Ş: "s", Ü: "u",
  };
  return input
    .replace(/[çğıİöşüÇĞÖŞÜ]/g, (ch) => map[ch] ?? ch)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
const FREE_SHIPPING_THRESHOLD = 1000;
const SHIPPING_FEE = 79.9;

const DELIVERY_SLOTS = ["09:00 - 12:00", "12:00 - 15:00", "15:00 - 18:00", "18:00 - 21:00"];

/** Aynı fotoğrafın farklı kadrajı — galerideki yakın plan ve alternatif açı. */
const cropVariant = (url: string, variant: string) =>
  `${url}${url.includes("?") ? "&" : "?"}${variant}`;

/* --------------------------- Sipariş dağılımı ----------------------------- */

/**
 * Sipariş durumlarının dağılımı ve yaşları. Aktif siparişler son günlere,
 * teslim edilenler geriye yayılır; böylece admin panelindeki 7 günlük grafik
 * ve ciro raporu dolu görünür.
 */
const ORDER_PLAN: { status: string; count: number; minDays: number; maxDays: number }[] = [
  { status: "BEKLEMEDE", count: 4, minDays: 0, maxDays: 1 },
  { status: "ONAYLANDI", count: 5, minDays: 0, maxDays: 2 },
  { status: "HAZIRLANIYOR", count: 6, minDays: 0, maxDays: 3 },
  { status: "YOLDA", count: 5, minDays: 0, maxDays: 2 },
  { status: "IPTAL", count: 3, minDays: 4, maxDays: 22 },
  { status: "TESLIM_EDILDI", count: 15, minDays: 1, maxDays: 29 },
];

const FLOW = ["BEKLEMEDE", "ONAYLANDI", "HAZIRLANIYOR", "YOLDA", "TESLIM_EDILDI"];

const EVENT_LABEL: Record<string, string> = {
  BEKLEMEDE: "Sipariş oluşturuldu",
  ONAYLANDI: "Ödeme onaylandı",
  HAZIRLANIYOR: "Çiçekçi hazırlamaya başladı",
  YOLDA: "Kurye teslimat için yola çıktı",
  TESLIM_EDILDI: "Sipariş teslim edildi",
  IPTAL: "Sipariş iptal edildi",
};

/* --------------------------------- Kurulum -------------------------------- */

async function reset() {
  await db.auditLog.deleteMany();
  await db.productRequest.deleteMany();
  await db.invoice.deleteMany();
  await db.preparationPhoto.deleteMany();
  await db.sellerScoreEvent.deleteMany();
  await db.orderEvent.deleteMany();
  await db.delivery.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.review.deleteMany();
  await db.productOccasion.deleteMany();
  await db.occasion.deleteMany();
  await db.productMedia.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();
  await db.sellerArea.deleteMany();
  await db.landmark.deleteMany();
  await db.neighborhood.deleteMany();
  await db.seller.deleteMany();
  await db.address.deleteMany();
  await db.user.deleteMany();
}

async function main() {
  console.log("→ Mevcut veri siliniyor…");
  await reset();

  /* -------------------------------- Adminler ------------------------------ */
  /* Üç kişi de kendi ismiyle girer; yaptıkları denetim izine düşer (madde 20). */
  const admins = [];
  for (const [index, a] of ADMINS.entries()) {
    admins.push(
      await db.user.create({
        data: {
          name: a.name,
          email: a.email,
          phone: a.phone,
          title: a.title,
          role: "ADMIN",
          createdAt: daysAgo(400 - index * 30),
        },
      }),
    );
  }
  const admin = admins[0];

  /* ------------------------------- Kuryeler ------------------------------- */
  const couriers = [];
  for (const [index, c] of COURIERS.entries()) {
    couriers.push(
      await db.user.create({
        data: {
          name: c.name,
          email: c.email,
          phone: c.phone,
          role: "COURIER",
          createdAt: daysAgo(300 - index * 40),
        },
      }),
    );
  }

  /* ------------------------------- Müşteriler ----------------------------- */
  const customers = [];
  for (const [index, c] of CUSTOMERS.entries()) {
    const user = await db.user.create({
      data: {
        name: c.name,
        email: c.email,
        phone: c.phone,
        role: "CUSTOMER",
        createdAt: daysAgo(500 - index * 25),
        addresses: {
          create: [
            {
              title: "Ev",
              city: c.city,
              district: c.district,
              fullAddress: c.address,
              isDefault: true,
            },
          ],
        },
      },
    });
    customers.push({ user, seed: c });
  }

  // Birkaç müşteriye ikinci adres — "Adreslerim" ekranı tek satır görünmesin.
  for (const c of customers.slice(0, 5)) {
    await db.address.create({
      data: {
        userId: c.user.id,
        title: "İş",
        city: c.seed.city,
        district: c.seed.district,
        fullAddress: `${c.seed.district} Plaza, Kat ${rint(2, 12)}, No:${rint(10, 90)}`,
      },
    });
  }

  /* ------------------------------- Mahalleler ----------------------------- */
  /* Teslimat bölgesi (madde 12) ve bayi eşleşmesi (madde 15) buradan yürür. */
  const neighborhoods = [];
  let order = 0;
  for (const group of NEIGHBORHOODS) {
    for (const name of group.names) {
      neighborhoods.push(
        await db.neighborhood.create({
          data: {
            city: group.city,
            district: group.district,
            name,
            slug: slugify(`${group.city} ${group.district} ${name}`),
            sortOrder: order++,
          },
        }),
      );
    }
  }

  /* ---------------------- Adres noktaları ve adres bağı ------------------- */
  /* Arama kutusu mahalle adı yerine okul/hastane/plaza ile de bulsun (23 Ağu). */
  let landmarkCount = 0;
  for (const neighborhood of neighborhoods) {
    for (const [name, kind] of LANDMARKS[neighborhood.name] ?? []) {
      await db.landmark.create({
        data: { name, kind, neighborhoodId: neighborhood.id },
      });
      landmarkCount++;
    }
  }

  /* Kayıtlı adresler mahalleye bağlanır: müşteri "Kayıtlı Adresler"den birini
     seçince teslimat bölgesi kendiliğinden belirlensin. */
  for (const address of await db.address.findMany()) {
    const match = neighborhoods.filter(
      (n) => n.city === address.city && n.district === address.district,
    );
    if (!match.length) continue;
    const hit =
      match.find((n) => address.fullAddress.startsWith(n.name)) ?? match[0];
    await db.address.update({
      where: { id: address.id },
      data: { neighborhoodId: hit.id },
    });
  }

  /* -------------------------------- Satıcılar ----------------------------- */
  const ALL_SELLERS = [...SELLERS, ADDON_SELLER];
  const sellers = [];
  for (const [index, s] of ALL_SELLERS.entries()) {
    // Tek bir tarih: hesabın açılışı ile başvuru aynı ana düşsün. Onaylı
    // mağazalar dizideki sıraya göre eskiden yeniye — rol değiştirici ve
    // listeler her kurulumda aynı sırayla görünür.
    const appliedDaysAgo = "appliedDaysAgo" in s ? s.appliedDaysAgo : 600 - index * 90;

    const owner = await db.user.create({
      data: {
        name: s.owner,
        email: s.email,
        phone: s.phone,
        role: "SELLER",
        createdAt: daysAgo(appliedDaysAgo),
      },
    });

    const seller = await db.seller.create({
      data: {
        userId: owner.id,
        storeName: s.storeName,
        slug: s.slug,
        city: s.city,
        district: s.district,
        phone: s.phone,
        about: s.about,
        coverUrl: s.coverUrl,
        status: s.status,
        commissionRate: s.commissionRate,
        rating: s.rating,
        appliedAt: daysAgo(appliedDaysAgo),
        // Sorumlu kişi: bayi ilişkileri ve operasyon arasında paylaştırılır
        // (madde 21). Onay bekleyenlerin henüz sorumlusu yok.
        accountManagerId:
          s.status === "APPROVED" ? admins[index % admins.length].id : null,
        acceptingOrders: true,
        dailyQuota: s.status === "APPROVED" ? [25, 18, 20, 15, 16, 20, 60][index] ?? 20 : null,
        activeQuota: s.status === "APPROVED" ? [12, 8, 10, 6, 8, 10, 30][index] ?? 10 : null,
      },
    });

    sellers.push(seller);
  }

  /* --------------------------- Bayi ↔ mahalle ----------------------------- */
  for (const seller of sellers) {
    const rules = SELLER_AREAS[seller.slug];
    if (!rules) continue;

    // Kural listesi boşsa bayi tüm mahallelere hizmet verir (kargolu tedarikçi).
    const matched = rules.length
      ? neighborhoods.filter((n) =>
          rules.some(
            (rule) =>
              rule.district === n.district &&
              (!rule.names || rule.names.includes(n.name)),
          ),
        )
      : neighborhoods;

    for (const n of matched) {
      await db.sellerArea.create({
        data: { sellerId: seller.id, neighborhoodId: n.id },
      });
    }
  }

  /* ------------------------------- Kategoriler ---------------------------- */
  const categories = [];
  for (const [index, c] of CATEGORIES.entries()) {
    categories.push(
      await db.category.create({
        data: { name: c.name, slug: c.slug, imageUrl: c.imageUrl, sortOrder: index },
      }),
    );
  }

  // Ek ürünlerin kategorisi gezinmede görünmez: katalogda tek başına
  // listelenmezler, siparişin yanına eklenirler (madde 6).
  const addOnCategory = await db.category.create({
    data: {
      name: "Hediye Ekleri",
      slug: "hediye-ekleri",
      imageUrl: PACKAGING_SHOTS["hediye-ekleri"],
      sortOrder: 99,
      isHidden: true,
    },
  });

  /* --------------------------------- Ürünler ------------------------------ */
  const discountBySlug = new Map(DISCOUNTS.map((d) => [d.slug, d]));
  const products = [];

  for (const p of PRODUCTS) {
    const category = categories.find((c) => c.slug === p.category)!;
    const seller = sellers[p.seller];
    const slug = slugify(p.name);
    const discount = discountBySlug.get(slug);

    const product = await db.product.create({
      data: {
        sellerId: seller.id,
        categoryId: category.id,
        name: p.name,
        slug,
        description: p.description,
        price: p.price,
        stock: p.stock,
        imageUrl: p.image,
        isActive: true,
        isFeatured: p.featured ?? false,
        isWeeklyPick: slug === WEEKLY_PICK_SLUG,
        videoUrl: PRODUCT_VIDEOS[slug] ?? null,
        discountPrice: discount?.price ?? null,
        discountStartsAt: discount ? daysFromNow(discount.startsIn, 9) : null,
        discountEndsAt: discount ? daysFromNow(discount.endsIn, 23) : null,
        rating: round2(4.3 + rnd() * 0.7),
        reviewCount: rint(6, 240),
        createdAt: daysAgo(rint(20, 400)),
      },
      include: { seller: true },
    });

    // Galeri: iki kadraj + ambalaj karesi + varsa video (madde 23).
    const gallery: { url: string; kind: string; sortOrder: number }[] = [
      { url: p.image, kind: "IMAGE", sortOrder: 0 },
      { url: cropVariant(p.image, CROP_VARIANTS[0]), kind: "IMAGE", sortOrder: 1 },
      { url: cropVariant(p.image, CROP_VARIANTS[1]), kind: "IMAGE", sortOrder: 2 },
    ];
    const packaging = PACKAGING_SHOTS[p.category];
    if (packaging) gallery.push({ url: packaging, kind: "IMAGE", sortOrder: 3 });
    if (PRODUCT_VIDEOS[slug]) {
      gallery.push({ url: PRODUCT_VIDEOS[slug], kind: "VIDEO", sortOrder: 4 });
    }

    await db.productMedia.createMany({
      data: gallery.map((m) => ({ ...m, productId: product.id })),
    });

    products.push(product);
  }

  // İstenen indirim/vitrin ürünleri gerçekten bulundu mu? Slug'ı kayan bir
  // ürün sessizce indirimsiz kalmasın.
  for (const d of DISCOUNTS) {
    if (!products.some((p) => p.slug === d.slug)) {
      throw new Error(`İndirim tanımlı ama ürün yok: ${d.slug}`);
    }
  }
  if (!products.some((p) => p.slug === WEEKLY_PICK_SLUG)) {
    throw new Error(`Haftanın ürünü bulunamadı: ${WEEKLY_PICK_SLUG}`);
  }

  /* -------------------------------- Ek ürünler ---------------------------- */
  const addOnSeller = sellers.find((s) => s.slug === ADDON_SELLER.slug)!;
  const addOns = [];
  for (const a of ADD_ONS) {
    const product = await db.product.create({
      data: {
        sellerId: addOnSeller.id,
        categoryId: addOnCategory.id,
        name: a.name,
        slug: slugify(a.name),
        description: a.description,
        price: a.price,
        stock: a.stock,
        imageUrl: a.image,
        isActive: true,
        isAddOn: true,
        addOnKind: a.kind,
        rating: round2(4.4 + rnd() * 0.6),
        reviewCount: rint(20, 180),
        createdAt: daysAgo(rint(60, 300)),
      },
      include: { seller: true },
    });

    await db.productMedia.createMany({
      data: [
        { productId: product.id, url: a.image, kind: "IMAGE", sortOrder: 0 },
        {
          productId: product.id,
          url: cropVariant(a.image, CROP_VARIANTS[0]),
          kind: "IMAGE",
          sortOrder: 1,
        },
        {
          productId: product.id,
          url: cropVariant(a.image, CROP_VARIANTS[1]),
          kind: "IMAGE",
          sortOrder: 2,
        },
      ],
    });

    addOns.push(product);
  }

  /* ------------------------- Bayi başına satılabilir ---------------------- */
  const sellableProducts = products.filter((p) => p.seller.status === "APPROVED");

  // Hangi bayi hangi mahalleye hizmet veriyor — sipariş kurarken lazım.
  const areaRows = await db.sellerArea.findMany();
  const sellersByNeighborhood = new Map<string, Set<string>>();
  for (const row of areaRows) {
    const set = sellersByNeighborhood.get(row.neighborhoodId) ?? new Set<string>();
    set.add(row.sellerId);
    sellersByNeighborhood.set(row.neighborhoodId, set);
  }

  /* -------------------------------- Siparişler ---------------------------- */
  let orderCounter = 1;
  const orderRows: { status: string; ageDays: number }[] = [];
  for (const plan of ORDER_PLAN) {
    for (let i = 0; i < plan.count; i++) {
      orderRows.push({ status: plan.status, ageDays: rint(plan.minDays, plan.maxDays) });
    }
  }
  orderRows.sort((a, b) => b.ageDays - a.ageDays);

  // Çiçek gönderilebilen mahalleler: en az bir çiçekçinin (hediye deposu
  // dışında) hizmet verdiği yerler. Antalya'nın bayisi hâlâ onay beklediği için
  // oraya sipariş düşmez — demo'daki başvuru ekranıyla tutarlı.
  const deliverableNeighborhoods = neighborhoods.filter((n) => {
    const ids = sellersByNeighborhood.get(n.id) ?? new Set<string>();
    return sellableProducts.some((p) => ids.has(p.sellerId));
  });

  const lateOrders: { sellerId: string; orderNo: string; createdAt: Date }[] = [];

  for (const row of orderRows) {
    const createdAt = daysAgo(row.ageDays, rint(9, 20));
    const customer = pick(customers);

    // Önce teslimat mahallesi seçilir; ürünler yalnızca oraya hizmet veren
    // bayilerden gelir. "Her ürün her bölgeye gitmez" kuralı seed'de de geçerli.
    const neighborhood = pick(deliverableNeighborhoods);
    const eligibleSellerIds = sellersByNeighborhood.get(neighborhood.id) ?? new Set();
    const eligible = sellableProducts.filter((p) => eligibleSellerIds.has(p.sellerId));
    if (eligible.length === 0) continue;

    const lineCount = rint(1, 2);
    const chosen: typeof eligible = [];
    let guard = 0;
    while (chosen.length < lineCount && guard++ < 40) {
      const candidate = pick(eligible);
      if (chosen.some((c) => c.id === candidate.id)) continue;
      chosen.push(candidate);
    }

    // Siparişlerin bir kısmı bilinçli olarak çok satıcılı: çiçek çiçekçiden,
    // ek ürün hediye deposundan çıkar (madde 6).
    const withAddOn = chance(0.45);
    const addOn = withAddOn ? pick(addOns) : null;

    const items = [
      ...chosen.map((product) => ({
        productId: product.id,
        sellerId: product.sellerId,
        productName: product.name,
        productImage: product.imageUrl,
        quantity: rint(1, 2),
        unitPrice: product.price,
        commissionRate: product.seller.commissionRate,
        status: row.status,
        isAddOn: false,
      })),
      ...(addOn
        ? [
            {
              productId: addOn.id,
              sellerId: addOn.sellerId,
              productName: addOn.name,
              productImage: addOn.imageUrl,
              quantity: 1,
              unitPrice: addOn.price,
              commissionRate: addOn.seller.commissionRate,
              status: row.status,
              isAddOn: true,
            },
          ]
        : []),
    ];

    const subtotal = round2(
      items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    );
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

    const recipient = pick(CUSTOMERS);
    const deliveryDate = new Date(createdAt.getTime() + rint(0, 2) * DAY);
    const isCancelled = row.status === "IPTAL";
    // Hediye notu ürünün kategorisine uymalı: "Başın sağ olsun" notu çelenkte
    // durur, doğum günü buketinde değil. Ana kalem (ek ürün değil) belirler;
    // uyan not yoksa sipariş notsuz kalır.
    const noteCategory = categories.find((c) => c.id === chosen[0].categoryId)?.slug;
    const noteOptions = noteCategory
      ? GIFT_NOTES.filter((n) => n.fits.includes(noteCategory))
      : [];
    const giftNote =
      chance(0.82) && noteOptions.length > 0 ? pick(noteOptions).text : null;

    const orderNo = `CS-${now.getFullYear()}-${String(orderCounter++).padStart(4, "0")}`;

    const created = await db.order.create({
      data: {
        // Numara biçimi `nextOrderNo()` ile aynı olmalı: demo sırasında verilen
        // yeni sipariş, seed'den gelenlerle aynı seride görünsün.
        orderNo,
        customerId: customer.user.id,
        status: row.status,
        subtotal,
        shippingFee: shipping,
        total: round2(subtotal + shipping),
        recipientName: recipient.name,
        recipientPhone: recipient.phone,
        deliveryCity: neighborhood.city,
        deliveryDistrict: neighborhood.district,
        neighborhoodId: neighborhood.id,
        deliveryAddress: `${neighborhood.name} Mah. ${pick([
          "Bağdat Cad.",
          "Gül Sok.",
          "İnönü Cad.",
          "Zambak Sok.",
          "Cumhuriyet Cad.",
        ])} No:${rint(3, 180)} D:${rint(1, 22)}`,
        giftNote,
        // Gönderici ismi (madde 13): notların çoğu imzalı, bir kısmı bilerek
        // imzasız — "gönderici ismi istenmezse kutucuk kapansın".
        senderName: giftNote && chance(0.72) ? customer.user.name : null,
        deliveryDate,
        deliverySlot: pick(DELIVERY_SLOTS),
        paymentMethod: "KART",
        paymentStatus: isCancelled ? "BASARISIZ" : row.status === "BEKLEMEDE" ? "BEKLIYOR" : "ODENDI",
        cancelReason: isCancelled
          ? pick(["Müşteri talebiyle iptal edildi", "Adres bulunamadı", "Ürün tedarik edilemedi"])
          : null,
        createdAt,
        updatedAt: createdAt,
        items: { create: items },
      },
    });

    /* --------------------------- Sipariş geçmişi -------------------------- */
    const reachedIndex = isCancelled ? 1 : FLOW.indexOf(row.status);
    const timeline = FLOW.slice(0, reachedIndex + 1);
    let stamp = createdAt.getTime();

    for (const [index, status] of timeline.entries()) {
      stamp += index === 0 ? 0 : rint(40, 300) * 60 * 1000;
      await db.orderEvent.create({
        data: {
          orderId: created.id,
          status,
          label: EVENT_LABEL[status],
          actor:
            status === "HAZIRLANIYOR"
              ? `Satıcı: ${chosen[0].seller.storeName}`
              : status === "YOLDA" || status === "TESLIM_EDILDI"
                ? "Kurye"
                : status === "ONAYLANDI"
                  ? "Ödeme sistemi"
                  : `Müşteri: ${customer.user.name}`,
          createdAt: new Date(stamp),
        },
      });
    }

    if (isCancelled) {
      stamp += rint(60, 600) * 60 * 1000;
      await db.orderEvent.create({
        data: {
          orderId: created.id,
          status: "IPTAL",
          label: EVENT_LABEL.IPTAL,
          actor: "Admin: " + admin.name,
          createdAt: new Date(stamp),
        },
      });
    }

    /* ------------------------- Hazırlık onay görseli ---------------------- */
    /* Satıcı buketi hazırlayınca fotoğrafını yükler (madde 22). Demo verisinde
       ürünün kendi karesinin yakın planı kullanılır. */
    if (!isCancelled && FLOW.indexOf(row.status) >= FLOW.indexOf("HAZIRLANIYOR") && chance(0.7)) {
      await db.preparationPhoto.create({
        data: {
          orderId: created.id,
          sellerId: chosen[0].sellerId,
          imageUrl: cropVariant(chosen[0].imageUrl, CROP_VARIANTS[0]),
          note: pick([
            "Buket hazır, kurdelesi bağlandı.",
            "Hazırlandı, kart notu iliştirildi.",
            "Tezgâhtan çıkarken çekildi.",
            null,
          ]),
          createdAt: new Date(createdAt.getTime() + rint(60, 400) * 60 * 1000),
        },
      });
    }

    /* ------------------------------ Teslimat ------------------------------ */
    const needsCourier = ["YOLDA", "TESLIM_EDILDI"].includes(row.status);
    const maybeAssigned = row.status === "HAZIRLANIYOR" && chance(0.5);
    const courier = needsCourier || maybeAssigned ? pick(couriers) : null;

    // Teslim anı fotoğrafı: kurye çiçeği bıraktığı kareyi gönderir, müşteri
    // takip ekranında görür. Hazırlık karesinden farklı bir kadraj kullanılır
    // ki ikisi arka arkaya aynı fotoğraf gibi durmasın.
    const proofPhotoUrl =
      row.status === "TESLIM_EDILDI" && chance(0.7)
        ? cropVariant(chosen[0].imageUrl, CROP_VARIANTS[1])
        : null;

    await db.delivery.create({
      data: {
        orderId: created.id,
        courierId: courier?.id ?? null,
        status: isCancelled
          ? "ATANMADI"
          : row.status === "TESLIM_EDILDI"
            ? "TESLIM_EDILDI"
            : row.status === "YOLDA"
              ? "YOLDA"
              : courier
                ? "ATANDI"
                : "ATANMADI",
        assignedAt: courier ? new Date(createdAt.getTime() + rint(30, 400) * 60 * 1000) : null,
        // Arabaya veriliş anı (madde 18): kurye listesine bundan sonra düşer.
        dispatchedAt: needsCourier ? new Date(stamp - rint(40, 200) * 60 * 1000) : null,
        pickedUpAt: needsCourier ? new Date(stamp - rint(30, 180) * 60 * 1000) : null,
        deliveredAt: row.status === "TESLIM_EDILDI" ? new Date(stamp) : null,
        proofPhotoUrl,
      },
    });

    // Ödemesi yarım kalan siparişlerin bir kısmına hatırlatma gitmiş (madde 14).
    if (row.status === "BEKLEMEDE" && chance(0.5)) {
      await db.order.update({
        where: { id: created.id },
        data: {
          reminderCount: 1,
          lastReminderAt: new Date(createdAt.getTime() + rint(30, 180) * 60 * 1000),
        },
      });
    }

    // Teslim tarihi geçtiği hâlde yola çıkmamış siparişler puan düşürür.
    if (!isCancelled && row.status === "HAZIRLANIYOR" && deliveryDate.getTime() < now.getTime()) {
      lateOrders.push({ sellerId: chosen[0].sellerId, orderNo, createdAt });
    }

    await db.order.update({
      where: { id: created.id },
      data: { updatedAt: new Date(stamp) },
    });
  }

  /* ------------------------------- Bayi puanı ----------------------------- */
  /* Puan 100'den başlar; gecikme başına 5 puan iner (madde 17). Geçmiş
     hareketler de yazılır ki tablo boş görünmesin. */
  for (const late of lateOrders) {
    await db.sellerScoreEvent.create({
      data: {
        sellerId: late.sellerId,
        delta: -5,
        reason: "Teslimat tarihi geçti, sipariş hâlâ hazırlıkta",
        orderNo: late.orderNo,
        createdAt: new Date(late.createdAt.getTime() + 2 * DAY),
      },
    });
  }

  const approvedSellers = sellers.filter((s) => s.status === "APPROVED");
  for (const [index, seller] of approvedSellers.entries()) {
    if (index % 3 === 0) {
      await db.sellerScoreEvent.create({
        data: {
          sellerId: seller.id,
          delta: +3,
          reason: "Ay boyunca gecikmesiz teslimat",
          createdAt: daysAgo(rint(8, 25)),
        },
      });
    }
    if (index % 4 === 1) {
      await db.sellerScoreEvent.create({
        data: {
          sellerId: seller.id,
          delta: -5,
          reason: "Müşteri şikâyeti: buket görseldekinden küçük",
          createdAt: daysAgo(rint(5, 20)),
        },
      });
    }
  }

  for (const seller of sellers) {
    const events = await db.sellerScoreEvent.findMany({ where: { sellerId: seller.id } });
    const score = Math.max(0, Math.min(100, 100 + events.reduce((s, e) => s + e.delta, 0)));
    await db.seller.update({ where: { id: seller.id }, data: { score } });
  }

  /* -------------------------------- Faturalar ----------------------------- */
  /* Satıcı yükler, finans onaylar (madde 1 ve 2). */
  for (const seller of approvedSellers) {
    const owner = await db.user.findUnique({ where: { id: seller.userId } });
    for (const [index, month] of INVOICE_MONTHS.entries()) {
      const items = await db.orderItem.findMany({
        where: { sellerId: seller.id },
        select: { unitPrice: true, quantity: true, commissionRate: true },
      });
      const commission = round2(
        items.reduce((sum, i) => sum + i.unitPrice * i.quantity * i.commissionRate, 0) /
          INVOICE_MONTHS.length,
      );
      if (commission <= 0) continue;

      await db.invoice.create({
        data: {
          sellerId: seller.id,
          periodLabel: month,
          invoiceNo: `${seller.slug.slice(0, 3).toUpperCase()}-${month.replace("-", "")}-${rint(100, 999)}`,
          amount: commission,
          fileName: `${month}-komisyon-faturasi.pdf`,
          fileType: "application/pdf",
          fileSize: rint(48, 320) * 1024,
          status: index === 0 ? "ONAYLANDI" : pick(["BEKLIYOR", "BEKLIYOR", "ONAYLANDI"]),
          uploadedBy: `Satıcı: ${owner?.name ?? seller.storeName}`,
          createdAt: daysAgo(index === 0 ? rint(40, 55) : rint(6, 20)),
          reviewedAt: index === 0 ? daysAgo(rint(30, 38)) : null,
          reviewedBy: index === 0 ? admins[2].name : null,
        },
      });
    }
  }

  /* ---------------------------- Gönderim amacı ---------------------------- */
  /* Kategori "ne", amaç "niçin". Müşteri çoğu zaman ikincisini arıyor. */
  const occasions = [];
  for (const [index, o] of OCCASIONS.entries()) {
    occasions.push(
      await db.occasion.create({
        data: {
          name: o.name,
          slug: o.slug,
          tagline: o.tagline,
          imageUrl: o.image,
          sortOrder: index,
        },
      }),
    );
  }

  {
    const catalog = await db.product.findMany({
      where: { isAddOn: false },
      include: { category: true },
    });

    // Ürün başına en fazla dört amaç: her buket her niyete uymaz, uydurursak
    // filtre anlamını yitirir.
    const perProduct = new Map<string, number>();
    let tagCount = 0;
    for (const [index, o] of OCCASIONS.entries()) {
      const occasion = occasions[index];
      const pool = catalog.filter((product) =>
        o.categories.includes(product.category.slug),
      );

      // Ad geçen ürünler öncelikli; azsa kategori havuzundan tamamlanır ki
      // hiçbir amaç boş sayfa açmasın.
      const named = pool.filter((product) =>
        (o.keywords ?? []).some((word) =>
          product.name.toLocaleLowerCase("tr").includes(word),
        ),
      );
      const rest = pool.filter((product) => !named.includes(product));
      const chosen = [...named, ...rest].slice(0, Math.max(8, named.length));

      for (const product of chosen) {
        if ((perProduct.get(product.id) ?? 0) >= 4) continue;
        await db.productOccasion.create({
          data: { productId: product.id, occasionId: occasion.id },
        });
        perProduct.set(product.id, (perProduct.get(product.id) ?? 0) + 1);
        tagCount++;
      }
    }
    console.log(`  · ${occasions.length} gönderim amacı, ${tagCount} etiket`);
  }

  /* -------------------------------- Yorumlar ------------------------------ */
  /* Puanı yorumlardan türet: rakam ile altındaki metinler çelişmesin. */
  {
    const catalog = await db.product.findMany({
      where: { isAddOn: false },
      select: { id: true, sellerId: true, category: { select: { slug: true } } },
    });

    let reviewCount = 0;
    for (const product of catalog) {
      // Ürüne uymayan metin yazılmasın: "teraryum küçük ama şirin" yorumu
      // gül buketinin altında durursa demo inandırıcılığını kaybeder.
      const usable = REVIEW_TEXTS.filter(
        (row) => !row.only || row.only.includes(product.category.slug),
      );

      const count = Math.min(rint(3, 9), usable.length);
      const picked = new Set<number>();
      while (picked.size < count) picked.add(rint(0, usable.length - 1));

      let sum = 0;
      for (const index of picked) {
        const row = usable[index];
        const customer = pick(CUSTOMERS);
        const replied = row.rating <= 3 || rnd() < 0.25;

        await db.review.create({
          data: {
            productId: product.id,
            sellerId: product.sellerId,
            authorName: customer.name,
            city: pick(REVIEW_CITIES),
            rating: row.rating,
            comment: row.text,
            helpful: rint(0, 24),
            reply: replied ? pick(REVIEW_REPLIES) : null,
            repliedAt: replied ? daysAgo(rint(1, 40)) : null,
            createdAt: daysAgo(rint(1, 120)),
          },
        });
        sum += row.rating;
        reviewCount++;
      }

      await db.product.update({
        where: { id: product.id },
        data: {
          rating: round2(sum / picked.size),
          reviewCount: picked.size,
        },
      });
    }
    console.log(`  · ${reviewCount} ürün yorumu`);
  }

  /* ---------------------------- Ürün başvuruları -------------------------- */
  /* Bayi mağazasına ürün önerir, operasyon onaylar (23 Ağustos isteği).
     Onaylanmış başvurunun ürünü de oluşturulur ki bağ kopuk kalmasın. */
  const approvedByOps = admins[1] ?? admins[0];

  for (const request of PRODUCT_REQUESTS) {
    const seller = sellers.filter((s) => s.status === "APPROVED")[request.seller];
    const category = categories.find((c) => c.slug === request.category);
    if (!seller || !category) continue;

    let productId: string | null = null;

    if (request.status === "ONAYLANDI") {
      const product = await db.product.create({
        data: {
          sellerId: seller.id,
          categoryId: category.id,
          name: request.name,
          slug: slugify(request.name),
          description: request.description,
          price: request.price,
          stock: request.stock,
          imageUrl: request.image,
          isActive: true,
          createdAt: daysAgo(request.daysAgo - 1),
        },
      });
      productId = product.id;

      await db.productMedia.createMany({
        data: [
          { productId: product.id, url: request.image, kind: "IMAGE", sortOrder: 0 },
          ...CROP_VARIANTS.map((variant, index) => ({
            productId: product.id,
            url: `${request.image}?${variant}`,
            kind: "IMAGE",
            sortOrder: index + 1,
          })),
        ],
      });
    }

    const reviewed = request.status !== "BEKLIYOR";

    await db.productRequest.create({
      data: {
        sellerId: seller.id,
        categoryId: category.id,
        name: request.name,
        description: request.description,
        price: request.price,
        stock: request.stock,
        imageUrl: request.image,
        galleryUrls: CROP_VARIANTS.map((v) => `${request.image}?${v}`).join("\n"),
        sellerNote: request.sellerNote ?? null,
        status: request.status,
        reviewNote: request.reviewNote ?? null,
        reviewedAt: reviewed ? daysAgo(request.daysAgo - 1) : null,
        reviewedBy: reviewed ? approvedByOps.name : null,
        productId,
        createdAt: daysAgo(request.daysAgo),
      },
    });
  }

  /* ------------------------------- Denetim izi ---------------------------- */
  /* Üç admin de kendi ismiyle çalışıyor; kim neyi değiştirmiş görünür (madde 20). */
  const auditSeed: { actor: (typeof admins)[number]; action: string; summary: string; entity: string; daysAgo: number }[] = [
    { actor: admins[1], action: "seller.commission", summary: `${approvedSellers[0]?.storeName} komisyon oranı %12 olarak güncellendi`, entity: "Seller", daysAgo: 26 },
    { actor: admins[0], action: "seller.approve", summary: `${approvedSellers[3]?.storeName} başvurusu onaylandı`, entity: "Seller", daysAgo: 21 },
    { actor: admins[2], action: "invoice.approve", summary: "Haziran dönemi komisyon faturaları onaylandı", entity: "Invoice", daysAgo: 33 },
    { actor: admins[1], action: "seller.area", summary: `${approvedSellers[0]?.storeName} için Kadıköy / Moda bölgesi açıldı`, entity: "SellerArea", daysAgo: 14 },
    { actor: admins[0], action: "order.courier", summary: "CS-2026-0012 siparişine kurye atandı", entity: "Order", daysAgo: 9 },
    { actor: admins[2], action: "seller.quota", summary: `${approvedSellers[1]?.storeName} günlük kotası 18 olarak ayarlandı`, entity: "Seller", daysAgo: 7 },
    { actor: admins[1], action: "product.visibility", summary: "Stokta olmayan 2 ürün yayından kaldırıldı", entity: "Product", daysAgo: 4 },
  ];

  for (const row of auditSeed) {
    if (!row.actor) continue;
    await db.auditLog.create({
      data: {
        userId: row.actor.id,
        actorName: row.actor.name,
        actorRole: "ADMIN",
        action: row.action,
        summary: row.summary,
        entity: row.entity,
        createdAt: daysAgo(row.daysAgo, rint(9, 18)),
      },
    });
  }

  /* --------------------------------- Özet --------------------------------- */
  const [userCount, orderCount, productCount, neighborhoodCount, invoiceCount] =
    await Promise.all([
      db.user.count(),
      db.order.count(),
      db.product.count(),
      db.neighborhood.count(),
      db.invoice.count(),
    ]);

  console.log(`✓ ${userCount} kullanıcı, ${sellers.length} mağaza, ${categories.length + 1} kategori`);
  console.log(`✓ ${productCount} ürün (${addOns.length} ek ürün), ${orderCount} sipariş`);
  console.log(`✓ ${neighborhoodCount} mahalle, ${landmarkCount} adres noktası, ${invoiceCount} fatura, ${auditSeed.length} denetim kaydı`);
  console.log(`✓ ${PRODUCT_REQUESTS.length} ürün başvurusu (bayiden operasyona)`);
  console.log("\nDemo hesapları:");
  console.log(`  Müşteri : ${CUSTOMERS[0].name} <${CUSTOMERS[0].email}>`);
  console.log(`  Satıcı  : ${SELLERS[0].owner} <${SELLERS[0].email}>`);
  console.log(`  Kurye   : ${COURIERS[0].name} <${COURIERS[0].email}>`);
  console.log(`  Admin   : ${ADMINS.map((a) => a.name).join(", ")}`);
  console.log("\nRol değiştirici sağ üstte — giriş yapmaya gerek yok.\n");
}

main()
  .catch((error) => {
    console.error("Seed başarısız:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
