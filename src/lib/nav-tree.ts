/**
 * Ana gezinme ağacı — başlıktaki metin navbar'ı ve açılır menüleri besler.
 *
 * Yapı ciceksepeti.com'un 9 başlıklı navbar'ından alındı (bkz.
 * `CS-NAVBAR-GOZLEM.md`): ilk başlık iki sütunlu **mega** menü, diğerleri
 * çok sütunlu **düz** liste.
 *
 * Neden tablo değil de statik ağaç: kategori ekseni (`Category`) ürünün ne
 * olduğunu, koleksiyon ekseni (`collections.ts`) niçin arandığını, amaç ekseni
 * (`Occasion`) kime gittiğini söyler. Navbar bu üç ekseni tek ağaçta birleştirir;
 * yeni bir tablo açmak yerine her yaprak mevcut bir sorguya bağlanır.
 *
 * Kural: **boş yaprak olmasın.** Demo kataloğunda karşılığı olmayan dallar
 * (gerçek sitedeki "Kol Düğmesi", "Spotify Plak" gibi) alınmadı; alınanların
 * hepsi seed verisinde ürün döndürür.
 */

/** Kategori sayfası — ürünün ne olduğu. */
const cat = (slug: string) => `/kategori/${slug}`;
/** Koleksiyon filtresi — `collections.ts` içindeki Prisma parçası. */
const col = (slug: string) => `/urunler?koleksiyon=${slug}`;
/** Gönderim amacı filtresi — `Occasion` tablosu. */
const occ = (slug: string) => `/urunler?amac=${slug}`;
/**
 * Serbest arama — ad ve açıklamada geçen terim.
 *
 * SQLite'ın `LIKE`'ı yalnızca ASCII harfleri için büyük/küçük harf ayrımı
 * yapmaz; "Ç", "İ", "Ö", "Ş" gibi harflerde ayrım yapar. Bu yüzden terimler
 * ürün adındaki yazımla verilir ("İyi ki", "Çikolata Seti") — yoksa arama
 * boş döner.
 */
const ara = (term: string) => `/urunler?q=${encodeURIComponent(term)}`;

export type NavLeaf = { label: string; href: string };

/** Mega menünün sol sütunundaki dal; `children` varsa sağ panel dolar. */
export type NavBranch = NavLeaf & { children?: NavLeaf[] };

export type NavGroup = NavLeaf & {
  slug: string;
  /** `mega`: sol dal listesi + sağ alt liste. `flat`: çok sütunlu düz liste. */
  layout: "mega" | "flat";
  branches: NavBranch[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    slug: "cicek",
    label: "Çiçek",
    href: "/vitrin/cicek",
    layout: "mega",
    branches: [
      {
        label: "Çiçek Buketleri",
        href: cat("buketler"),
        children: [
          { label: "Gül Buketleri", href: ara("gül buketi") },
          { label: "Karışık Mevsim Buketleri", href: ara("mevsim") },
          { label: "Papatya & Gerbera", href: ara("gerbera") },
          { label: "Şakayık Buketleri", href: ara("şakayık") },
          { label: "Lisianthus Buketleri", href: ara("lisianthus") },
          { label: "Okaliptüslü Buketler", href: ara("okaliptüs") },
        ],
      },
      {
        label: "Güller",
        href: cat("guller"),
        children: [
          { label: "Kırmızı Gül", href: ara("kırmızı gül") },
          { label: "Beyaz Gül", href: ara("beyaz gül") },
          { label: "Pembe Gül", href: ara("pembe gül") },
          { label: "Bordo Gül", href: ara("bordo") },
          { label: "Vazoda Gül", href: ara("vazoda") },
          { label: "Kutuda Güller", href: ara("kutuda gül") },
          { label: "Kalp Aranjmanlar", href: ara("kalp") },
          { label: "Tek Dal Gül", href: ara("tek dal") },
        ],
      },
      {
        label: "Orkideler",
        href: cat("orkideler"),
        children: [
          { label: "Beyaz Orkide", href: ara("beyaz orkide") },
          { label: "Mor Orkide", href: ara("mor orkide") },
          { label: "Pembe Orkide", href: ara("pembe orkide") },
          { label: "Mini Orkide", href: ara("mini orkide") },
          { label: "Ferforje Orkide", href: ara("ferforje") },
        ],
      },
      {
        label: "Saksı Çiçekleri",
        href: cat("saksi-cicekleri"),
        children: [
          { label: "Barış Çiçeği", href: ara("barış") },
          { label: "Monstera", href: ara("monstera") },
          { label: "Areca Palmiyesi", href: ara("palmiye") },
          { label: "Paşa Kılıcı", href: ara("sansevieria") },
          { label: "ZZ Bitkisi", href: ara("zamioculcas") },
          { label: "Devetabanı", href: ara("devetabanı") },
          { label: "Sukulent", href: ara("sukulent") },
          { label: "Kaktüs", href: ara("kaktüs") },
        ],
      },
      {
        label: "Kutuda Çiçek",
        href: cat("kutuda-cicek"),
        children: [
          { label: "Kalp Kutuda Çiçek", href: ara("kalp kutu") },
          { label: "Silindir Kutuda Çiçek", href: ara("silindir") },
          { label: "Siyah Kutuda Çiçek", href: ara("siyah kutu") },
          { label: "Kraft Kutuda Çiçek", href: ara("kraft") },
          { label: "Pastel Kutu Aranjman", href: ara("pastel") },
        ],
      },
      {
        label: "Teraryum",
        href: cat("teraryum"),
        children: [
          { label: "Cam Fanusta Teraryum", href: ara("fanus") },
          { label: "Geometrik Cam Teraryum", href: ara("geometrik") },
          { label: "Askılı Cam Teraryum", href: ara("askılı") },
          { label: "Mini Kaktüs Teraryumu", href: ara("mini kaktüs") },
          { label: "Sukulent Setleri", href: ara("sukulent seti") },
        ],
      },
      {
        label: "Çelenkler",
        href: cat("celenk"),
        children: [
          { label: "Açılış Çelenkleri", href: ara("açılış") },
          { label: "Ferforje Aranjmanlar", href: ara("ferforje") },
          { label: "Cenaze Çelenkleri", href: ara("cenaze") },
          { label: "Beyaz Gül Çelenk", href: ara("Gül Çelenk") },
          { label: "Karma Çiçek Çelenk", href: ara("karma") },
        ],
      },
      {
        label: "Renge Göre Çiçekler",
        href: "/urunler",
        children: [
          { label: "Kırmızı Çiçekler", href: ara("kırmızı") },
          { label: "Beyaz Çiçekler", href: ara("beyaz") },
          { label: "Pembe Çiçekler", href: ara("pembe") },
          { label: "Mor Çiçekler", href: ara("mor") },
          { label: "Renkli Çiçekler", href: ara("renkli") },
          { label: "Pastel Tonlar", href: ara("pastel") },
        ],
      },
      { label: "Vazoda Çiçek", href: ara("vazoda") },
      { label: "Lilyum & Zambak", href: ara("lilyum") },
      { label: "Premium Aranjmanlar", href: col("premium") },
      { label: "İndirimdeki Çiçekler", href: col("indirim") },
    ],
  },

  {
    slug: "yenilebilir-cicek",
    label: "Yenilebilir Çiçek",
    href: "/vitrin/yenilebilir-cicek",
    layout: "flat",
    branches: [
      { label: "Çikolatalar", href: col("cikolata") },
      { label: "Pastalar", href: col("pasta") },
      { label: "Çiçek & Çikolata", href: ara("çikolata") },
      { label: "Gül & Lokum Seti", href: ara("lokum") },
      { label: "Kahve & Çiçek Seti", href: ara("kahve") },
      { label: "Pastalı Çiçek Seti", href: ara("pastalı") },
      { label: "Doğum Günü Lezzetleri", href: ara("doğum günü") },
      { label: "Sevgiliye Özel Lezzetler", href: ara("sevgiliye") },
      { label: "Kurumsal İkramlıklar", href: ara("kurumsal") },
      { label: "Hediye Setleri", href: cat("hediye-setleri") },
    ],
  },

  {
    slug: "dogum-gunu",
    label: "Doğum Günü",
    href: cat("dogum-gunu"),
    layout: "flat",
    branches: [
      { label: "Doğum Günü Çiçekleri", href: cat("dogum-gunu") },
      { label: "Balonlu Buketler", href: ara("balonlu") },
      { label: "Işıklı Aranjmanlar", href: ara("ışıklı") },
      { label: "İyi ki Doğdun Kutu Çiçek", href: ara("İyi ki") },
      { label: "Renkli Gerbera", href: ara("gerbera") },
      { label: "Doğum Günü Amaçlı Tümü", href: occ("dogum-gunu") },
      { label: "Doğum Günü Setleri", href: cat("hediye-setleri") },
      { label: "Balonlar", href: col("balon") },
      { label: "Pastalar", href: col("pasta") },
      { label: "Çikolatalar", href: col("cikolata") },
      { label: "Premium Seçimler", href: col("premium") },
      { label: "İndirimdekiler", href: col("indirim") },
    ],
  },

  {
    slug: "gonderim-amaci",
    label: "Gönderim Amacı",
    href: "/vitrin/gonderim-amaci",
    layout: "flat",
    branches: [
      { label: "Doğum Günü", href: occ("dogum-gunu") },
      { label: "Sevgiliye", href: occ("sevgiliye") },
      { label: "Yıl Dönümü", href: occ("yil-donumu") },
      { label: "Geçmiş Olsun", href: occ("gecmis-olsun") },
      { label: "Yeni Doğan", href: occ("yeni-dogan") },
      { label: "Söz & Nişan", href: occ("soz-nisan") },
      { label: "Tebrik & Terfi", href: occ("tebrik-terfi") },
      { label: "Açılış & Tören", href: occ("acilis-toren") },
      { label: "Teşekkür", href: occ("tesekkur") },
      { label: "Özür Dilerim", href: occ("ozur-dilerim") },
      { label: "İçimden Geldi", href: occ("icimden-geldi") },
      { label: "Başsağlığı", href: occ("bassagligi") },
    ],
  },

  {
    slug: "orkide-saksi",
    label: "Orkide / Saksı Çiçekleri",
    href: cat("saksi-cicekleri"),
    layout: "flat",
    branches: [
      { label: "Tüm Orkideler", href: cat("orkideler") },
      { label: "Tüm Saksı Çiçekleri", href: cat("saksi-cicekleri") },
      { label: "Teraryumlar", href: cat("teraryum") },
      { label: "Beyaz Orkide", href: ara("beyaz orkide") },
      { label: "Mor Orkide", href: ara("mor orkide") },
      { label: "Mini Orkide", href: ara("mini orkide") },
      { label: "Barış Çiçeği", href: ara("barış") },
      { label: "Monstera", href: ara("monstera") },
      { label: "Areca Palmiyesi", href: ara("palmiye") },
      { label: "Paşa Kılıcı", href: ara("sansevieria") },
      { label: "ZZ Bitkisi", href: ara("zamioculcas") },
      { label: "Devetabanı", href: ara("devetabanı") },
      { label: "Sukulent", href: ara("sukulent") },
      { label: "Kaktüs", href: ara("kaktüs") },
      { label: "Seramik Saksıda Çiçek", href: ara("seramik") },
      { label: "Ferforje Aranjmanlar", href: ara("ferforje") },
    ],
  },

  {
    slug: "hediye",
    label: "Hediye",
    href: "/vitrin/hediye",
    layout: "flat",
    branches: [
      { label: "Tüm Hediyeler", href: col("hediye") },
      { label: "Hediye Setleri", href: cat("hediye-setleri") },
      { label: "Balonlar", href: col("balon") },
      { label: "Pastalar", href: col("pasta") },
      { label: "Çikolatalar", href: col("cikolata") },
      { label: "Premium Hediyeler", href: col("premium") },
      { label: "İndirimdeki Hediyeler", href: col("indirim") },
      { label: "Doğum Günü Hediyesi", href: cat("dogum-gunu") },
      { label: "Yeni Bebek Hediyesi", href: cat("yeni-bebek") },
      { label: "Sevgiliye Hediye", href: occ("sevgiliye") },
      { label: "Yıl Dönümü Hediyesi", href: occ("yil-donumu") },
      { label: "Tebrik & Terfi Hediyesi", href: occ("tebrik-terfi") },
      { label: "Teşekkür Hediyesi", href: occ("tesekkur") },
      { label: "Geçmiş Olsun Hediyesi", href: occ("gecmis-olsun") },
      { label: "Özür Hediyesi", href: occ("ozur-dilerim") },
      { label: "İçimden Geldi", href: occ("icimden-geldi") },
      { label: "Kurumsal Hediye", href: ara("kurumsal") },
      { label: "Anne & Bebek", href: ara("bebek") },
      { label: "Teraryum Hediyesi", href: cat("teraryum") },
    ],
  },

  {
    slug: "hediye-setleri",
    label: "Hediye Setleri",
    href: cat("hediye-setleri"),
    layout: "flat",
    branches: [
      { label: "Tüm Hediye Setleri", href: cat("hediye-setleri") },
      { label: "Çiçek & Çikolata Seti", href: ara("Çikolata Seti") },
      { label: "Gül & Lokum Seti", href: ara("lokum") },
      { label: "Kahve & Çiçek Seti", href: ara("kahve") },
      { label: "Sevgiliye Özel Kutu Set", href: ara("Sevgiliye Özel") },
      { label: "Kurumsal Tebrik Seti", href: ara("kurumsal") },
      { label: "Anne & Bebek Seti", href: ara("anne ve bebek") },
      { label: "Pastalı Çiçek Seti", href: ara("pastalı") },
      { label: "Doğum Günü Setleri", href: ara("doğum günü") },
      { label: "Premium Setler", href: col("premium") },
      { label: "İndirimdeki Setler", href: col("indirim") },
      { label: "Balonlu Setler", href: col("balon") },
    ],
  },

  {
    slug: "kisiye-ozel",
    label: "Kişiye Özel",
    href: "/vitrin/kisiye-ozel",
    layout: "flat",
    branches: [
      { label: "Hediye Notlu Gönderim", href: "/urunler" },
      { label: "Kalp Aranjmanlar", href: ara("kalp") },
      { label: "Kalp Kutuda Güller", href: ara("kalp kutu") },
      { label: "Tek Dal Gül", href: ara("tek dal") },
      { label: "Işıklı Aranjmanlar", href: ara("ışıklı") },
      { label: "Balonlu Buketler", href: ara("balonlu") },
      { label: "Sevgiliye Özel Kutu Set", href: ara("Sevgiliye Özel") },
      { label: "Anne & Bebek Seti", href: ara("anne ve bebek") },
      { label: "Kurumsal Tebrik Seti", href: ara("kurumsal") },
      { label: "Seramik Saksıda Orkide", href: ara("seramik") },
      { label: "Evlilik Teklifi", href: occ("soz-nisan") },
      { label: "İçimden Geldi", href: occ("icimden-geldi") },
    ],
  },

  {
    slug: "el-yapimi",
    label: "El Yapımı",
    href: "/vitrin/el-yapimi",
    layout: "flat",
    branches: [
      { label: "Cam Fanusta Teraryum", href: ara("fanus") },
      { label: "Geometrik Cam Teraryum", href: ara("geometrik") },
      { label: "Askılı Cam Teraryum", href: ara("askılı") },
      { label: "Üçlü Sukulent Seti", href: ara("sukulent seti") },
      { label: "Mini Kaktüs Teraryumu", href: ara("mini kaktüs") },
      { label: "Seramik Saksıda Çiçek", href: ara("seramik") },
      { label: "Ferforje Aranjmanlar", href: ara("ferforje") },
      { label: "Kraft Kutuda Aranjman", href: ara("kraft") },
      { label: "Tüm Teraryumlar", href: cat("teraryum") },
    ],
  },
];

/**
 * Adres kuranlar dışarıya da açık: kategori vitrini (`category-showcase.ts`)
 * aynı kuralları kullanır — özellikle `ara`'nın büyük/küçük harf notunu.
 */
export const href = { cat, col, occ, ara };
