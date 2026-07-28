/**
 * Demo içeriği: mağazalar, kategoriler, ürünler, kişiler ve hediye notları.
 *
 * Görseller Unsplash'ten; her URL sunum öncesi tek tek açılıp kontrol edildi
 * (hem erişilebilir hem de konusuna uygun). Kırık görsel kalmaması için
 * `ProductImage` bileşeni ayrıca yerel bir yedek gösterir.
 */

const u = (id: string) => `https://images.unsplash.com/photo-${id}`;

/* --------------------------------- Mağaza -------------------------------- */

export const SELLERS = [
  {
    storeName: "Gül Bahçesi Çiçekçilik",
    slug: "gul-bahcesi",
    owner: "Serkan Yalçın",
    email: "serkan@gulbahcesi.com",
    phone: "0532 415 88 20",
    city: "İstanbul",
    district: "Nişantaşı",
    status: "APPROVED",
    commissionRate: 0.12,
    rating: 4.8,
    about:
      "1998'den beri Nişantaşı'nda taze kesme çiçek ve özel gün aranjmanları hazırlıyoruz. Aynı gün teslimat İstanbul'un tüm ilçelerine.",
    coverUrl: u("1558861122-40aa75d3a841"),
  },
  {
    storeName: "Menekşe Çiçek Evi",
    slug: "menekse-cicek-evi",
    owner: "Aylin Doğan",
    email: "aylin@meneksecicek.com",
    phone: "0533 227 64 19",
    city: "Ankara",
    district: "Çankaya",
    status: "APPROVED",
    commissionRate: 0.14,
    rating: 4.6,
    about:
      "Ankara Çankaya'da butik çiçekçilik. Doğum günü, yeni bebek ve kurumsal hediye setlerinde uzmanız.",
    coverUrl: u("1639696194673-67b86204b885"),
  },
  {
    storeName: "Ege Orkide",
    slug: "ege-orkide",
    owner: "Deniz Kaya",
    email: "deniz@egeorkide.com",
    phone: "0555 610 33 47",
    city: "İzmir",
    district: "Alsancak",
    status: "APPROVED",
    commissionRate: 0.11,
    rating: 4.9,
    about:
      "Kendi serimizde yetiştirdiğimiz orkideler ve iç mekân bitkileri. İzmir içi ücretsiz kurulum.",
    coverUrl: u("1619707046314-e76ae25d5ab3"),
  },
  {
    storeName: "Erciyes Çiçek",
    slug: "erciyes-cicek",
    owner: "Murat Şahin",
    email: "murat@erciyescicek.com",
    phone: "0542 178 92 05",
    city: "Kayseri",
    district: "Melikgazi",
    status: "APPROVED",
    commissionRate: 0.15,
    rating: 4.5,
    about:
      "Kayseri'nin köklü çiçekçisi. Çelenk, açılış ve tören organizasyonlarında 20 yıllık tecrübe.",
    coverUrl: u("1698103182772-de33f15d7000"),
  },
  {
    storeName: "Bursa Lale Çiçekçilik",
    slug: "bursa-lale",
    owner: "Kerem Aydın",
    email: "kerem@bursalale.com",
    phone: "0536 902 41 73",
    city: "Bursa",
    district: "Nilüfer",
    status: "PENDING",
    commissionRate: 0.13,
    rating: 0,
    appliedDaysAgo: 3,
    about:
      "Nilüfer'de yeni açılan atölyemizde mevsim çiçekleri ve kuru çiçek aranjmanları hazırlıyoruz.",
    coverUrl: u("1601592089737-9d85bf62d74a"),
  },
  {
    storeName: "Akdeniz Buket",
    slug: "akdeniz-buket",
    owner: "Ceyda Erkan",
    email: "ceyda@akdenizbuket.com",
    phone: "0544 358 17 62",
    city: "Antalya",
    district: "Muratpaşa",
    status: "PENDING",
    commissionRate: 0.13,
    rating: 0,
    appliedDaysAgo: 9,
    about:
      "Antalya'da otel ve etkinlik çiçekçiliği yapıyoruz. Platform üzerinden bireysel satışa başlamak istiyoruz.",
    coverUrl: u("1668765552296-9c6f1c87a0bb"),
  },
] as const;

/* ------------------------------- Kategoriler ------------------------------ */

export const CATEGORIES = [
  { name: "Buketler", slug: "buketler", imageUrl: u("1523693916903-027d144a2b7d") },
  { name: "Güller", slug: "guller", imageUrl: u("1494972308805-463bc619d34e") },
  { name: "Orkideler", slug: "orkideler", imageUrl: u("1605996370592-b6f7a81e382e") },
  { name: "Kutuda Çiçek", slug: "kutuda-cicek", imageUrl: u("1660885900184-fe13ca69392c") },
  { name: "Teraryum", slug: "teraryum", imageUrl: u("1623225174112-881b99a33145") },
  { name: "Saksı Çiçekleri", slug: "saksi-cicekleri", imageUrl: u("1604762524889-3e2fcc145683") },
  { name: "Çelenk", slug: "celenk", imageUrl: u("1602285415607-faa4007a0bca") },
  { name: "Hediye Setleri", slug: "hediye-setleri", imageUrl: u("1578237407404-cbe8d05e2300") },
  { name: "Doğum Günü", slug: "dogum-gunu", imageUrl: u("1580964398985-6222571ccd32") },
  { name: "Yeni Bebek", slug: "yeni-bebek", imageUrl: u("1510826079925-c32e6673a0bb") },
] as const;

/* --------------------------------- Ürünler -------------------------------- */

type SeedProduct = {
  name: string;
  category: string;
  /** SELLERS dizisindeki sıra */
  seller: number;
  price: number;
  stock: number;
  description: string;
  image: string;
  featured?: boolean;
};

export const PRODUCTS: SeedProduct[] = [
  /* ------------------------------- Buketler ------------------------------- */
  {
    name: "11 Kırmızı Gül Buketi",
    category: "buketler",
    seller: 0,
    price: 1290,
    stock: 34,
    featured: true,
    description:
      "Uzun saplı 11 adet kırmızı gül, okaliptüs ve cipso ile kraft kağıtta hazırlanır. Saten kurdele ile bağlanır.",
    image: u("1523693916903-027d144a2b7d"),
  },
  {
    name: "Beyaz Lisianthus Buketi",
    category: "buketler",
    seller: 0,
    price: 980,
    stock: 18,
    description:
      "Sade ve zarif bir seçim. Beyaz lisianthuslar mevsim yeşillikleriyle birlikte el buketi formunda sunulur.",
    image: u("1589095181425-c038b3871b6a"),
  },
  {
    name: "Pastel Şakayık Buketi",
    category: "buketler",
    seller: 1,
    price: 1750,
    stock: 9,
    featured: true,
    description:
      "Mevsiminde ithal edilen pudra ve krem tonlarında şakayıklar. Sınırlı sayıda hazırlanır.",
    image: u("1782038522695-12ecda5b5e6d"),
  },
  {
    name: "Mevsim Çiçeklerinden Renkli Buket",
    category: "buketler",
    seller: 1,
    price: 749,
    stock: 42,
    description:
      "Çiçekçimizin o gün gelen en taze mevsim çiçeklerinden hazırladığı renkli buket. Her buket birbirinden farklıdır.",
    image: u("1531120364508-a6b656c3e78d"),
  },
  {
    name: "21 Bordo Gül Buketi",
    category: "buketler",
    seller: 0,
    price: 2150,
    stock: 12,
    description:
      "Koyu bordo güllerden hazırlanan iddialı bir buket. Yıl dönümü ve özel teklifler için tercih edilir.",
    image: u("1567696153798-9111f9cd3d0d"),
  },
  {
    name: "Somon Gül ve Okaliptüs Buketi",
    category: "buketler",
    seller: 3,
    price: 1180,
    stock: 21,
    featured: true,
    description:
      "Somon tonlu güller, okaliptüs ve keten kurdele. Doğal, dağınık ve modern bir görünüm.",
    image: u("1561848355-890d054dc55a"),
  },
  {
    name: "Papatya Sevgisi Buketi",
    category: "buketler",
    seller: 1,
    price: 590,
    stock: 27,
    description:
      "Beyaz papatyalardan hazırlanan neşeli bir buket. Küçük jestler ve 'aklımdasın' demek için.",
    image: u("1685613858397-64f79a0f3603"),
  },
  {
    name: "Beyaz Gül ve Cipso Buketi",
    category: "buketler",
    seller: 3,
    price: 1050,
    stock: 4,
    description:
      "Beyaz güller bol cipso ile yumuşak bir doku kazanır. Nikah ve tebrik gönderimlerinde klasik.",
    image: u("1582794543139-8ac9cb0f7b11"),
  },

  /* -------------------------------- Güller -------------------------------- */
  {
    name: "51 Kırmızı Gül Aranjmanı",
    category: "guller",
    seller: 0,
    price: 3900,
    stock: 6,
    featured: true,
    description:
      "51 kırmızı gül, geniş ferforje ayak üzerinde kalp formunda düzenlenir. Kurye teslimatında fotoğraf gönderilir.",
    image: u("1660809412526-e012e51e2c99"),
  },
  {
    name: "101 Kırmızı Gül",
    category: "guller",
    seller: 0,
    price: 4450,
    stock: 3,
    description:
      "Büyük anlar için. 101 adet uzun saplı kırmızı gül, çift kişilik taşıma gerektiren hacimli aranjman.",
    image: u("1620346328449-f8fb90a40ad5"),
  },
  {
    name: "7 Kırmızı Gül Buketi",
    category: "guller",
    seller: 3,
    price: 690,
    stock: 46,
    description:
      "Günlük sürprizler için ideal ölçü. 7 kırmızı gül, yeşillik ve kraft ambalaj.",
    image: u("1686968277547-3db58cd84c5a"),
  },
  {
    name: "Kutuda 25 Kırmızı Gül",
    category: "guller",
    seller: 0,
    price: 1890,
    stock: 15,
    description:
      "Silindir kutuda 25 kırmızı gül. Su süngeri sayesinde tazeliğini bir hafta korur.",
    image: u("1730749387748-79e6d50a269c"),
  },
  {
    name: "Vazoda 15 Pembe Gül",
    category: "guller",
    seller: 1,
    price: 1340,
    stock: 19,
    description:
      "Cam vazoda 15 pembe gül. Vazo hediyedir, alıcının ayrıca vazo hazırlamasına gerek kalmaz.",
    image: u("1578439231583-9eca0a363860"),
  },
  {
    name: "Tek Dal Kırmızı Gül",
    category: "guller",
    seller: 3,
    price: 249,
    stock: 88,
    description:
      "Tek dal, ince ambalaj ve el yazısı not kartı. Bazen tek bir gül yeterlidir.",
    image: u("1518709779341-56cf4535e94b"),
  },
  {
    name: "33 Gülden Kalp Aranjman",
    category: "guller",
    seller: 3,
    price: 2980,
    stock: 7,
    description:
      "33 kırmızı gül kalp formunda süngerlenir, ayaklı standla teslim edilir.",
    image: u("1512056495345-913a0c261dc8"),
  },

  /* ------------------------------- Orkideler ------------------------------ */
  {
    name: "Beyaz Orkide Ferforje",
    category: "orkideler",
    seller: 2,
    price: 1650,
    stock: 14,
    featured: true,
    description:
      "Çift dallı beyaz phalaenopsis orkide, dövme demir ferforje saksıda. Açılış ve ofis hediyelerinin klasiği.",
    image: u("1605996370592-b6f7a81e382e"),
  },
  {
    name: "Çift Dallı Mor Orkide",
    category: "orkideler",
    seller: 2,
    price: 1480,
    stock: 11,
    description:
      "Yoğun mor renkli iki dal orkide, seramik saksıda. Bakım kartı ile birlikte gönderilir.",
    image: u("1610397648930-477b8c7f0943"),
  },
  {
    name: "Tek Dallı Beyaz Orkide",
    category: "orkideler",
    seller: 2,
    price: 890,
    stock: 23,
    description:
      "Kompakt ölçüsüyle çalışma masası ve konsol için uygun. Tek dal beyaz orkide.",
    image: u("1599463740831-a5015ef7b65a"),
  },
  {
    name: "Pembe Orkide Seramik Saksıda",
    category: "orkideler",
    seller: 2,
    price: 1190,
    stock: 16,
    description:
      "Pudra pembe orkide, mat beyaz seramik saksıda. Yaprak parlatma bakımı yapılarak gönderilir.",
    image: u("1582862058398-c157c8424b54"),
  },
  {
    name: "İkili Beyaz Orkide Ferforje",
    category: "orkideler",
    seller: 2,
    price: 2350,
    stock: 5,
    description:
      "İki ayrı beyaz orkide tek ferforjede birleştirilir. Kurumsal tebrik gönderimleri için hazırlanır.",
    image: u("1542407242725-7d7f3d865665"),
  },
  {
    name: "Mini Orkide Bahçesi",
    category: "orkideler",
    seller: 2,
    price: 1050,
    stock: 13,
    description:
      "Üç mini orkide ve yosun dokusuyla hazırlanan küçük bir bahçe. Az ışıklı ortamlarda da yaşar.",
    image: u("1583846712268-a77d97b7fd68"),
  },

  /* ------------------------------ Kutuda Çiçek ----------------------------- */
  {
    name: "Silindir Kutuda Beyaz Güller",
    category: "kutuda-cicek",
    seller: 0,
    price: 1590,
    stock: 17,
    featured: true,
    description:
      "Krem silindir kutuda beyaz güller. Kutunun içi su süngeri ile hazırlanır, taşınırken dağılmaz.",
    image: u("1660885900184-fe13ca69392c"),
  },
  {
    name: "Kalp Kutuda Kırmızı Güller",
    category: "kutuda-cicek",
    seller: 0,
    price: 1890,
    stock: 10,
    description:
      "Kalp formunda kutuda sıralanmış kırmızı güller. Sevgililer günü ve yıl dönümlerinin favorisi.",
    image: u("1759420319818-1a2c8684a584"),
  },
  {
    name: "Kutuda Pastel Aranjman",
    category: "kutuda-cicek",
    seller: 1,
    price: 1320,
    stock: 20,
    description:
      "Pudra, krem ve şeftali tonlarında karışık çiçekler kare kutuda düzenlenir.",
    image: u("1589217289787-879b47f6edab"),
  },
  {
    name: "Siyah Kutuda Bordo Güller",
    category: "kutuda-cicek",
    seller: 0,
    price: 2100,
    stock: 8,
    description:
      "Mat siyah kutu ve bordo güller. İddialı, modern ve şık bir kombinasyon.",
    image: u("1668127573929-b66cc85a7356"),
  },
  {
    name: "Kraft Kutuda Papatya ve Gül",
    category: "kutuda-cicek",
    seller: 1,
    price: 870,
    stock: 24,
    description:
      "Doğal kraft kutuda papatya ve pembe güller. Sade bütçeli ama etkileyici bir hediye.",
    image: u("1778686568681-699398da3b65"),
  },
  {
    name: "Kutuda Şakayık ve Gül",
    category: "kutuda-cicek",
    seller: 1,
    price: 2450,
    stock: 4,
    description:
      "Mevsiminde şakayık ve bahçe gülü bir arada. Sınırlı sayıda hazırlanır, stok günlük yenilenir.",
    image: u("1759417370417-1a7a0c305480"),
  },

  /* -------------------------------- Teraryum ------------------------------- */
  {
    name: "Cam Fanusta Sukulent Teraryum",
    category: "teraryum",
    seller: 2,
    price: 640,
    stock: 26,
    featured: true,
    description:
      "Cam fanus içinde üç farklı sukulent, renkli kum ve dekoratif taşlar. Ayda bir sulama yeterlidir.",
    image: u("1623225174112-881b99a33145"),
  },
  {
    name: "Geometrik Cam Teraryum",
    category: "teraryum",
    seller: 2,
    price: 780,
    stock: 15,
    description:
      "Pirinç çerçeveli geometrik cam terrarium. Masaüstü ve raf dekorasyonu için tasarlandı.",
    image: u("1579494498105-7ae9d60d0da3"),
  },
  {
    name: "Mini Kaktüs Teraryumu",
    category: "teraryum",
    seller: 2,
    price: 420,
    stock: 38,
    description:
      "Üç mini kaktüs, beyaz çakıl ve seramik kap. Bakımı en kolay hediyelerden biri.",
    image: u("1623225177119-4b26c65b9663"),
  },
  {
    name: "Üçlü Sukulent Seti",
    category: "teraryum",
    seller: 2,
    price: 560,
    stock: 31,
    description:
      "Üç ayrı beton saksıda sukulentler. Ofis masası ve mutfak tezgahı için ideal ölçü.",
    image: u("1623225173873-9b7c59878a2c"),
  },
  {
    name: "Askılı Cam Teraryum",
    category: "teraryum",
    seller: 2,
    price: 690,
    stock: 12,
    description:
      "Deri askılı damla formunda cam teraryum. Pencere önünde asılarak kullanılır.",
    image: u("1608718117453-659477c7a1a9"),
  },

  /* ----------------------------- Saksı Çiçekleri --------------------------- */
  {
    name: "Sansevieria (Paşa Kılıcı)",
    category: "saksi-cicekleri",
    seller: 2,
    price: 720,
    stock: 22,
    description:
      "Havayı temizleyen, az su isteyen dayanıklı bir bitki. Beton saksıda gönderilir.",
    image: u("1601985705806-5b9a71f6004f"),
  },
  {
    name: "Monstera Deliciosa",
    category: "saksi-cicekleri",
    seller: 2,
    price: 1150,
    stock: 9,
    featured: true,
    description:
      "Yarık yapraklarıyla iç mekânların yıldızı. 70-80 cm boyunda, rattan sepetle birlikte.",
    image: u("1567225557594-88d73e55f2cb"),
  },
  {
    name: "Areca Palmiyesi",
    category: "saksi-cicekleri",
    seller: 2,
    price: 1380,
    stock: 7,
    description:
      "Salon ve ofisler için 120 cm boyunda areca palmiyesi. Nemli ortamları sever.",
    image: u("1604762525953-2c80447cc4a6"),
  },
  {
    name: "Zamioculcas (ZZ Bitkisi)",
    category: "saksi-cicekleri",
    seller: 2,
    price: 980,
    stock: 18,
    description:
      "Unutulmayı affeden bitki. Az ışık ve seyrek sulamayla yıllarca yaşar.",
    image: u("1604762511431-6280a12cb835"),
  },
  {
    name: "Barış Çiçeği (Spathiphyllum)",
    category: "saksi-cicekleri",
    seller: 2,
    price: 640,
    stock: 25,
    description:
      "Beyaz çiçekleriyle sade bir iç mekân bitkisi. Taziye ve tebrik gönderimlerinde de tercih edilir.",
    image: u("1614594895304-fe7116ac3b58"),
  },
  {
    name: "Devetabanı (Philodendron)",
    category: "saksi-cicekleri",
    seller: 2,
    price: 860,
    stock: 0,
    description:
      "Geniş yapraklı devetabanı, seramik saksıda. Yarı gölge ortamlarda hızlı büyür.",
    image: u("1563419837758-e48ef1b731dd"),
  },

  /* --------------------------------- Çelenk -------------------------------- */
  {
    name: "Ayaklı Cenaze Çelengi",
    category: "celenk",
    seller: 3,
    price: 2250,
    stock: 20,
    description:
      "Beyaz ve krem çiçeklerden hazırlanan ayaklı çelenk. Kurdele üzerine isim yazımı ücretsizdir.",
    image: u("1602285415607-faa4007a0bca"),
  },
  {
    name: "Beyaz Gül Çelenk",
    category: "celenk",
    seller: 3,
    price: 2850,
    stock: 12,
    description:
      "Yoğun beyaz gül kullanılan büyük boy çelenk. Cami ve mezarlık teslimatı yapılır.",
    image: u("1601929045700-0f4aff15a8b4"),
  },
  {
    name: "Açılış Çelengi (Ferforje)",
    category: "celenk",
    seller: 3,
    price: 1950,
    stock: 16,
    featured: true,
    description:
      "Renkli mevsim çiçekleriyle hazırlanan açılış çelengi. Kurdelede firma adı yer alır.",
    image: u("1758334587549-0c80dbf4dd3e"),
  },
  {
    name: "Karma Çiçek Çelenk",
    category: "celenk",
    seller: 3,
    price: 2400,
    stock: 14,
    description:
      "Sarı, turuncu ve beyaz mevsim çiçeklerinden karma çelenk. Tören ve anma programları için.",
    image: u("1715783842135-856979b21c29"),
  },
  {
    name: "Beyaz Lilyum Çelenk",
    category: "celenk",
    seller: 3,
    price: 3100,
    stock: 5,
    description:
      "Beyaz lilyum ve gül birlikte kullanılır. Kokusu yoğun, duruşu sade bir çelenktir.",
    image: u("1741189127247-3f45b0ca6e53"),
  },

  /* ----------------------------- Hediye Setleri ---------------------------- */
  {
    name: "Çiçek ve Çikolata Seti",
    category: "hediye-setleri",
    seller: 1,
    price: 1150,
    stock: 28,
    featured: true,
    description:
      "Mevsim çiçeklerinden buket ve 250 gr spesiyal çikolata bir arada gönderilir.",
    image: u("1578237407404-cbe8d05e2300"),
  },
  {
    name: "Gül Buketi ve Lokum Seti",
    category: "hediye-setleri",
    seller: 1,
    price: 1290,
    stock: 19,
    description:
      "Pembe gül buketi ve fıstıklı lokum kutusu. Bayram ve ziyaret hediyeleri için hazırlandı.",
    image: u("1717149635873-88e32a86a913"),
  },
  {
    name: "Sevgiliye Özel Kutu Set",
    category: "hediye-setleri",
    seller: 1,
    price: 1680,
    stock: 11,
    description:
      "Kutuda güller, çikolata ve el yazısı not kartı. Kurdele rengi siparişte seçilebilir.",
    image: u("1562023693-ca3a992c9ea6"),
  },
  {
    name: "Kahve ve Çiçek Seti",
    category: "hediye-setleri",
    seller: 1,
    price: 890,
    stock: 23,
    description:
      "Küçük mevsim buketi, filtre kahve paketi ve seramik kupa. Ofis hediyesi olarak sevilir.",
    image: u("1654605218844-4b250fd445a7"),
  },
  {
    name: "Kurumsal Tebrik Seti",
    category: "hediye-setleri",
    seller: 1,
    price: 1450,
    stock: 3,
    description:
      "Beyaz orkide, kurumsal not kartı ve hediye paketi. Toplu siparişlerde fiyat farkı uygulanır.",
    image: u("1771070181476-d4592d83485c"),
  },

  /* ------------------------------- Doğum Günü ------------------------------ */
  {
    name: "Doğum Günü Balonlu Buket",
    category: "dogum-gunu",
    seller: 1,
    price: 1080,
    stock: 21,
    featured: true,
    description:
      "Renkli mevsim buketi, folyo balon ve doğum günü kartı bir arada teslim edilir.",
    image: u("1628509633348-a39defbc44c4"),
  },
  {
    name: "Renkli Gerbera Aranjmanı",
    category: "dogum-gunu",
    seller: 1,
    price: 760,
    stock: 30,
    description:
      "Canlı renkli gerberalar cam vazoda. Neşeli ve uygun bütçeli bir doğum günü hediyesi.",
    image: u("1580964398985-6222571ccd32"),
  },
  {
    name: "Pastalı Çiçek Seti",
    category: "dogum-gunu",
    seller: 1,
    price: 1520,
    stock: 8,
    description:
      "Butik yaş pasta ve mevsim buketi aynı adrese birlikte gönderilir. Bir gün önceden sipariş gerekir.",
    image: u("1588235545248-f73cb26ab3a9"),
  },
  {
    name: "İyi ki Doğdun Kutu Çiçek",
    category: "dogum-gunu",
    seller: 0,
    price: 1240,
    stock: 17,
    description:
      "Kutu üzerinde 'İyi ki doğdun' baskısı, içinde renkli mevsim çiçekleri.",
    image: u("1747576660180-f3b789cb0f7a"),
  },
  {
    name: "Işıklı Doğum Günü Aranjmanı",
    category: "dogum-gunu",
    seller: 1,
    price: 1390,
    stock: 0,
    description:
      "Pilli led ışık şeridiyle hazırlanan aranjman. Akşam teslimatlarında etkileyici görünür.",
    image: u("1521310137449-68ce7d967620"),
  },

  /* ------------------------------- Yeni Bebek ------------------------------ */
  {
    name: "Hoş Geldin Bebek — Pembe Aranjman",
    category: "yeni-bebek",
    seller: 1,
    price: 990,
    stock: 16,
    featured: true,
    description:
      "Pembe ve beyaz çiçeklerden hazırlanan aranjman, 'Hoş geldin' kartıyla birlikte.",
    image: u("1510826079925-c32e6673a0bb"),
  },
  {
    name: "Hoş Geldin Bebek — Mavi Aranjman",
    category: "yeni-bebek",
    seller: 1,
    price: 990,
    stock: 14,
    description:
      "Mavi ve beyaz tonlarda aranjman. Hastane odası teslimatına uygun ölçüde hazırlanır.",
    image: u("1517588487680-fc59cb1a55cf"),
  },
  {
    name: "Bebek Arabası Çiçek Aranjmanı",
    category: "yeni-bebek",
    seller: 1,
    price: 1480,
    stock: 6,
    description:
      "Bebek arabası formunda süngerli aranjman. Doğum tebriklerinin en çok tercih edileni.",
    image: u("1618847472790-0ca60378235e"),
  },
  {
    name: "Anne ve Bebek Hediye Seti",
    category: "yeni-bebek",
    seller: 1,
    price: 1320,
    stock: 4,
    description:
      "Anne için buket, bebek için pamuklu battaniye. Tek kutuda hazırlanır.",
    image: u("1608043661120-421ed8794e1c"),
  },

  /* ------------------ Onay bekleyen satıcıların ürünleri ------------------ */
  /* Mağaza onaylanana kadar vitrinde görünmezler — admin onay akışını gösterir. */
  {
    name: "Kuru Çiçek Aranjmanı",
    category: "buketler",
    seller: 4,
    price: 890,
    stock: 10,
    description:
      "Solmayan kuru çiçeklerden hazırlanan aranjman. Bursa atölyemizde el yapımıdır.",
    image: u("1572454591674-2739f30d8c40"),
  },
  {
    name: "Lale Buketi (Mevsimlik)",
    category: "buketler",
    seller: 4,
    price: 740,
    stock: 15,
    description: "Mevsiminde 15 dal lale, kraft ambalajda. Sadece Bursa içi teslimat.",
    image: u("1554494583-c4e1649bfe71"),
  },
  {
    name: "Otel Lobi Aranjmanı",
    category: "hediye-setleri",
    seller: 5,
    price: 3400,
    stock: 5,
    description:
      "Büyük ölçekli lobi ve resepsiyon aranjmanı. Haftalık abonelik olarak da verilebilir.",
    image: u("1457089328109-e5d9bd499191"),
  },
  {
    name: "Akdeniz Mevsim Buketi",
    category: "buketler",
    seller: 5,
    price: 820,
    stock: 12,
    description: "Antalya'nın yerel mevsim çiçeklerinden hazırlanan renkli buket.",
    image: u("1487530811176-3780de880c2d"),
  },
];

/* --------------------------------- Kişiler -------------------------------- */

export const CUSTOMERS = [
  { name: "Zeynep Aksoy", email: "zeynep.aksoy@example.com", phone: "0532 118 47 26", city: "İstanbul", district: "Kadıköy", address: "Caferağa Mah. Moda Cad. No:42 D:7" },
  { name: "Emre Çetin", email: "emre.cetin@example.com", phone: "0533 240 91 58", city: "İstanbul", district: "Beşiktaş", address: "Sinanpaşa Mah. Ihlamurdere Cad. No:118 D:3" },
  { name: "Selin Yıldırım", email: "selin.yildirim@example.com", phone: "0542 673 12 09", city: "Ankara", district: "Çankaya", address: "Kavaklıdere Mah. Tunalı Hilmi Cad. No:76 D:12" },
  { name: "Burak Demir", email: "burak.demir@example.com", phone: "0555 309 66 41", city: "İzmir", district: "Karşıyaka", address: "Bostanlı Mah. Cemal Gürsel Cad. No:214 D:5" },
  { name: "Ayşe Korkmaz", email: "ayse.korkmaz@example.com", phone: "0536 421 78 33", city: "İstanbul", district: "Şişli", address: "Halaskargazi Mah. Rumeli Cad. No:29 D:8" },
  { name: "Mehmet Arslan", email: "mehmet.arslan@example.com", phone: "0544 852 30 17", city: "Bursa", district: "Nilüfer", address: "Görükle Mah. Üniversite Cad. No:63 D:2" },
  { name: "Deniz Şeker", email: "deniz.seker@example.com", phone: "0538 176 54 92", city: "Ankara", district: "Yenimahalle", address: "Batıkent Mah. 1. Cadde No:11 D:14" },
  { name: "Cansu Polat", email: "cansu.polat@example.com", phone: "0532 947 23 80", city: "İzmir", district: "Bornova", address: "Kazımdirik Mah. 372 Sokak No:8 D:6" },
  { name: "Onur Kılıç", email: "onur.kilic@example.com", phone: "0543 610 45 27", city: "Antalya", district: "Konyaaltı", address: "Liman Mah. Akdeniz Bulvarı No:157 D:9" },
  { name: "Elif Tunç", email: "elif.tunc@example.com", phone: "0535 728 19 64", city: "İstanbul", district: "Üsküdar", address: "Acıbadem Mah. Çeçen Sokak No:34 D:11" },
  { name: "Kaan Erdoğan", email: "kaan.erdogan@example.com", phone: "0546 283 90 15", city: "Kayseri", district: "Kocasinan", address: "Erkilet Mah. Osman Kavuncu Bulvarı No:92 D:4" },
  { name: "Merve Aydın", email: "merve.aydin@example.com", phone: "0537 514 62 38", city: "Ankara", district: "Etimesgut", address: "Eryaman Mah. Devlet Mahallesi 3. Cadde No:47 D:10" },
  { name: "Tolga Şen", email: "tolga.sen@example.com", phone: "0531 869 37 51", city: "İstanbul", district: "Bakırköy", address: "Ataköy 7. Kısım Mah. Rauf Orbay Cad. No:5 D:22" },
  { name: "Gizem Bulut", email: "gizem.bulut@example.com", phone: "0549 402 71 86", city: "Bursa", district: "Osmangazi", address: "Altıparmak Mah. Sakarya Cad. No:88 D:3" },
] as const;

export const COURIERS = [
  { name: "Murat Ilgaz", email: "murat.ilgaz@cicekdemo.com", phone: "0532 776 40 18", city: "İstanbul" },
  { name: "Hakan Yavuz", email: "hakan.yavuz@cicekdemo.com", phone: "0533 615 82 47", city: "Ankara" },
  { name: "Serpil Kaya", email: "serpil.kaya@cicekdemo.com", phone: "0542 908 51 36", city: "İzmir" },
] as const;

export const ADMIN = {
  name: "Nazlı Öztürk",
  email: "nazli@cicekdemo.com",
  phone: "0530 111 22 33",
};

/* ------------------------------ Hediye notları ---------------------------- */
/* Demo'nun duygusal ağırlığı bu metinlerde — her rol aynı notu görecek. */

export const GIFT_NOTES = [
  "İyi ki varsın. Nice mutlu senelere, sevgiyle.",
  "Hoş geldin minik prenses. Anne babana da kolay gelsin!",
  "Doğum günün kutlu olsun canım. Bu yıl her şey gönlünce olsun.",
  "Anneler günün kutlu olsun anneciğim. Ellerinden öperim.",
  "Yeni işinde başarılar dilerim. Hep yanındayım, biliyorsun.",
  "Başın sağ olsun. Acını yürekten paylaşıyoruz.",
  "Tebrikler! Bu mutluluğu hak ettiniz. Sağlıklı, huzurlu bir ömür dileriz.",
  "Seni özledim. Bir kahve içmeye ne dersin?",
  "Hayırlı olsun, işleriniz gönlünüzce olsun. Komşunuz Ahmet Bey ailesi.",
  "Geçmiş olsun. Bir an önce iyileşmen dileğiyle.",
  "Yıl dönümümüz kutlu olsun. Seninle geçen on yıl bir gün gibi geldi.",
  "Sınavını kutlarım, gurur duyuyorum seninle.",
  "Kusura bakma, bugün gelemedim. Sen benim için hep özelsin.",
  "Nikahınız hayırlı olsun. Bir yastıkta kocayın.",
  "Emekliliğin kutlu olsun. Bundan sonrası tamamen senin.",
  "Teşekkür ederim. Bu proje sensiz bitmezdi.",
] as const;

/* --------------------------- Kurumsal içerik ------------------------------ */

export const HERO_SLIDES = [
  {
    eyebrow: "Bugün açan çiçekler",
    title: "Bugün toplandı,\nbugün kapında.",
    text: "Dört şehirde çalışan çiçekçilerimiz siparişini sabah hazırlar, akşam olmadan alıcısına ulaştırır.",
    image: u("1523693916903-027d144a2b7d"),
  },
] as const;
