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
  ADMIN,
  CATEGORIES,
  COURIERS,
  CUSTOMERS,
  GIFT_NOTES,
  PRODUCTS,
  SELLERS,
} from "./seed-data";

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
  await db.orderEvent.deleteMany();
  await db.delivery.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();
  await db.seller.deleteMany();
  await db.address.deleteMany();
  await db.user.deleteMany();
}

async function main() {
  console.log("→ Mevcut veri siliniyor…");
  await reset();

  /* -------------------------------- Admin -------------------------------- */
  const admin = await db.user.create({
    data: { ...ADMIN, role: "ADMIN", createdAt: daysAgo(400) },
  });

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

  /* -------------------------------- Satıcılar ----------------------------- */
  const sellers = [];
  for (const [index, s] of SELLERS.entries()) {
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
      },
    });

    sellers.push(seller);
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

  /* --------------------------------- Ürünler ------------------------------ */
  const products = [];
  for (const p of PRODUCTS) {
    const category = categories.find((c) => c.slug === p.category)!;
    const seller = sellers[p.seller];

    products.push(
      await db.product.create({
        data: {
          sellerId: seller.id,
          categoryId: category.id,
          name: p.name,
          slug: slugify(p.name),
          description: p.description,
          price: p.price,
          stock: p.stock,
          imageUrl: p.image,
          isActive: true,
          isFeatured: p.featured ?? false,
          rating: round2(4.3 + rnd() * 0.7),
          reviewCount: rint(6, 240),
          createdAt: daysAgo(rint(20, 400)),
        },
        include: { seller: true },
      }),
    );
  }

  // Vitrinde yalnızca onaylı mağazaların ürünleri listelenir.
  const sellableProducts = products.filter((p) => p.seller.status === "APPROVED");

  /* -------------------------------- Siparişler ---------------------------- */
  let orderCounter = 1;
  const orderRows: { status: string; ageDays: number }[] = [];
  for (const plan of ORDER_PLAN) {
    for (let i = 0; i < plan.count; i++) {
      orderRows.push({ status: plan.status, ageDays: rint(plan.minDays, plan.maxDays) });
    }
  }
  orderRows.sort((a, b) => b.ageDays - a.ageDays);

  for (const row of orderRows) {
    const createdAt = daysAgo(row.ageDays, rint(9, 20));
    const customer = pick(customers);

    // Siparişlerin bir kısmı bilinçli olarak çok satıcılı — demo'nun ana iddiası.
    const multiSeller = chance(0.3);
    const lineCount = multiSeller ? rint(2, 3) : rint(1, 2);

    const chosen: typeof sellableProducts = [];
    while (chosen.length < lineCount) {
      const candidate = pick(sellableProducts);
      if (chosen.some((c) => c.id === candidate.id)) continue;
      if (multiSeller && chosen.length === 1 && candidate.sellerId === chosen[0].sellerId) {
        continue;
      }
      chosen.push(candidate);
    }

    const items = chosen.map((product) => ({
      productId: product.id,
      sellerId: product.sellerId,
      productName: product.name,
      productImage: product.imageUrl,
      quantity: rint(1, 2),
      unitPrice: product.price,
      commissionRate: product.seller.commissionRate,
      status: row.status,
    }));

    const subtotal = round2(
      items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    );
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

    const address = await db.address.findFirst({
      where: { userId: customer.user.id, isDefault: true },
    });

    const recipientIsSomeoneElse = chance(0.75);
    const recipient = recipientIsSomeoneElse ? pick(CUSTOMERS) : customer.seed;

    const deliveryDate = new Date(createdAt.getTime() + rint(0, 2) * DAY);
    const isCancelled = row.status === "IPTAL";

    const order = await db.order.create({
      data: {
        // Numara biçimi `nextOrderNo()` ile aynı olmalı: demo sırasında verilen
        // yeni sipariş, seed'den gelenlerle aynı seride görünsün.
        orderNo: `CS-${now.getFullYear()}-${String(orderCounter++).padStart(4, "0")}`,
        customerId: customer.user.id,
        status: row.status,
        subtotal,
        shippingFee: shipping,
        total: round2(subtotal + shipping),
        recipientName: recipient.name,
        recipientPhone: recipient.phone,
        deliveryCity: recipientIsSomeoneElse ? recipient.city : (address?.city ?? customer.seed.city),
        deliveryAddress: recipientIsSomeoneElse
          ? `${recipient.district} — ${recipient.address}`
          : `${address?.district ?? ""} — ${address?.fullAddress ?? ""}`,
        giftNote: chance(0.82) ? pick(GIFT_NOTES) : null,
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
          orderId: order.id,
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
          orderId: order.id,
          status: "IPTAL",
          label: EVENT_LABEL.IPTAL,
          actor: "Admin: " + admin.name,
          createdAt: new Date(stamp),
        },
      });
    }

    /* ------------------------------ Teslimat ------------------------------ */
    const needsCourier = ["YOLDA", "TESLIM_EDILDI"].includes(row.status);
    const maybeAssigned = row.status === "HAZIRLANIYOR" && chance(0.5);
    const courier = needsCourier || maybeAssigned ? pick(couriers) : null;

    await db.delivery.create({
      data: {
        orderId: order.id,
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
        pickedUpAt: needsCourier ? new Date(stamp - rint(30, 180) * 60 * 1000) : null,
        deliveredAt: row.status === "TESLIM_EDILDI" ? new Date(stamp) : null,
      },
    });

    await db.order.update({
      where: { id: order.id },
      data: { updatedAt: new Date(stamp) },
    });
  }

  /* --------------------------------- Özet --------------------------------- */
  const [userCount, orderCount, productCount] = await Promise.all([
    db.user.count(),
    db.order.count(),
    db.product.count(),
  ]);

  console.log(`✓ ${userCount} kullanıcı, ${sellers.length} mağaza, ${categories.length} kategori`);
  console.log(`✓ ${productCount} ürün, ${orderCount} sipariş oluşturuldu`);
  console.log("\nDemo hesapları:");
  console.log(`  Müşteri : ${CUSTOMERS[0].name} <${CUSTOMERS[0].email}>`);
  console.log(`  Satıcı  : ${SELLERS[0].owner} <${SELLERS[0].email}>`);
  console.log(`  Kurye   : ${COURIERS[0].name} <${COURIERS[0].email}>`);
  console.log(`  Admin   : ${ADMIN.name} <${ADMIN.email}>`);
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
