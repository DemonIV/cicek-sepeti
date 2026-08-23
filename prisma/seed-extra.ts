/**
 * 21 Ağustos 2026'da eklenen demo içeriği.
 *
 * Müşteri listesindeki maddeler yeni veri istiyor: teslimat mahalleleri
 * (12, 15), ek ürünler (6), üç admin (20), indirimler ve haftanın ürünü (24),
 * ürün galerileri (23). Hepsi burada; `seed-data.ts` dokunulmadan kaldı.
 */

const u = (id: string) => `https://images.unsplash.com/photo-${id}`;

/* --------------------------------- Adminler ------------------------------- */
/* Üç kişi de kendi ismiyle girer; panelde kimin ne yaptığı denetim izinde. */

export const ADMINS = [
  {
    name: "Nazlı Öztürk",
    email: "nazli@cicekdemo.com",
    phone: "0530 111 22 33",
    title: "Operasyon Müdürü",
  },
  {
    name: "Kerem Balcı",
    email: "kerem@cicekdemo.com",
    phone: "0530 111 22 34",
    title: "Bayi İlişkileri Uzmanı",
  },
  {
    name: "Sibel Aksu",
    email: "sibel@cicekdemo.com",
    phone: "0530 111 22 35",
    title: "Finans Sorumlusu",
  },
] as const;

/* -------------------------------- Mahalleler ------------------------------ */
/* Teslimat bölgesinin en küçük birimi. Bayi eşleşmesi mahalle üzerinden. */

export const NEIGHBORHOODS: {
  city: string;
  district: string;
  names: string[];
}[] = [
  { city: "İstanbul", district: "Kadıköy", names: ["Caferağa", "Moda", "Fenerbahçe", "Göztepe", "Suadiye"] },
  { city: "İstanbul", district: "Beşiktaş", names: ["Levent", "Etiler", "Bebek", "Sinanpaşa"] },
  { city: "İstanbul", district: "Şişli", names: ["Nişantaşı", "Teşvikiye", "Bomonti", "Mecidiyeköy"] },
  { city: "İstanbul", district: "Üsküdar", names: ["Altunizade", "Kuzguncuk", "Çengelköy"] },
  { city: "İstanbul", district: "Bakırköy", names: ["Ataköy", "Yeşilköy", "Florya"] },

  { city: "Ankara", district: "Çankaya", names: ["Kavaklıdere", "Gaziosmanpaşa", "Ayrancı", "Bahçelievler"] },
  { city: "Ankara", district: "Yenimahalle", names: ["Batıkent", "Demetevler", "Şentepe"] },
  { city: "Ankara", district: "Etimesgut", names: ["Eryaman", "Elvankent"] },

  { city: "İzmir", district: "Konak", names: ["Alsancak", "Güzelyalı", "Basmane"] },
  { city: "İzmir", district: "Karşıyaka", names: ["Bostanlı", "Mavişehir", "Bahriye Üçok"] },
  { city: "İzmir", district: "Bornova", names: ["Kazımdirik", "Erzene", "Evka 3"] },

  { city: "Bursa", district: "Nilüfer", names: ["Görükle", "Özlüce", "Beşevler"] },
  { city: "Bursa", district: "Osmangazi", names: ["Altıparmak", "Çekirge", "Soğanlı"] },

  { city: "Antalya", district: "Muratpaşa", names: ["Lara", "Şirinyalı", "Fener"] },
  { city: "Antalya", district: "Konyaaltı", names: ["Liman", "Hurma", "Uncalı"] },

  { city: "Kayseri", district: "Melikgazi", names: ["Alpaslan", "Erenköy", "Gültepe"] },
  { city: "Kayseri", district: "Kocasinan", names: ["Erkilet", "Argıncık", "Yenidoğan"] },
];

/**
 * Bayi ↔ mahalle eşleşmesi. Anahtar `SELLERS` dizisindeki mağaza slug'ı.
 *
 * Bilerek eksik bırakılan bölgeler var — "her ürün her bölgeye gitmez"
 * kuralı demo'da görünsün diye. Bakırköy'e yalnızca hediye deposu hizmet
 * veriyor; Gül Bahçesi'nin ürünleri oraya gönderilemez.
 */
export const SELLER_AREAS: Record<string, { district: string; names?: string[] }[]> = {
  "gul-bahcesi": [
    { district: "Şişli" },
    { district: "Beşiktaş" },
    { district: "Kadıköy", names: ["Caferağa", "Moda", "Göztepe"] },
    { district: "Üsküdar", names: ["Altunizade", "Kuzguncuk"] },
  ],
  "menekse-cicek-evi": [
    { district: "Çankaya" },
    { district: "Yenimahalle", names: ["Batıkent", "Demetevler"] },
  ],
  "ege-orkide": [
    { district: "Konak" },
    { district: "Karşıyaka" },
    { district: "Bornova", names: ["Kazımdirik", "Erzene"] },
  ],
  "erciyes-cicek": [{ district: "Melikgazi" }, { district: "Kocasinan" }],
  "bursa-lale": [{ district: "Nilüfer" }, { district: "Osmangazi", names: ["Altıparmak", "Çekirge"] }],
  // Hediye deposu kargoyla çalışır: tüm mahalleler açık.
  "hediye-deposu": [],
};

/* ------------------------------ Hediye deposu ----------------------------- */
/**
 * Ek ürünleri tek elden gönderen tedarikçi. Çiçek bir çiçekçiden, çikolata
 * buradan çıkar — böylece her sipariş doğal olarak çok satıcılı olur ve
 * "ek ürün" akışı gerçek bir mağazaya dayanır.
 */
export const ADDON_SELLER = {
  storeName: "Hediye Deposu",
  slug: "hediye-deposu",
  owner: "Pınar Ateş",
  email: "pinar@hediyedeposu.com",
  phone: "0530 884 17 62",
  city: "İstanbul",
  district: "Ümraniye",
  status: "APPROVED",
  commissionRate: 0.18,
  rating: 4.7,
  about:
    "Çiçeğin yanına giden hediyeler: butik çikolata, folyo balon, cam vazo ve el yazısı kart. Tüm Türkiye'ye aynı gün kargo.",
  coverUrl: u("1549465220-1a8b9238cd48"),
};

/* -------------------------------- Ek ürünler ------------------------------ */

export type SeedAddOn = {
  name: string;
  kind: "CIKOLATA" | "BALON" | "PASTA" | "VAZO" | "KART" | "OYUNCAK";
  price: number;
  stock: number;
  description: string;
  image: string;
};

/** Her görsel tek tek açılıp içeriği doğrulandı; konusuna uymayan kare yok. */
export const ADD_ONS: SeedAddOn[] = [
  {
    name: "Butik Çikolata Kutusu (16'lı)",
    kind: "CIKOLATA",
    price: 340,
    stock: 120,
    description:
      "El yapımı bitter ve sütlü çikolatalardan 16 parça. Saten kurdeleli kutusuyla buketin yanına yerleştirilir.",
    image: u("1481391319762-47dff72954d9"),
  },
  {
    name: "Bademli Beyaz Çikolata (250 g)",
    kind: "CIKOLATA",
    price: 260,
    stock: 84,
    description:
      "Bütün bademli beyaz çikolata kırıkları, kraft kutuda. Kahve sevenlere giden buketlerin yanında iyi durur.",
    image: u("1548907040-4baa42d10919"),
  },
  {
    name: "Uçan Balon Demeti (7'li)",
    kind: "BALON",
    price: 240,
    stock: 160,
    description:
      "Helyumla şişirilmiş yedi renkli balon, ağırlıklı tabanıyla. Kurye buketle birlikte elden teslim eder.",
    image: u("1530103862676-de8c9debad1d"),
  },
  {
    name: "Doğum Günü Pastası (4 kişilik)",
    kind: "PASTA",
    price: 690,
    stock: 40,
    description:
      "Renkli katmanlı yaş pasta, 4 kişilik. Aynı gün siparişlerde saat 14:00'e kadar verilmesi gerekir.",
    image: u("1464349095431-e9a21285b5f3"),
  },
  {
    name: "Kutlama Mumu ve Kibrit Seti",
    kind: "PASTA",
    price: 120,
    stock: 200,
    description:
      "\"Happy Birthday\" harf mumları ve uzun kibrit. Pastası olmayan doğum günleri için.",
    image: u("1464349153735-7db50ed83c84"),
  },
  {
    name: "Seramik Vazo (20 cm)",
    kind: "VAZO",
    price: 390,
    stock: 55,
    description:
      "Mat beyaz seramik vazo. Buketi eve gidince koyacak bir kap arayanlar için; kutuda çiçek dışındaki tüm buketlerle uyumlu.",
    image: u("1490312278390-ab64016e0aa9"),
  },
  {
    name: "El Yazısı Kart ve Hediye Paketi",
    kind: "KART",
    price: 90,
    stock: 400,
    description:
      "Notunu çiçekçimiz kaligrafi kalemiyle elle yazar, zarfıyla birlikte kraft pakete iliştirir.",
    image: u("1512909006721-3d6018887383"),
  },
  {
    name: "Peluş Ayıcık (30 cm)",
    kind: "OYUNCAK",
    price: 450,
    stock: 70,
    description:
      "Bal rengi, yıkanabilir peluş ayı. Yeni bebek ve doğum günü gönderilerinin klasiği.",
    image: u("1562040506-a9b32cb51b94"),
  },
  {
    name: "Bebek Hediye Sepeti",
    kind: "OYUNCAK",
    price: 620,
    stock: 38,
    description:
      "Örgü battaniye, peluş ayıcık ve hasır sepet. Hastane ziyaretlerinde çiçeğin yanına gider.",
    image: u("1559454403-b8fb88521f11"),
  },
];

/* ------------------------- İndirimler ve haftanın ürünü -------------------- */
/**
 * Zamanlı indirim: `startsIn`/`endsIn` bugünden itibaren gün cinsinden.
 * Biri gelecekte başlıyor — operasyonun indirimi önceden kurabildiğini
 * göstermek için.
 */
export const DISCOUNTS: {
  slug: string;
  price: number;
  startsIn: number;
  endsIn: number;
}[] = [
  { slug: "11-kirmizi-gul-buketi", price: 990, startsIn: -2, endsIn: 3 },
  { slug: "beyaz-lisianthus-buketi", price: 790, startsIn: -1, endsIn: 2 },
  { slug: "mevsim-ciceklerinden-renkli-buket", price: 599, startsIn: -3, endsIn: 4 },
  { slug: "beyaz-orkide-ferforje", price: 1390, startsIn: -1, endsIn: 5 },
  { slug: "kalp-kutuda-kirmizi-guller", price: 1490, startsIn: -4, endsIn: 1 },
  { slug: "cam-fanusta-sukulent-teraryum", price: 520, startsIn: -2, endsIn: 6 },
  { slug: "dogum-gunu-balonlu-buket", price: 860, startsIn: -1, endsIn: 3 },
  // Haftanın ürünü: geri sayım ana sayfadaki geniş bantta görünsün.
  { slug: "pastel-sakayik-buketi", price: 1490, startsIn: -1, endsIn: 4 },
  // Henüz başlamadı: admin panelinde "planlandı" görünür.
  { slug: "51-kirmizi-gul-aranjmani", price: 3450, startsIn: 4, endsIn: 11 },
];

/** Ana sayfadaki "Haftanın ürünü" bölümü — tek ürün, elle seçilir. */
export const WEEKLY_PICK_SLUG = "pastel-sakayik-buketi";

/* --------------------------------- Galeri --------------------------------- */
/**
 * Her ürüne en az üç kare. İlk iki kare ürünün kendi fotoğrafının farklı
 * kadrajı (Unsplash odak noktası parametreleriyle: yakın plan ve alternatif
 * açı), üçüncüsü kategoriye göre ambalaj/atölye karesi. Böylece uydurma bir
 * "başka ürün" fotoğrafı galeriye girmez.
 */
export const CROP_VARIANTS = [
  "crop=focalpoint&fp-x=0.5&fp-y=0.38&fp-z=1.6",
  "crop=focalpoint&fp-x=0.42&fp-y=0.6&fp-z=1.25",
];

/**
 * Kategori slug'ına göre ambalaj/atölye karesi — galerinin üçüncü faslı.
 * Uydurma "başka ürün" fotoğrafı yerine bizim tezgâhımız: dükkân, sepet,
 * ambalaj. Her kare tek tek açılıp içeriği doğrulandı.
 */
export const PACKAGING_SHOTS: Record<string, string> = {
  buketler: u("1487070183336-b863922373d4"),
  guller: u("1487070183336-b863922373d4"),
  orkideler: u("1485955900006-10f4d324d411"),
  "kutuda-cicek": u("1513885535751-8b9238bd345a"),
  teraryum: u("1485955900006-10f4d324d411"),
  "saksi-cicekleri": u("1416879595882-3373a0480b5b"),
  celenk: u("1487070183336-b863922373d4"),
  "hediye-setleri": u("1607344645866-009c320b63e0"),
  "dogum-gunu": u("1513151233558-d860c5398176"),
  "yeni-bebek": u("1559454403-b8fb88521f11"),
  "hediye-ekleri": u("1607344645866-009c320b63e0"),
};

/**
 * Tanıtım videosu olan ürünler. Dosyalar `public/video/` altında — dışarıya
 * bağımlılık yok, internet olmasa da oynar.
 */
export const PRODUCT_VIDEOS: Record<string, string> = {
  "11-kirmizi-gul-buketi": "/video/urun-gul-buketi.mp4",
  "pastel-sakayik-buketi": "/video/urun-sakayik.mp4",
  "beyaz-orkide-ferforje": "/video/urun-orkide.mp4",
  "kalp-kutuda-kirmizi-guller": "/video/urun-kutuda-gul.mp4",
};

/* ----------------------------- Fatura içeriği ----------------------------- */

export const INVOICE_MONTHS = ["2026-06", "2026-07"] as const;

/* ---------------------------- Ürün başvuruları ---------------------------- */
/**
 * 23 Ağustos 2026: bayi kendi mağazasına ürün önerebiliyor, ürün admin
 * onayından sonra yayına çıkıyor. Demo'da üç durumun üçü de dolu olsun ki
 * ekran boş görünmesin: biri onay bekliyor, biri onaylanmış, biri reddedilmiş.
 *
 * `seller` alanı SELLERS dizisindeki sırayı gösterir (0 = ilk onaylı bayi).
 */
export const PRODUCT_REQUESTS: {
  seller: number;
  category: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string;
  sellerNote?: string;
  status: "BEKLIYOR" | "ONAYLANDI" | "REDDEDILDI";
  reviewNote?: string;
  daysAgo: number;
}[] = [
  {
    seller: 0,
    category: "buketler",
    name: "Mevsim Çiçeklerinden Kır Buketi",
    description:
      "Halde o sabah ne varsa ondan hazırlanan, papatya ve lisianthus ağırlıklı kır buketi. Kraft kâğıt ve keten kurdele ile paketlenir.",
    price: 890,
    stock: 12,
    image: u("1523693916903-027d144a2b7d"),
    sellerNote: "Sabah gelen mevsim çiçeğiyle hazırlıyoruz, hafta içi her gün çıkabilir.",
    status: "BEKLIYOR",
    daysAgo: 1,
  },
  {
    seller: 1,
    category: "teraryum",
    name: "Çift Katlı Sukulent Teraryum",
    description:
      "Cam fanus içinde iki katlı sukulent düzenlemesi; renkli çakıl ve volkanik taş ile. Ofis masası için dayanıklı bir hediye.",
    price: 640,
    stock: 8,
    image: u("1485955900006-10f4d324d411"),
    sellerNote: "Kendi atölyemizde hazırlıyoruz, stoğu sürekli tutabiliriz.",
    status: "BEKLIYOR",
    daysAgo: 3,
  },
  {
    seller: 2,
    category: "kutuda-cicek",
    name: "Silindir Kutuda Pudra Güller",
    description:
      "Şapka kutusunda 25 dal pudra gül, sünger üzerine tek tek yerleştirilir. Kutu rengi krem veya antrasit seçilebilir.",
    price: 1750,
    stock: 6,
    image: u("1513885535751-8b9238bd345a"),
    status: "ONAYLANDI",
    daysAgo: 9,
  },
  {
    seller: 3,
    category: "hediye-setleri",
    name: "Kahve ve Çiçek Seti",
    description:
      "Küçük buket, filtre kahve paketi ve el yapımı kurabiye bir arada. Sabah teslimlerinde tercih ediliyor.",
    price: 1180,
    stock: 10,
    image: u("1607344645866-009c320b63e0"),
    sellerNote: "Kurabiyeyi yan sokaktaki fırından alıyoruz.",
    status: "REDDEDILDI",
    reviewNote:
      "Gıda içeren setler için tedarikçi belgesi gerekiyor; belgeyi iletince tekrar açalım.",
    daysAgo: 12,
  },
];
