/**
 * Kategori vitrini — kategori sayfasında ürün ızgarasının **üstünde** duran
 * afiş satırları ve alt kategori ızgarası.
 *
 * Düzen ciceksepeti.com'un kategori sayfasından alındı (`CS-NAVBAR-GOZLEM.md`
 * §7): iki geniş afiş → alt kategori ızgarası (6 sütun, sonuncusu "Tümünü
 * görüntüle") → üçlü afiş satırı → ikili afiş satırı → ürünler.
 *
 * Afişlerin fotoğrafı ayrı bir görsel varlık değil: mevcut bir **ürünün**
 * fotoğrafı kullanılır (`productSlug`). Böylece demoya yeni dosya girmiyor,
 * kırık görsel riski kalmıyor ve seed değişince afişler de değişiyor.
 *
 * Her `href` mevcut bir sorguya bağlıdır ve boş dönmediği doğrulandı — kural
 * `nav-tree.ts` ile aynı: **boş vitrin karesi olmasın.**
 */

import { href } from "./nav-tree";

/** Alt kategori kutucuğu: küçük fotoğraf + ad. */
export type ShowcaseTile = {
  label: string;
  href: string;
  /** Kutucuktaki küçük fotoğrafı veren ürün. */
  productSlug: string;
};

/** Geniş afiş: fotoğraf + büyük başlık + küçük rozet. */
export type ShowcaseBanner = {
  title: string;
  badge: string;
  href: string;
  productSlug: string;
};

/** Bir afiş satırı — ikili (geniş) ya da üçlü (alçak). */
export type ShowcaseRow = { size: 2 | 3; banners: ShowcaseBanner[] };

export type CategoryShowcase = {
  /** Ürün ızgarasının hemen üstündeki ilk ikili satır. */
  lead: ShowcaseRow;
  tiles: ShowcaseTile[];
  /** Izgaradan sonra gelen satırlar (üçlü, sonra ikili). */
  rows: ShowcaseRow[];
};

const CATEGORY_SHOWCASE: Record<string, CategoryShowcase> = {
  buketler: {
    lead: {
      size: 2,
      banners: [
        {
          title: "Çok Satan Buketler",
          badge: "Vitrinin favorileri",
          href: "/urunler?kategori=buketler",
          productSlug: "11-kirmizi-gul-buketi",
        },
        {
          title: "Doğum Günü Buketleri",
          badge: "Aynı gün tezgâhtan",
          href: href.occ("dogum-gunu"),
          productSlug: "mevsim-ciceklerinden-renkli-buket",
        },
      ],
    },
    tiles: [
      {
        label: "Gül Buketleri",
        href: href.ara("gül buketi"),
        productSlug: "11-kirmizi-gul-buketi",
      },
      {
        label: "Karışık Mevsim",
        href: href.ara("mevsim"),
        productSlug: "mevsim-ciceklerinden-renkli-buket",
      },
      {
        label: "Papatya & Gerbera",
        href: href.ara("papatya"),
        productSlug: "papatya-sevgisi-buketi",
      },
      {
        label: "Şakayık Buketleri",
        href: href.ara("şakayık"),
        productSlug: "pastel-sakayik-buketi",
      },
      {
        label: "Lisianthus",
        href: href.ara("lisianthus"),
        productSlug: "beyaz-lisianthus-buketi",
      },
      {
        label: "Okaliptüslü",
        href: href.ara("okaliptüs"),
        productSlug: "somon-gul-ve-okaliptus-buketi",
      },
      {
        label: "Bordo Güller",
        href: href.ara("bordo"),
        productSlug: "21-bordo-gul-buketi",
      },
      {
        label: "Beyaz Buketler",
        href: href.ara("beyaz gül"),
        productSlug: "beyaz-gul-ve-cipso-buketi",
      },
      {
        label: "Sevgiliye",
        href: href.occ("sevgiliye"),
        productSlug: "somon-gul-ve-okaliptus-buketi",
      },
      {
        label: "Yıl Dönümü",
        href: href.occ("yil-donumu"),
        productSlug: "beyaz-gul-ve-cipso-buketi",
      },
      {
        label: "Doğum Günü",
        href: href.occ("dogum-gunu"),
        productSlug: "renkli-gerbera-aranjmani",
      },
    ],
    rows: [
      {
        size: 3,
        banners: [
          {
            title: "Pastel Tonlar",
            badge: "Yumuşak geçişler",
            href: href.ara("pastel"),
            productSlug: "pastel-sakayik-buketi",
          },
          {
            title: "Beyaz Buketler",
            badge: "Sade duruş",
            href: href.ara("beyaz"),
            productSlug: "beyaz-lisianthus-buketi",
          },
          {
            title: "Bordo & Kırmızı",
            badge: "Koyu tonlar",
            href: href.ara("bordo"),
            productSlug: "21-bordo-gul-buketi",
          },
        ],
      },
      {
        size: 2,
        banners: [
          {
            title: "Sevgiliye Buket",
            badge: "Gönderim amacı",
            href: href.occ("sevgiliye"),
            productSlug: "somon-gul-ve-okaliptus-buketi",
          },
          {
            title: "Premium Aranjmanlar",
            badge: "2.000 TL üzeri",
            href: href.col("premium"),
            productSlug: "papatya-sevgisi-buketi",
          },
        ],
      },
    ],
  },

  guller: {
    lead: {
      size: 2,
      banners: [
        {
          title: "Kırmızı Güller",
          badge: "Klasiğin kendisi",
          href: href.ara("kırmızı gül"),
          productSlug: "51-kirmizi-gul-aranjmani",
        },
        {
          title: "Kutuda Güller",
          badge: "Kapağı açılır açılmaz",
          href: href.ara("kutuda gül"),
          productSlug: "kutuda-25-kirmizi-gul",
        },
      ],
    },
    tiles: [
      {
        label: "Kırmızı Gül",
        href: href.ara("kırmızı gül"),
        productSlug: "101-kirmizi-gul",
      },
      {
        label: "Pembe Gül",
        href: href.ara("pembe gül"),
        productSlug: "vazoda-15-pembe-gul",
      },
      {
        label: "Beyaz Gül",
        href: href.ara("beyaz gül"),
        productSlug: "silindir-kutuda-beyaz-guller",
      },
      {
        label: "Bordo Gül",
        href: href.ara("bordo"),
        productSlug: "siyah-kutuda-bordo-guller",
      },
      {
        label: "Vazoda Gül",
        href: href.ara("vazoda"),
        productSlug: "vazoda-15-pembe-gul",
      },
      {
        label: "Kalp Aranjman",
        href: href.ara("kalp"),
        productSlug: "33-gulden-kalp-aranjman",
      },
      {
        label: "Tek Dal Gül",
        href: href.ara("tek dal"),
        productSlug: "tek-dal-kirmizi-gul",
      },
      {
        label: "Kutuda Güller",
        href: href.ara("kutuda gül"),
        productSlug: "kutuda-25-kirmizi-gul",
      },
      {
        label: "Sevgiliye",
        href: href.occ("sevgiliye"),
        productSlug: "7-kirmizi-gul-buketi",
      },
      {
        label: "Yıl Dönümü",
        href: href.occ("yil-donumu"),
        productSlug: "51-kirmizi-gul-aranjmani",
      },
      {
        label: "Premium Güller",
        href: href.col("premium"),
        productSlug: "silindir-kutuda-pudra-guller",
      },
    ],
    rows: [
      {
        size: 3,
        banners: [
          {
            title: "Yıl Dönümü Gülleri",
            badge: "Seneyi kutla",
            href: href.occ("yil-donumu"),
            productSlug: "101-kirmizi-gul",
          },
          {
            title: "Tek Dal Jest",
            badge: "Küçük ama net",
            href: href.ara("tek dal"),
            productSlug: "tek-dal-kirmizi-gul",
          },
          {
            title: "Kalp Aranjmanlar",
            badge: "Form olarak kalp",
            href: href.ara("kalp"),
            productSlug: "33-gulden-kalp-aranjman",
          },
        ],
      },
      {
        size: 2,
        banners: [
          {
            title: "Sevgiliye Gül",
            badge: "Gönderim amacı",
            href: href.occ("sevgiliye"),
            productSlug: "7-kirmizi-gul-buketi",
          },
          {
            title: "İndirimdeki Güller",
            badge: "Süresi dolmadan",
            href: href.col("indirim"),
            productSlug: "vazoda-15-pembe-gul",
          },
        ],
      },
    ],
  },

  orkideler: {
    lead: {
      size: 2,
      banners: [
        {
          title: "Beyaz Orkideler",
          badge: "Ofise ve eve",
          href: href.ara("beyaz orkide"),
          productSlug: "beyaz-orkide-ferforje",
        },
        {
          title: "Ferforje Aranjmanlar",
          badge: "Tören ve açılış",
          href: href.ara("ferforje"),
          productSlug: "ikili-beyaz-orkide-ferforje",
        },
      ],
    },
    tiles: [
      {
        label: "Beyaz Orkide",
        href: href.ara("beyaz orkide"),
        productSlug: "tek-dalli-beyaz-orkide",
      },
      {
        label: "Mor Orkide",
        href: href.ara("mor orkide"),
        productSlug: "cift-dalli-mor-orkide",
      },
      {
        label: "Pembe Orkide",
        href: href.ara("pembe orkide"),
        productSlug: "pembe-orkide-seramik-saksida",
      },
      {
        label: "Mini Orkide",
        href: href.ara("mini orkide"),
        productSlug: "mini-orkide-bahcesi",
      },
      {
        label: "Ferforje",
        href: href.ara("ferforje"),
        productSlug: "beyaz-orkide-ferforje",
      },
      {
        label: "Seramik Saksıda",
        href: href.ara("seramik"),
        productSlug: "pembe-orkide-seramik-saksida",
      },
      {
        label: "Tebrik & Terfi",
        href: href.occ("tebrik-terfi"),
        productSlug: "ikili-beyaz-orkide-ferforje",
      },
      {
        label: "Geçmiş Olsun",
        href: href.occ("gecmis-olsun"),
        productSlug: "baris-cicegi-spathiphyllum",
      },
      {
        label: "Açılış & Tören",
        href: href.occ("acilis-toren"),
        productSlug: "acilis-celengi-ferforje",
      },
      {
        label: "Saksı Çiçekleri",
        href: href.cat("saksi-cicekleri"),
        productSlug: "monstera-deliciosa",
      },
      {
        label: "Teraryumlar",
        href: href.cat("teraryum"),
        productSlug: "cam-fanusta-sukulent-teraryum",
      },
    ],
    rows: [
      {
        size: 3,
        banners: [
          {
            title: "Tebrik & Terfi",
            badge: "Yeni işe, iyi habere",
            href: href.occ("tebrik-terfi"),
            productSlug: "ikili-beyaz-orkide-ferforje",
          },
          {
            title: "Geçmiş Olsun",
            badge: "Kokusu ağır değil",
            href: href.occ("gecmis-olsun"),
            productSlug: "tek-dalli-beyaz-orkide",
          },
          {
            title: "Mini Orkideler",
            badge: "Masaüstü ölçüsü",
            href: href.ara("mini orkide"),
            productSlug: "mini-orkide-bahcesi",
          },
        ],
      },
      {
        size: 2,
        banners: [
          {
            title: "Mor Orkide Seçkisi",
            badge: "Renk olarak mor",
            href: href.ara("mor orkide"),
            productSlug: "cift-dalli-mor-orkide",
          },
          {
            title: "Premium Orkideler",
            badge: "2.000 TL üzeri",
            href: href.col("premium"),
            productSlug: "beyaz-orkide-ferforje",
          },
        ],
      },
    ],
  },

  "kutuda-cicek": {
    lead: {
      size: 2,
      banners: [
        {
          title: "Kalp Kutuda Çiçek",
          badge: "Kutunun kendisi hediye",
          href: href.ara("kalp kutu"),
          productSlug: "kalp-kutuda-kirmizi-guller",
        },
        {
          title: "Silindir Kutular",
          badge: "Şapka kutusu formu",
          href: href.ara("silindir"),
          productSlug: "silindir-kutuda-beyaz-guller",
        },
      ],
    },
    tiles: [
      {
        label: "Kalp Kutu",
        href: href.ara("kalp kutu"),
        productSlug: "kalp-kutuda-kirmizi-guller",
      },
      {
        label: "Silindir Kutu",
        href: href.ara("silindir"),
        productSlug: "silindir-kutuda-pudra-guller",
      },
      {
        label: "Siyah Kutu",
        href: href.ara("siyah kutu"),
        productSlug: "siyah-kutuda-bordo-guller",
      },
      {
        label: "Kraft Kutu",
        href: href.ara("kraft"),
        productSlug: "kraft-kutuda-papatya-ve-gul",
      },
      {
        label: "Pastel Aranjman",
        href: href.ara("pastel"),
        productSlug: "kutuda-pastel-aranjman",
      },
      {
        label: "Şakayıklı Kutu",
        href: href.ara("şakayık"),
        productSlug: "kutuda-sakayik-ve-gul",
      },
      {
        label: "Kutuda Güller",
        href: href.ara("kutuda gül"),
        productSlug: "kutuda-25-kirmizi-gul",
      },
      {
        label: "Sevgiliye",
        href: href.occ("sevgiliye"),
        productSlug: "33-gulden-kalp-aranjman",
      },
      {
        label: "Doğum Günü",
        href: href.occ("dogum-gunu"),
        productSlug: "iyi-ki-dogdun-kutu-cicek",
      },
      {
        label: "Yıl Dönümü",
        href: href.occ("yil-donumu"),
        productSlug: "silindir-kutuda-beyaz-guller",
      },
      {
        label: "Premium Kutular",
        href: href.col("premium"),
        productSlug: "101-kirmizi-gul",
      },
    ],
    rows: [
      {
        size: 3,
        banners: [
          {
            title: "Sevgiliye Kutu",
            badge: "Gönderim amacı",
            href: href.occ("sevgiliye"),
            productSlug: "kalp-kutuda-kirmizi-guller",
          },
          {
            title: "Pudra & Pastel",
            badge: "Sakin tonlar",
            href: href.ara("pastel"),
            productSlug: "silindir-kutuda-pudra-guller",
          },
          {
            title: "Bordo Kutular",
            badge: "Koyu ve iddialı",
            href: href.ara("bordo"),
            productSlug: "siyah-kutuda-bordo-guller",
          },
        ],
      },
      {
        size: 2,
        banners: [
          {
            title: "Kutuda Güller",
            badge: "Yalnızca gül",
            href: href.ara("kutuda gül"),
            productSlug: "kutuda-25-kirmizi-gul",
          },
          {
            title: "İçimden Geldi",
            badge: "Sebep gerekmez",
            href: href.occ("icimden-geldi"),
            productSlug: "kraft-kutuda-papatya-ve-gul",
          },
        ],
      },
    ],
  },

  teraryum: {
    lead: {
      size: 2,
      banners: [
        {
          title: "Cam Fanusta Teraryum",
          badge: "Kendi ekosistemi",
          href: href.ara("fanus"),
          productSlug: "cam-fanusta-sukulent-teraryum",
        },
        {
          title: "Sukulent Setleri",
          badge: "Bakımı kolay",
          href: href.ara("sukulent"),
          productSlug: "uclu-sukulent-seti",
        },
      ],
    },
    tiles: [
      {
        label: "Cam Fanus",
        href: href.ara("fanus"),
        productSlug: "cam-fanusta-sukulent-teraryum",
      },
      {
        label: "Geometrik Cam",
        href: href.ara("geometrik"),
        productSlug: "geometrik-cam-teraryum",
      },
      {
        label: "Askılı Teraryum",
        href: href.ara("askılı"),
        productSlug: "askili-cam-teraryum",
      },
      {
        label: "Mini Kaktüs",
        href: href.ara("mini kaktüs"),
        productSlug: "mini-kaktus-teraryumu",
      },
      {
        label: "Sukulent Seti",
        href: href.ara("sukulent seti"),
        productSlug: "uclu-sukulent-seti",
      },
      {
        label: "Saksı Çiçekleri",
        href: href.cat("saksi-cicekleri"),
        productSlug: "monstera-deliciosa",
      },
      {
        label: "Monstera",
        href: href.ara("monstera"),
        productSlug: "monstera-deliciosa",
      },
      {
        label: "Barış Çiçeği",
        href: href.ara("barış"),
        productSlug: "baris-cicegi-spathiphyllum",
      },
      {
        label: "Devetabanı",
        href: href.ara("devetabanı"),
        productSlug: "devetabani-philodendron",
      },
      {
        label: "Yeni İş & Terfi",
        href: href.occ("tebrik-terfi"),
        productSlug: "zamioculcas-zz-bitkisi",
      },
      {
        label: "İçimden Geldi",
        href: href.occ("icimden-geldi"),
        productSlug: "areca-palmiyesi",
      },
    ],
    rows: [
      {
        size: 3,
        banners: [
          {
            title: "Masaüstü Yeşili",
            badge: "Ofise sığar",
            href: href.ara("mini kaktüs"),
            productSlug: "mini-kaktus-teraryumu",
          },
          {
            title: "Askıda Duranlar",
            badge: "Duvara ve pencereye",
            href: href.ara("askılı"),
            productSlug: "askili-cam-teraryum",
          },
          {
            title: "Geometrik Formlar",
            badge: "Cam ve metal",
            href: href.ara("geometrik"),
            productSlug: "geometrik-cam-teraryum",
          },
        ],
      },
      {
        size: 2,
        banners: [
          {
            title: "Yeni İş & Terfi",
            badge: "Masaya yakışan",
            href: href.occ("tebrik-terfi"),
            productSlug: "uclu-sukulent-seti",
          },
          {
            title: "İçimden Geldi",
            badge: "Sebep gerekmez",
            href: href.occ("icimden-geldi"),
            productSlug: "cam-fanusta-sukulent-teraryum",
          },
        ],
      },
    ],
  },

  "saksi-cicekleri": {
    lead: {
      size: 2,
      banners: [
        {
          title: "Salon Bitkileri",
          badge: "Yıllarca kalır",
          href: href.cat("saksi-cicekleri"),
          productSlug: "monstera-deliciosa",
        },
        {
          title: "Bakımı Kolay Olanlar",
          badge: "Az su, az ışık",
          href: href.ara("sansevieria"),
          productSlug: "sansevieria-pasa-kilici",
        },
      ],
    },
    tiles: [
      {
        label: "Monstera",
        href: href.ara("monstera"),
        productSlug: "monstera-deliciosa",
      },
      {
        label: "ZZ Bitkisi",
        href: href.ara("zamioculcas"),
        productSlug: "zamioculcas-zz-bitkisi",
      },
      {
        label: "Devetabanı",
        href: href.ara("devetabanı"),
        productSlug: "devetabani-philodendron",
      },
      {
        label: "Barış Çiçeği",
        href: href.ara("barış"),
        productSlug: "baris-cicegi-spathiphyllum",
      },
      {
        label: "Areca Palmiyesi",
        href: href.ara("palmiye"),
        productSlug: "areca-palmiyesi",
      },
      {
        label: "Paşa Kılıcı",
        href: href.ara("sansevieria"),
        productSlug: "sansevieria-pasa-kilici",
      },
      {
        label: "Teraryumlar",
        href: href.cat("teraryum"),
        productSlug: "cam-fanusta-sukulent-teraryum",
      },
      {
        label: "Orkideler",
        href: href.cat("orkideler"),
        productSlug: "tek-dalli-beyaz-orkide",
      },
      {
        label: "Geçmiş Olsun",
        href: href.occ("gecmis-olsun"),
        productSlug: "mini-orkide-bahcesi",
      },
      {
        label: "Yeni İş & Terfi",
        href: href.occ("tebrik-terfi"),
        productSlug: "uclu-sukulent-seti",
      },
      {
        label: "Sukulent",
        href: href.ara("sukulent"),
        productSlug: "geometrik-cam-teraryum",
      },
    ],
    rows: [
      {
        size: 3,
        banners: [
          {
            title: "Geçmiş Olsun",
            badge: "Hastane ziyaretine",
            href: href.occ("gecmis-olsun"),
            productSlug: "baris-cicegi-spathiphyllum",
          },
          {
            title: "Yeni İş & Terfi",
            badge: "Yeni masaya",
            href: href.occ("tebrik-terfi"),
            productSlug: "zamioculcas-zz-bitkisi",
          },
          {
            title: "Büyük Yapraklılar",
            badge: "Köşeyi doldurur",
            href: href.ara("monstera"),
            productSlug: "monstera-deliciosa",
          },
        ],
      },
      {
        size: 2,
        banners: [
          {
            title: "Sukulent & Kaktüs",
            badge: "Suyu unutulanlara",
            href: href.ara("sukulent"),
            productSlug: "uclu-sukulent-seti",
          },
          {
            title: "Ev Hediyesi",
            badge: "İçimden geldi",
            href: href.occ("icimden-geldi"),
            productSlug: "areca-palmiyesi",
          },
        ],
      },
    ],
  },

  celenk: {
    lead: {
      size: 2,
      banners: [
        {
          title: "Açılış Çelenkleri",
          badge: "Tören ve açılış",
          href: href.occ("acilis-toren"),
          productSlug: "acilis-celengi-ferforje",
        },
        {
          title: "Cenaze Çelenkleri",
          badge: "Başsağlığı",
          href: href.occ("bassagligi"),
          productSlug: "ayakli-cenaze-celengi",
        },
      ],
    },
    tiles: [
      {
        label: "Açılış Çelengi",
        href: href.ara("açılış"),
        productSlug: "acilis-celengi-ferforje",
      },
      {
        label: "Cenaze Çelengi",
        href: href.ara("cenaze"),
        productSlug: "ayakli-cenaze-celengi",
      },
      {
        label: "Beyaz Gül Çelenk",
        href: href.ara("Gül Çelenk"),
        productSlug: "beyaz-gul-celenk",
      },
      {
        label: "Lilyum Çelenk",
        href: href.ara("lilyum"),
        productSlug: "beyaz-lilyum-celenk",
      },
      {
        label: "Karma Çelenk",
        href: href.ara("karma"),
        productSlug: "karma-cicek-celenk",
      },
      {
        label: "Ferforje",
        href: href.ara("ferforje"),
        productSlug: "beyaz-orkide-ferforje",
      },
      {
        label: "Açılış & Tören",
        href: href.occ("acilis-toren"),
        productSlug: "ikili-beyaz-orkide-ferforje",
      },
      {
        label: "Başsağlığı",
        href: href.occ("bassagligi"),
        productSlug: "beyaz-lisianthus-buketi",
      },
      {
        label: "Tebrik & Terfi",
        href: href.occ("tebrik-terfi"),
        productSlug: "kurumsal-tebrik-seti",
      },
      {
        label: "Orkideler",
        href: href.cat("orkideler"),
        productSlug: "tek-dalli-beyaz-orkide",
      },
      {
        label: "Premium Çelenk",
        href: href.col("premium"),
        productSlug: "101-kirmizi-gul",
      },
    ],
    rows: [
      {
        size: 3,
        banners: [
          {
            title: "Beyaz Çelenkler",
            badge: "Sade ve resmî",
            href: href.ara("beyaz"),
            productSlug: "beyaz-gul-celenk",
          },
          {
            title: "Lilyumlu Olanlar",
            badge: "Kokusu belirgin",
            href: href.ara("lilyum"),
            productSlug: "beyaz-lilyum-celenk",
          },
          {
            title: "Karma Çiçekli",
            badge: "Renkli tören",
            href: href.ara("karma"),
            productSlug: "karma-cicek-celenk",
          },
        ],
      },
      {
        size: 2,
        banners: [
          {
            title: "Kurumsal Gönderim",
            badge: "Şirket adına",
            href: href.ara("kurumsal"),
            productSlug: "acilis-celengi-ferforje",
          },
          {
            title: "Premium Çelenkler",
            badge: "2.000 TL üzeri",
            href: href.col("premium"),
            productSlug: "ayakli-cenaze-celengi",
          },
        ],
      },
    ],
  },

  "hediye-setleri": {
    lead: {
      size: 2,
      banners: [
        {
          title: "Çiçek & Çikolata",
          badge: "İkisi bir arada",
          href: href.ara("Çikolata Seti"),
          productSlug: "cicek-ve-cikolata-seti",
        },
        {
          title: "Sevgiliye Kutu Set",
          badge: "Hazır paket",
          href: href.ara("Sevgiliye Özel"),
          productSlug: "sevgiliye-ozel-kutu-set",
        },
      ],
    },
    tiles: [
      {
        label: "Çiçek & Çikolata",
        href: href.ara("Çikolata Seti"),
        productSlug: "cicek-ve-cikolata-seti",
      },
      {
        label: "Gül & Lokum",
        href: href.ara("lokum"),
        productSlug: "gul-buketi-ve-lokum-seti",
      },
      {
        label: "Kahve & Çiçek",
        href: href.ara("kahve"),
        productSlug: "kahve-ve-cicek-seti",
      },
      {
        label: "Kurumsal Set",
        href: href.ara("kurumsal"),
        productSlug: "kurumsal-tebrik-seti",
      },
      {
        label: "Sevgiliye Set",
        href: href.ara("Sevgiliye Özel"),
        productSlug: "sevgiliye-ozel-kutu-set",
      },
      {
        label: "Anne & Bebek",
        href: href.ara("anne ve bebek"),
        productSlug: "anne-ve-bebek-hediye-seti",
      },
      {
        label: "Doğum Günü Setleri",
        href: href.occ("dogum-gunu"),
        productSlug: "pastali-cicek-seti",
      },
      {
        label: "Yeni Bebek Setleri",
        href: href.cat("yeni-bebek"),
        productSlug: "hos-geldin-bebek-pembe-aranjman",
      },
      {
        label: "Buketli Setler",
        href: href.cat("buketler"),
        productSlug: "11-kirmizi-gul-buketi",
      },
      {
        label: "Teraryum Hediyesi",
        href: href.cat("teraryum"),
        productSlug: "cam-fanusta-sukulent-teraryum",
      },
      {
        label: "Premium Setler",
        href: href.col("premium"),
        productSlug: "51-kirmizi-gul-aranjmani",
      },
    ],
    rows: [
      {
        size: 3,
        banners: [
          {
            title: "Çikolatalar",
            badge: "Sete eklenir",
            href: href.col("cikolata"),
            productSlug: "cicek-ve-cikolata-seti",
          },
          {
            title: "Pastalar",
            badge: "14:00'e kadar",
            href: href.col("pasta"),
            productSlug: "pastali-cicek-seti",
          },
          {
            title: "Balonlar",
            badge: "Elden teslim",
            href: href.col("balon"),
            productSlug: "dogum-gunu-balonlu-buket",
          },
        ],
      },
      {
        size: 2,
        banners: [
          {
            title: "Tebrik & Terfi Seti",
            badge: "Yeni işe",
            href: href.occ("tebrik-terfi"),
            productSlug: "kurumsal-tebrik-seti",
          },
          {
            title: "Premium Setler",
            badge: "2.000 TL üzeri",
            href: href.col("premium"),
            productSlug: "kahve-ve-cicek-seti",
          },
        ],
      },
    ],
  },

  "dogum-gunu": {
    lead: {
      size: 2,
      banners: [
        {
          title: "Balonlu Buketler",
          badge: "Kapıda sürpriz",
          href: href.ara("balonlu"),
          productSlug: "dogum-gunu-balonlu-buket",
        },
        {
          title: "İyi ki Doğdun Kutu",
          badge: "Kutu açılınca",
          href: href.ara("İyi ki"),
          productSlug: "iyi-ki-dogdun-kutu-cicek",
        },
      ],
    },
    tiles: [
      {
        label: "Balonlu Buket",
        href: href.ara("balonlu"),
        productSlug: "dogum-gunu-balonlu-buket",
      },
      {
        label: "Işıklı Aranjman",
        href: href.ara("ışıklı"),
        productSlug: "isikli-dogum-gunu-aranjmani",
      },
      {
        label: "Renkli Gerbera",
        href: href.ara("gerbera"),
        productSlug: "renkli-gerbera-aranjmani",
      },
      {
        label: "Pastalı Set",
        href: href.ara("pastalı"),
        productSlug: "pastali-cicek-seti",
      },
      {
        label: "Hediye Setleri",
        href: href.cat("hediye-setleri"),
        productSlug: "cicek-ve-cikolata-seti",
      },
      {
        label: "Kutuda Çiçek",
        href: href.cat("kutuda-cicek"),
        productSlug: "kutuda-pastel-aranjman",
      },
      {
        label: "Doğum Günü Amaçlı",
        href: href.occ("dogum-gunu"),
        productSlug: "mevsim-ciceklerinden-renkli-buket",
      },
      {
        label: "Buketler",
        href: href.cat("buketler"),
        productSlug: "11-kirmizi-gul-buketi",
      },
      {
        label: "Güller",
        href: href.cat("guller"),
        productSlug: "51-kirmizi-gul-aranjmani",
      },
      {
        label: "Orkideler",
        href: href.cat("orkideler"),
        productSlug: "tek-dalli-beyaz-orkide",
      },
      {
        label: "Premium Seçimler",
        href: href.col("premium"),
        productSlug: "kutuda-25-kirmizi-gul",
      },
    ],
    rows: [
      {
        size: 3,
        banners: [
          {
            title: "Balonlar",
            badge: "Buketin yanına",
            href: href.col("balon"),
            productSlug: "dogum-gunu-balonlu-buket",
          },
          {
            title: "Pastalar",
            badge: "14:00'e kadar",
            href: href.col("pasta"),
            productSlug: "pastali-cicek-seti",
          },
          {
            title: "Çikolatalar",
            badge: "Butik kutular",
            href: href.col("cikolata"),
            productSlug: "cicek-ve-cikolata-seti",
          },
        ],
      },
      {
        size: 2,
        banners: [
          {
            title: "Doğum Günü Amaçlı Tümü",
            badge: "Gönderim amacı",
            href: href.occ("dogum-gunu"),
            productSlug: "renkli-gerbera-aranjmani",
          },
          {
            title: "İndirimdekiler",
            badge: "Süresi dolmadan",
            href: href.col("indirim"),
            productSlug: "isikli-dogum-gunu-aranjmani",
          },
        ],
      },
    ],
  },

  "yeni-bebek": {
    lead: {
      size: 2,
      banners: [
        {
          title: "Hoş Geldin Bebek",
          badge: "Hastaneye ve eve",
          href: href.ara("bebek"),
          productSlug: "hos-geldin-bebek-pembe-aranjman",
        },
        {
          title: "Anne & Bebek Seti",
          badge: "İkisine birden",
          href: href.ara("anne ve bebek"),
          productSlug: "anne-ve-bebek-hediye-seti",
        },
      ],
    },
    tiles: [
      {
        label: "Pembe Aranjman",
        href: href.ara("pembe"),
        productSlug: "hos-geldin-bebek-pembe-aranjman",
      },
      {
        label: "Mavi Aranjman",
        href: href.ara("mavi"),
        productSlug: "hos-geldin-bebek-mavi-aranjman",
      },
      {
        label: "Bebek Arabası",
        href: href.ara("bebek arabası"),
        productSlug: "bebek-arabasi-cicek-aranjmani",
      },
      {
        label: "Anne & Bebek",
        href: href.ara("anne ve bebek"),
        productSlug: "anne-ve-bebek-hediye-seti",
      },
      {
        label: "Hediye Setleri",
        href: href.cat("hediye-setleri"),
        productSlug: "cicek-ve-cikolata-seti",
      },
      {
        label: "Teraryum",
        href: href.cat("teraryum"),
        productSlug: "uclu-sukulent-seti",
      },
      {
        label: "Yeni Doğan Amaçlı",
        href: href.occ("yeni-dogan"),
        productSlug: "kutuda-pastel-aranjman",
      },
      {
        label: "Buketler",
        href: href.cat("buketler"),
        productSlug: "pastel-sakayik-buketi",
      },
      {
        label: "Saksı Çiçekleri",
        href: href.cat("saksi-cicekleri"),
        productSlug: "baris-cicegi-spathiphyllum",
      },
      {
        label: "Orkideler",
        href: href.cat("orkideler"),
        productSlug: "pembe-orkide-seramik-saksida",
      },
      {
        label: "Balonlar",
        href: href.col("balon"),
        productSlug: "dogum-gunu-balonlu-buket",
      },
    ],
    rows: [
      {
        size: 3,
        banners: [
          {
            title: "Yeni Doğan",
            badge: "Gönderim amacı",
            href: href.occ("yeni-dogan"),
            productSlug: "bebek-arabasi-cicek-aranjmani",
          },
          {
            title: "Balonlar",
            badge: "Odaya renk",
            href: href.col("balon"),
            productSlug: "dogum-gunu-balonlu-buket",
          },
          {
            title: "Çikolatalar",
            badge: "Ziyarete giderken",
            href: href.col("cikolata"),
            productSlug: "cicek-ve-cikolata-seti",
          },
        ],
      },
      {
        size: 2,
        banners: [
          {
            title: "Tebrik Çiçekleri",
            badge: "Gönderim amacı",
            href: href.occ("tesekkur"),
            productSlug: "hos-geldin-bebek-mavi-aranjman",
          },
          {
            title: "Hediye Setleri",
            badge: "Hazır paket",
            href: href.cat("hediye-setleri"),
            productSlug: "anne-ve-bebek-hediye-seti",
          },
        ],
      },
    ],
  },
};

export const findShowcase = (slug: string): CategoryShowcase | null =>
  CATEGORY_SHOWCASE[slug] ?? null;

/** Vitrinin fotoğraf için ihtiyaç duyduğu bütün ürün slug'ları — tek sorguda çekilir. */
export const showcaseProductSlugs = (showcase: CategoryShowcase): string[] => {
  const rows = [showcase.lead, ...showcase.rows];
  return [
    ...new Set([
      ...rows.flatMap((row) => row.banners.map((b) => b.productSlug)),
      ...showcase.tiles.map((t) => t.productSlug),
    ]),
  ];
};
