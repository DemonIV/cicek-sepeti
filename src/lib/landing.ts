/**
 * Vitrin sayfaları — navbar'ın üst başlıkları için `/vitrin/<slug>`.
 *
 * Kategori sayfası (`/kategori/<slug>`) ürünün **ne olduğunu** listeler ve
 * `Category` tablosuna dayanır. Üst başlıkların bir kısmının ise tabloda
 * karşılığı yok: "Çiçek" yedi kategoriyi birden toplar, "Hediye" bir koleksiyon
 * sorgusudur, "Kişiye Özel" elle seçilmiş bir listedir. Bunlar için tabloya
 * satır açmak yerine burada tanımlı birer vitrin sayfası var.
 *
 * Her vitrin üç şeyden oluşur:
 *   1. `where` — ürün ızgarasını dolduran Prisma parçası,
 *   2. `showcase` — ızgaranın üstündeki afiş satırları ve alt kategori
 *      kutucukları (`CategoryShowcase` ile aynı tip, aynı bileşen),
 *   3. başlık metinleri ve kapak fotoğrafını veren ürün.
 *
 * Kural `nav-tree.ts` ve `category-showcase.ts` ile aynı: **boş kare olmasın.**
 * Bütün adresler ve fotoğraf ürünleri seed verisine karşı doğrulandı.
 */

import type { Prisma } from "@prisma/client";
import type { CategoryShowcase } from "./category-showcase";
import { href } from "./nav-tree";

export type Landing = {
  slug: string;
  /** Navbar'daki başlık. */
  label: string;
  /** Kapaktaki büyük başlık. */
  title: string;
  tagline: string;
  /** Kapak fotoğrafını veren ürün. */
  coverProductSlug: string;
  where: Prisma.ProductWhereInput;
  showcase: CategoryShowcase;
};

/** "Çiçek" başlığının topladığı kategoriler — ek ürün ve hediye seti hariç. */
const FLOWER_CATEGORIES = [
  "buketler",
  "guller",
  "orkideler",
  "kutuda-cicek",
  "teraryum",
  "saksi-cicekleri",
  "celenk",
];

/**
 * "Kişiye Özel" elle seçilir: pazaryerinde kişiselleştirme alanı yok, ama
 * tek kişiye kurulmuş ürünler var (kalp aranjman, tek dal, ışıklı kutu, set).
 * Liste kısa tutuldu — vitrinde ne varsa ızgarada da o olsun.
 */
const PERSONAL_SLUGS = [
  "33-gulden-kalp-aranjman",
  "kalp-kutuda-kirmizi-guller",
  "tek-dal-kirmizi-gul",
  "isikli-dogum-gunu-aranjmani",
  "dogum-gunu-balonlu-buket",
  "iyi-ki-dogdun-kutu-cicek",
  "sevgiliye-ozel-kutu-set",
  "anne-ve-bebek-hediye-seti",
  "kurumsal-tebrik-seti",
  "pembe-orkide-seramik-saksida",
  "pastali-cicek-seti",
  "gul-buketi-ve-lokum-seti",
  "cicek-ve-cikolata-seti",
  "kahve-ve-cicek-seti",
  "kutuda-sakayik-ve-gul",
];

/** "El Yapımı" — teraryumlar ve elde kurulan cam / seramik / ferforje işler. */
const HANDMADE_SLUGS = [
  "pembe-orkide-seramik-saksida",
  "kraft-kutuda-papatya-ve-gul",
  "acilis-celengi-ferforje",
  "beyaz-orkide-ferforje",
  "ikili-beyaz-orkide-ferforje",
  "karma-cicek-celenk",
];

export const LANDINGS: Landing[] = [
  {
    slug: "cicek",
    label: "Çiçek",
    title: "Çiçek",
    tagline: "Buketten çelenge, pazaryerindeki bütün çiçek",
    coverProductSlug: "51-kirmizi-gul-aranjmani",
    where: { category: { slug: { in: FLOWER_CATEGORIES } } },
    showcase: {
      lead: {
        size: 2,
        banners: [
          {
            title: "Trend Buketler",
            badge: "Bu hafta tezgâhta",
            href: href.cat("buketler"),
            productSlug: "mevsim-ciceklerinden-renkli-buket",
          },
          {
            title: "Doğum Günü Çiçekleri",
            badge: "Gönderim amacı",
            href: href.occ("dogum-gunu"),
            productSlug: "renkli-gerbera-aranjmani",
          },
        ],
      },
      tiles: [
        {
          label: "Çiçek Buketleri",
          href: href.cat("buketler"),
          productSlug: "somon-gul-ve-okaliptus-buketi",
        },
        {
          label: "Güller",
          href: href.cat("guller"),
          productSlug: "51-kirmizi-gul-aranjmani",
        },
        {
          label: "Orkideler",
          href: href.cat("orkideler"),
          productSlug: "beyaz-orkide-ferforje",
        },
        {
          label: "Kutuda Çiçek",
          href: href.cat("kutuda-cicek"),
          productSlug: "silindir-kutuda-beyaz-guller",
        },
        {
          label: "Saksı Çiçekleri",
          href: href.cat("saksi-cicekleri"),
          productSlug: "monstera-deliciosa",
        },
        {
          label: "Teraryum",
          href: href.cat("teraryum"),
          productSlug: "cam-fanusta-sukulent-teraryum",
        },
        {
          label: "Çelenkler",
          href: href.cat("celenk"),
          productSlug: "acilis-celengi-ferforje",
        },
        {
          label: "Vazoda Çiçek",
          href: href.ara("vazoda"),
          productSlug: "vazoda-15-pembe-gul",
        },
        {
          label: "Lilyum & Zambak",
          href: href.ara("lilyum"),
          productSlug: "beyaz-lilyum-celenk",
        },
        {
          label: "Kalp Aranjmanlar",
          href: href.ara("kalp"),
          productSlug: "33-gulden-kalp-aranjman",
        },
        {
          label: "Premium Aranjman",
          href: href.col("premium"),
          productSlug: "101-kirmizi-gul",
        },
      ],
      rows: [
        {
          size: 3,
          banners: [
            {
              title: "Sevgiliye Çiçek",
              badge: "Gönderim amacı",
              href: href.occ("sevgiliye"),
              productSlug: "7-kirmizi-gul-buketi",
            },
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
              productSlug: "ikili-beyaz-orkide-ferforje",
            },
          ],
        },
        {
          size: 2,
          banners: [
            {
              title: "Kutuda Güller",
              badge: "Kapağı açılır açılmaz",
              href: href.ara("kutuda gül"),
              productSlug: "kutuda-25-kirmizi-gul",
            },
            {
              title: "Renge Göre Çiçekler",
              badge: "Pastel, beyaz, bordo",
              href: href.ara("pastel"),
              productSlug: "pastel-sakayik-buketi",
            },
          ],
        },
      ],
    },
  },

  {
    slug: "yenilebilir-cicek",
    label: "Yenilebilir Çiçek",
    title: "Yenilebilir Çiçek",
    tagline: "Çiçeğin yanına giden gurme kutular ve setler",
    coverProductSlug: "cicek-ve-cikolata-seti",
    where: {
      OR: [
        { addOnKind: { in: ["PASTA", "CIKOLATA"] } },
        { category: { slug: "hediye-setleri" } },
        { slug: "pastali-cicek-seti" },
      ],
    },
    showcase: {
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
            title: "Pastalı Çiçek Seti",
            badge: "14:00'e kadar aynı gün",
            href: href.ara("pastalı"),
            productSlug: "pastali-cicek-seti",
          },
        ],
      },
      tiles: [
        {
          label: "Çikolatalar",
          href: href.col("cikolata"),
          productSlug: "cicek-ve-cikolata-seti",
        },
        {
          label: "Pastalar",
          href: href.col("pasta"),
          productSlug: "pastali-cicek-seti",
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
          label: "Sevgiliye Lezzet",
          href: href.ara("Sevgiliye Özel"),
          productSlug: "sevgiliye-ozel-kutu-set",
        },
        {
          label: "Kurumsal İkram",
          href: href.ara("kurumsal"),
          productSlug: "kurumsal-tebrik-seti",
        },
        {
          label: "Anne & Bebek",
          href: href.ara("anne ve bebek"),
          productSlug: "anne-ve-bebek-hediye-seti",
        },
        {
          label: "Doğum Günü",
          href: href.occ("dogum-gunu"),
          productSlug: "iyi-ki-dogdun-kutu-cicek",
        },
        {
          label: "Hediye Setleri",
          href: href.cat("hediye-setleri"),
          productSlug: "cicek-ve-cikolata-seti",
        },
        {
          label: "Balonlar",
          href: href.col("balon"),
          productSlug: "dogum-gunu-balonlu-buket",
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
              badge: "Butik kutular",
              href: href.col("cikolata"),
              productSlug: "gul-buketi-ve-lokum-seti",
            },
            {
              title: "Pastalar",
              badge: "Aynı gün penceresi",
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
              title: "Doğum Günü Lezzetleri",
              badge: "Gönderim amacı",
              href: href.occ("dogum-gunu"),
              productSlug: "isikli-dogum-gunu-aranjmani",
            },
            {
              title: "Yıl Dönümü Setleri",
              badge: "Seneyi kutla",
              href: href.occ("yil-donumu"),
              productSlug: "kahve-ve-cicek-seti",
            },
          ],
        },
      ],
    },
  },

  {
    slug: "gonderim-amaci",
    label: "Gönderim Amacı",
    title: "Gönderim Amacı",
    tagline: "Ne göndereceğini değil, niçin gönderdiğini seç",
    coverProductSlug: "mevsim-ciceklerinden-renkli-buket",
    where: { occasions: { some: {} } },
    showcase: {
      lead: {
        size: 2,
        banners: [
          {
            title: "Doğum Günü",
            badge: "En çok gönderilen amaç",
            href: href.occ("dogum-gunu"),
            productSlug: "renkli-gerbera-aranjmani",
          },
          {
            title: "Sevgiliye",
            badge: "Kırmızı gülün kısa yolu",
            href: href.occ("sevgiliye"),
            productSlug: "kalp-kutuda-kirmizi-guller",
          },
        ],
      },
      tiles: [
        {
          label: "Doğum Günü",
          href: href.occ("dogum-gunu"),
          productSlug: "iyi-ki-dogdun-kutu-cicek",
        },
        {
          label: "Sevgiliye",
          href: href.occ("sevgiliye"),
          productSlug: "7-kirmizi-gul-buketi",
        },
        {
          label: "Yıl Dönümü",
          href: href.occ("yil-donumu"),
          productSlug: "101-kirmizi-gul",
        },
        {
          label: "Geçmiş Olsun",
          href: href.occ("gecmis-olsun"),
          productSlug: "baris-cicegi-spathiphyllum",
        },
        {
          label: "Yeni Doğan",
          href: href.occ("yeni-dogan"),
          productSlug: "hos-geldin-bebek-pembe-aranjman",
        },
        {
          label: "Söz & Nişan",
          href: href.occ("soz-nisan"),
          productSlug: "beyaz-gul-ve-cipso-buketi",
        },
        {
          label: "Tebrik & Terfi",
          href: href.occ("tebrik-terfi"),
          productSlug: "ikili-beyaz-orkide-ferforje",
        },
        {
          label: "Açılış & Tören",
          href: href.occ("acilis-toren"),
          productSlug: "acilis-celengi-ferforje",
        },
        {
          label: "Teşekkür",
          href: href.occ("tesekkur"),
          productSlug: "kahve-ve-cicek-seti",
        },
        {
          label: "Özür Dilerim",
          href: href.occ("ozur-dilerim"),
          productSlug: "pastel-sakayik-buketi",
        },
        {
          label: "İçimden Geldi",
          href: href.occ("icimden-geldi"),
          productSlug: "papatya-sevgisi-buketi",
        },
      ],
      rows: [
        {
          size: 3,
          banners: [
            {
              title: "Başsağlığı",
              badge: "Cenaze ve taziye",
              href: href.occ("bassagligi"),
              productSlug: "ayakli-cenaze-celengi",
            },
            {
              title: "Açılış & Tören",
              badge: "Ayaklı çelenk",
              href: href.occ("acilis-toren"),
              productSlug: "acilis-celengi-ferforje",
            },
            {
              title: "Teşekkür",
              badge: "Küçük bir jest",
              href: href.occ("tesekkur"),
              productSlug: "kurumsal-tebrik-seti",
            },
          ],
        },
        {
          size: 2,
          banners: [
            {
              title: "Yeni Doğan",
              badge: "Hoş geldin bebek",
              href: href.occ("yeni-dogan"),
              productSlug: "bebek-arabasi-cicek-aranjmani",
            },
            {
              title: "Söz & Nişan",
              badge: "Masadan salona",
              href: href.occ("soz-nisan"),
              productSlug: "beyaz-lisianthus-buketi",
            },
          ],
        },
      ],
    },
  },

  {
    slug: "hediye",
    label: "Hediye",
    title: "Hediye",
    tagline: "Çiçeğin yanına giden her şey — balon, pasta, çikolata, set",
    coverProductSlug: "cicek-ve-cikolata-seti",
    where: {
      OR: [
        { isAddOn: true },
        {
          category: {
            slug: { in: ["hediye-setleri", "dogum-gunu", "yeni-bebek"] },
          },
        },
      ],
    },
    showcase: {
      lead: {
        size: 2,
        banners: [
          {
            title: "Hediye Setleri",
            badge: "Hazır paket",
            href: href.cat("hediye-setleri"),
            productSlug: "cicek-ve-cikolata-seti",
          },
          {
            title: "Çiçeğin Yanına Giden",
            badge: "Balon · pasta · çikolata",
            href: href.col("hediye"),
            productSlug: "kahve-ve-cicek-seti",
          },
        ],
      },
      tiles: [
        {
          label: "Hediye Setleri",
          href: href.cat("hediye-setleri"),
          productSlug: "gul-buketi-ve-lokum-seti",
        },
        {
          label: "Doğum Günü",
          href: href.cat("dogum-gunu"),
          productSlug: "iyi-ki-dogdun-kutu-cicek",
        },
        {
          label: "Yeni Bebek",
          href: href.cat("yeni-bebek"),
          productSlug: "hos-geldin-bebek-pembe-aranjman",
        },
        {
          label: "Çikolatalar",
          href: href.col("cikolata"),
          productSlug: "cicek-ve-cikolata-seti",
        },
        {
          label: "Pastalar",
          href: href.col("pasta"),
          productSlug: "pastali-cicek-seti",
        },
        {
          label: "Balonlar",
          href: href.col("balon"),
          productSlug: "dogum-gunu-balonlu-buket",
        },
        {
          label: "Teraryum Hediyesi",
          href: href.cat("teraryum"),
          productSlug: "uclu-sukulent-seti",
        },
        {
          label: "Kutuda Çiçek",
          href: href.cat("kutuda-cicek"),
          productSlug: "kutuda-pastel-aranjman",
        },
        {
          label: "Kurumsal Hediye",
          href: href.ara("kurumsal"),
          productSlug: "kurumsal-tebrik-seti",
        },
        {
          label: "Sevgiliye Hediye",
          href: href.occ("sevgiliye"),
          productSlug: "sevgiliye-ozel-kutu-set",
        },
        {
          label: "Premium Hediyeler",
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
              badge: "Butik kutular",
              href: href.col("cikolata"),
              productSlug: "cicek-ve-cikolata-seti",
            },
            {
              title: "Pastalar",
              badge: "Aynı gün penceresi",
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
              title: "Kurumsal Gönderim",
              badge: "Şirket adına",
              href: href.ara("kurumsal"),
              productSlug: "kurumsal-tebrik-seti",
            },
            {
              title: "İçimden Geldi",
              badge: "Sebep gerekmez",
              href: href.occ("icimden-geldi"),
              productSlug: "kahve-ve-cicek-seti",
            },
          ],
        },
      ],
    },
  },

  {
    slug: "kisiye-ozel",
    label: "Kişiye Özel",
    title: "Kişiye Özel",
    tagline: "Tek kişiye kurulmuş aranjmanlar ve setler",
    coverProductSlug: "33-gulden-kalp-aranjman",
    where: { slug: { in: PERSONAL_SLUGS } },
    showcase: {
      lead: {
        size: 2,
        banners: [
          {
            title: "Kalp Aranjmanlar",
            badge: "Form olarak kalp",
            href: href.ara("kalp"),
            productSlug: "33-gulden-kalp-aranjman",
          },
          {
            title: "Sevgiliye Özel Kutu Set",
            badge: "Tek kişiye kurulmuş",
            href: href.ara("Sevgiliye Özel"),
            productSlug: "sevgiliye-ozel-kutu-set",
          },
        ],
      },
      tiles: [
        {
          label: "Kalp Aranjman",
          href: href.ara("kalp"),
          productSlug: "33-gulden-kalp-aranjman",
        },
        {
          label: "Kalp Kutu",
          href: href.ara("kalp kutu"),
          productSlug: "kalp-kutuda-kirmizi-guller",
        },
        {
          label: "Tek Dal Gül",
          href: href.ara("tek dal"),
          productSlug: "tek-dal-kirmizi-gul",
        },
        {
          label: "Işıklı Aranjman",
          href: href.ara("ışıklı"),
          productSlug: "isikli-dogum-gunu-aranjmani",
        },
        {
          label: "Balonlu Buket",
          href: href.ara("balonlu"),
          productSlug: "dogum-gunu-balonlu-buket",
        },
        {
          label: "İyi ki Doğdun",
          href: href.ara("İyi ki"),
          productSlug: "iyi-ki-dogdun-kutu-cicek",
        },
        {
          label: "Anne & Bebek",
          href: href.ara("anne ve bebek"),
          productSlug: "anne-ve-bebek-hediye-seti",
        },
        {
          label: "Kurumsal Set",
          href: href.ara("kurumsal"),
          productSlug: "kurumsal-tebrik-seti",
        },
        {
          label: "Seramik Saksıda",
          href: href.ara("seramik"),
          productSlug: "pembe-orkide-seramik-saksida",
        },
        {
          label: "Pastalı Set",
          href: href.ara("pastalı"),
          productSlug: "pastali-cicek-seti",
        },
        {
          label: "Gül & Lokum",
          href: href.ara("lokum"),
          productSlug: "gul-buketi-ve-lokum-seti",
        },
      ],
      rows: [
        {
          size: 3,
          banners: [
            {
              title: "Sevgiliye",
              badge: "Gönderim amacı",
              href: href.occ("sevgiliye"),
              productSlug: "kalp-kutuda-kirmizi-guller",
            },
            {
              title: "Yıl Dönümü",
              badge: "Seneyi kutla",
              href: href.occ("yil-donumu"),
              productSlug: "101-kirmizi-gul",
            },
            {
              title: "Söz & Nişan",
              badge: "Masadan salona",
              href: href.occ("soz-nisan"),
              productSlug: "beyaz-gul-ve-cipso-buketi",
            },
          ],
        },
        {
          size: 2,
          banners: [
            {
              title: "Doğum Günü Sürprizi",
              badge: "Balonuyla, pastasıyla",
              href: href.occ("dogum-gunu"),
              productSlug: "isikli-dogum-gunu-aranjmani",
            },
            {
              title: "İçimden Geldi",
              badge: "Sebep gerekmez",
              href: href.occ("icimden-geldi"),
              productSlug: "tek-dal-kirmizi-gul",
            },
          ],
        },
      ],
    },
  },

  {
    slug: "el-yapimi",
    label: "El Yapımı",
    title: "El Yapımı",
    tagline: "Camda, seramikte, ferforjede elde kurulan işler",
    coverProductSlug: "cam-fanusta-sukulent-teraryum",
    where: {
      OR: [{ category: { slug: "teraryum" } }, { slug: { in: HANDMADE_SLUGS } }],
    },
    showcase: {
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
            title: "Ferforje İşler",
            badge: "Dövme demir ayak",
            href: href.ara("ferforje"),
            productSlug: "ikili-beyaz-orkide-ferforje",
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
          label: "Seramik Saksıda",
          href: href.ara("seramik"),
          productSlug: "pembe-orkide-seramik-saksida",
        },
        {
          label: "Kraft Kutu",
          href: href.ara("kraft"),
          productSlug: "kraft-kutuda-papatya-ve-gul",
        },
        {
          label: "Ferforje Aranjman",
          href: href.ara("ferforje"),
          productSlug: "beyaz-orkide-ferforje",
        },
        {
          label: "Karma Çelenk",
          href: href.ara("karma"),
          productSlug: "karma-cicek-celenk",
        },
        {
          label: "Tüm Teraryumlar",
          href: href.cat("teraryum"),
          productSlug: "askili-cam-teraryum",
        },
        {
          label: "Saksı Çiçekleri",
          href: href.cat("saksi-cicekleri"),
          productSlug: "monstera-deliciosa",
        },
      ],
      rows: [
        {
          size: 3,
          banners: [
            {
              title: "Sukulent & Kaktüs",
              badge: "Suyu unutulanlara",
              href: href.ara("sukulent"),
              productSlug: "uclu-sukulent-seti",
            },
            {
              title: "Cam İşleri",
              badge: "Geometrik ve askılı",
              href: href.ara("geometrik"),
              productSlug: "geometrik-cam-teraryum",
            },
            {
              title: "Seramik Saksılar",
              badge: "Elde sırlanmış",
              href: href.ara("seramik"),
              productSlug: "pembe-orkide-seramik-saksida",
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
              productSlug: "mini-kaktus-teraryumu",
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
  },
];

export const findLanding = (slug: string): Landing | null =>
  LANDINGS.find((landing) => landing.slug === slug) ?? null;
