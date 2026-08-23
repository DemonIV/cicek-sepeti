import Link from "next/link";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/site/ProductCard";
import { ProductImage } from "@/components/ui/ProductImage";
import { GiftNoteCard } from "@/components/ui/GiftNote";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPrice, formatPriceShort } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/pricing";
import { activeDiscountWhere, priceInfo } from "@/lib/discount";
import { areaFilter, getSelectedArea, areaLabel } from "@/lib/delivery-area";
import { sameDayAvailable } from "@/lib/delivery-time";
import { DiscountCountdown } from "@/components/site/DiscountCountdown";

/**
 * Vitrin üçlemesi **elle seçilir.** Sıralamanın getirdiği ilk üç ürün
 * kullanıldığında en büyük kemerde bir saksı bitkisi durabiliyordu; oysa
 * sayfanın ilk gördüğü yer burası. Ortadaki kemer en yüksek olan.
 * Ürün yayından kalkarsa öne çıkanlardan tamamlanır.
 */
const HERO_SLUGS = {
  left: "pastel-sakayik-buketi",
  center: "51-kirmizi-gul-aranjmani",
  right: "somon-gul-ve-okaliptus-buketi",
} as const;

/** Kampanya bandının fotoğrafı — o da elle seçilir. */
const CAMPAIGN_SLUG = "kalp-kutuda-kirmizi-guller";

export default async function HomePage() {
  const now = new Date();
  const sameDayOpen = sameDayAvailable(now);
  // Bölge seçiliyse vitrin de daralır: gösterilen her ürün oraya gönderilebilir
  // (madde 12). Seçim yoksa filtre boş nesnedir, katalog daralmaz.
  const [area, byArea] = await Promise.all([getSelectedArea(), areaFilter()]);
  const sellable = {
    isActive: true,
    isAddOn: false,
    seller: { status: "APPROVED" as const },
    ...byArea,
  };

  const [
    featured,
    heroPicks,
    categories,
    occasions,
    sellers,
    productCount,
    cityCount,
    weeklyPick,
    discounted,
  ] = await Promise.all([
    // Önce öne çıkanlar, sonra en çok değerlendirilenler. Vitrinde işaretli ürün
    // 12'den azsa boşluk kalmasın diye popülerlerle tamamlanır — 12, ızgaranın
    // 2/3/4/6 sütunlu hâllerinde tam satırla kapanır.
    db.product.findMany({
      where: sellable,
      include: { seller: true },
      orderBy: [
        { isFeatured: "desc" },
        { reviewCount: "desc" },
        { createdAt: "desc" },
      ],
      take: 12,
    }),
    db.product.findMany({
      where: {
        slug: { in: [...Object.values(HERO_SLUGS), CAMPAIGN_SLUG] },
        isActive: true,
        seller: { status: "APPROVED" },
      },
      include: { seller: true },
    }),
    db.category.findMany({
      where: { isHidden: false },
      orderBy: { sortOrder: "asc" },
    }),
    db.occasion.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { products: { where: { product: sellable } } } },
      },
    }),
    db.seller.findMany({
      where: { status: "APPROVED" },
      orderBy: { rating: "desc" },
    }),
    db.product.count({ where: sellable }),
    db.seller.findMany({
      where: { status: "APPROVED" },
      select: { city: true },
      distinct: ["city"],
    }),
    // Haftanın ürünü ve indirimdekiler (madde 24).
    db.product.findFirst({
      where: { ...sellable, isWeeklyPick: true },
      include: { seller: true, category: true },
    }),
    db.product.findMany({
      where: { ...sellable, ...activeDiscountWhere(now) },
      include: { seller: true },
      orderBy: { discountEndsAt: "asc" },
      take: 6,
    }),
  ]);

  // Vitrin üçlemesi: ortadaki kemer yüksek, yandakiler ona eşlik eder.
  const heroBySlug = new Map(
    heroPicks.map((product) => [product.slug, product]),
  );
  const spare = featured.filter((product) => !heroBySlug.has(product.slug));
  const pickHero = (slug: string, fallbackIndex: number) =>
    heroBySlug.get(slug) ?? spare[fallbackIndex];

  // İndirimli fiyat liste fiyatından küçük değilse (veri hatası) satırda
  // indirimsiz bir kart görünmesin.
  const liveDiscounts = discounted.filter(
    (product) => priceInfo(product, now).isDiscounted,
  );

  const center = pickHero(HERO_SLUGS.center, 0);
  const left = pickHero(HERO_SLUGS.left, 1);
  const right = pickHero(HERO_SLUGS.right, 2);
  const campaign = pickHero(CAMPAIGN_SLUG, 3);

  return (
    <>
      {/* --------------------------- Teslimat bölgesi ---------------------------- */}
      {/* Seçim yapılmışsa katalog daralmıştır; bunu gizlemek yerine söyleriz. */}
      <section className="border-b border-line bg-bloom-50/60">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-[12.5px] sm:px-6">
          <Icon name="pin" size={14} className="text-bloom-600" />
          {area ? (
            <>
              <span className="font-semibold text-plum-950">
                {areaLabel(area)}
              </span>
              <span className="text-muted">
                bölgesine gönderilebilen {productCount} ürün listeleniyor.
              </span>
            </>
          ) : (
            <span className="text-muted">
              Her ürün her mahalleye gönderilemez — çiçek en yakın çiçekçiden
              çıkar.
            </span>
          )}
          <Link
            href="/teslimat-bolgesi"
            className="link-underline font-semibold text-bloom-700"
          >
            {area ? "Bölgeyi değiştir" : "Teslimat bölgesini seç"}
          </Link>
        </div>
      </section>

      {/* ------------------------- Hero — telefon (afiş) -------------------------- */}
      {/* Telefonda ilk ekran ürünü göstermeli: uzun başlık yerine tek kampanya
          afişi, hemen altında kategoriler ve ürün ızgarası gelir. */}
      {center && (
        <section className="bg-surface pb-4 md:hidden">
          <div className="px-4 pt-4">
            <Link
              href="/urunler"
              className="relative block h-[15.5rem] overflow-hidden rounded-[var(--radius-banner)] border border-line bg-plum-100 shadow-[var(--shadow-lift)]"
            >
              <ProductImage
                src={center.imageUrl}
                alt=""
                priority
                sizes="100vw"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-plum-950/90 via-plum-950/40 to-plum-950/5" />
              <span className="absolute inset-x-0 bottom-0 block p-5">
                <span className="block font-mono text-[9.5px] uppercase tracking-[0.2em] text-bloom-200">
                  {sellers.length} çiçekçi · aynı gün teslimat
                </span>
                <h1 className="mt-2 text-[1.85rem] font-medium leading-[1.02] text-white">
                  Çiçeğin yolu{" "}
                  <span className="text-bloom-200">kısa</span> olsun.
                </h1>
                <span className="btn btn-primary btn-sm mt-4">
                  Çiçekleri keşfet
                  <Icon name="arrow-right" size={15} />
                </span>
              </span>
            </Link>
          </div>

          <dl className="mt-4 grid grid-cols-3 divide-x divide-line border-y border-line bg-plum-50/60 text-center">
            <MiniStat value={String(productCount)} label="ürün" />
            <MiniStat value={String(sellers.length)} label="çiçekçi" />
            <MiniStat value="4 saat" label="teslimat" />
          </dl>
        </section>
      )}

      {/* ------------------------ Hero — masaüstü (vitrin) ------------------------ */}
      <section className="hidden border-b border-line bg-surface md:block">
        <div className="mx-auto max-w-[1440px] px-4 pt-10 sm:px-6 lg:pt-14">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow animate-rise">
              {sellers.length} çiçekçi · {cityCount.length} şehir · aynı gün
              teslimat
            </p>

            <h1 className="animate-rise mt-5 text-[clamp(2.4rem,6vw,4.2rem)] font-medium leading-[0.95] tracking-[-0.03em] [animation-delay:60ms]">
              Çiçeğin yolu
              <br />
              <span className="text-bloom-700">kısa</span> olsun.
            </h1>

            <p className="animate-rise mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-muted [animation-delay:120ms]">
              Siparişin, alıcıya en yakın çiçekçiye düşer. Sabah tezgâhta
              hazırlanır, akşam olmadan kapıda olur. Arada depo yok, bekleme
              yok.
            </p>

            <div className="animate-rise mt-7 flex flex-wrap items-center justify-center gap-3 [animation-delay:180ms]">
              <Link href="/urunler" className="btn btn-primary btn-lg">
                Çiçekleri keşfet
                <Icon name="arrow-right" size={16} />
              </Link>
              <Link
                href="/kategori/kutuda-cicek"
                className="btn btn-outline btn-lg"
              >
                Kutuda çiçek
              </Link>
            </div>
          </div>

          {/* Vitrin: üç kemer, ortadaki yüksek */}
          {center && (
            <div className="relative mt-10 lg:mt-12">
              <div className="flex items-end justify-center gap-3 sm:gap-4">
                {left && (
                  <ArchFrame
                    product={left}
                    className="animate-arch hidden h-[16rem] w-[11rem] sm:block lg:h-[18.5rem] lg:w-[13rem]"
                    sizes="208px"
                  />
                )}

                <ArchFrame
                  product={center}
                  priority
                  className="animate-arch h-[21rem] w-[15rem] [animation-delay:100ms] sm:h-[23rem] sm:w-[16rem] lg:h-[26rem] lg:w-[19rem]"
                  sizes="(max-width: 640px) 80vw, 304px"
                />

                {right && (
                  <ArchFrame
                    product={right}
                    className="animate-arch hidden h-[16rem] w-[11rem] [animation-delay:200ms] sm:block lg:h-[18.5rem] lg:w-[13rem]"
                    sizes="208px"
                  />
                )}
              </div>

              {/* İmza öğesi: hediye notu, dört rolde de aynı kart olarak görünür */}
              <div className="animate-rise mx-auto -mt-8 w-[min(20rem,88%)] [animation-delay:320ms] lg:absolute lg:bottom-4 lg:right-[5%] lg:mt-0">
                <GiftNoteCard
                  text="İyi ki varsın. Nice mutlu senelere, sevgiyle."
                  from="Zeynep'ten"
                />
              </div>
            </div>
          )}

          <dl className="mx-auto mt-10 flex max-w-2xl flex-wrap items-start justify-center gap-x-14 gap-y-6 border-t border-line py-7 text-center">
            <Stat value={String(productCount)} label="ürün" />
            <Stat value={String(sellers.length)} label="onaylı çiçekçi" />
            <Stat value="4 saat" label="ortalama teslimat" />
          </dl>
        </div>
      </section>

      {/* ------------------------------ Gönderim amacı ---------------------------- */}
      {/* Kategori "ne", amaç "niçin". Müşteri çoğu zaman ikincisiyle geliyor:
          doğum günü, geçmiş olsun, tebrik. */}
      <section className="mx-auto max-w-[1440px] px-4 pt-10 sm:px-6 md:pt-16">
        <SectionHead
          title="Ne için gönderiyorsun?"
          action={{ href: "/urunler", label: "Tüm ürünler" }}
        />

        <div className="scroll-row mt-6 gap-5 sm:gap-7">
          {occasions
            .filter((occasion) => occasion._count.products > 0)
            .map((occasion) => (
              <Link
                key={occasion.id}
                href={`/urunler?amac=${occasion.slug}`}
                className="group w-[5.5rem] shrink-0 text-center sm:w-[6.5rem]"
              >
                <div className="relative mx-auto size-[5.5rem] overflow-hidden rounded-full border border-line bg-plum-100 transition-[transform,box-shadow] duration-300 group-hover:-translate-y-1 group-hover:shadow-[var(--shadow-lift)] sm:size-[6.5rem]">
                  <ProductImage
                    src={occasion.imageUrl}
                    alt={occasion.name}
                    sizes="104px"
                    className="transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <p className="mt-2.5 text-[12.5px] font-semibold leading-snug text-plum-950 transition-colors group-hover:text-bloom-700">
                  {occasion.name}
                </p>
              </Link>
            ))}
        </div>
      </section>

      {/* -------------------------------- Kategoriler ----------------------------- */}
      <section className="mx-auto max-w-[1440px] px-4 pt-10 sm:px-6 md:pt-20">
        <SectionHead
          title="Ne göndermek istersin?"
          action={{ href: "/urunler", label: "Tümünü gör" }}
        />

        {/* Taşan şerit yerine ortalı ızgara: on kategorinin hepsi tek bakışta görünür */}
        <div className="mx-auto mt-6 grid max-w-5xl grid-cols-3 gap-x-3 gap-y-5 sm:mt-8 sm:grid-cols-5 sm:gap-x-4 sm:gap-y-7">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/kategori/${category.slug}`}
              className="group text-center"
            >
              <div className="arch relative h-[7rem] w-full border border-line bg-plum-100 shadow-[var(--shadow-card)] transition-[transform,box-shadow] duration-300 group-hover:-translate-y-1 group-hover:shadow-[var(--shadow-lift)] sm:h-[11.5rem]">
                <ProductImage
                  src={category.imageUrl ?? ""}
                  alt={category.name}
                  sizes="(max-width: 640px) 30vw, 200px"
                  className="transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <p className="mt-3 text-[13px] font-semibold text-plum-950 transition-colors group-hover:text-bloom-700">
                {category.name}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ------------------------------ Haftanın ürünü ---------------------------- */}
      {/* Vitrinin ortasındaki tek ürün: operasyon ekibi haftada bir işaretler,
          fiyatı indirimliyse geri sayımıyla birlikte görünür (madde 24). */}
      {weeklyPick &&
        (() => {
          const price = priceInfo(weeklyPick, now);
          return (
            <section className="mx-auto max-w-[1440px] px-4 pt-10 sm:px-6 md:pt-20">
              <div className="overflow-hidden rounded-[var(--radius-banner)] border border-line bg-surface shadow-[var(--shadow-card)] md:grid md:grid-cols-[1fr_1.1fr]">
                <Link
                  href={`/urun/${weeklyPick.slug}`}
                  className="group relative block aspect-square bg-plum-100 md:aspect-auto md:min-h-[24rem]"
                >
                  <ProductImage
                    src={weeklyPick.imageUrl}
                    alt={weeklyPick.name}
                    sizes="(max-width: 768px) 100vw, 45vw"
                    className="transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </Link>

                <div className="flex flex-col justify-center gap-4 px-6 py-8 sm:px-10 md:py-12">
                  <p className="eyebrow text-bloom-700">Haftanın ürünü</p>
                  <h2 className="text-[clamp(1.5rem,3vw,2.1rem)] leading-tight">
                    {weeklyPick.name}
                  </h2>
                  <p className="max-w-md text-sm leading-relaxed text-muted">
                    {weeklyPick.description}
                  </p>

                  <p className="flex flex-wrap items-baseline gap-3">
                    <span className="tabular font-display text-[1.9rem] font-semibold leading-none text-bloom-700">
                      {formatPrice(price.price)}
                    </span>
                    {price.isDiscounted && (
                      <>
                        <span className="tabular text-[15px] text-faint line-through">
                          {formatPrice(price.listPrice)}
                        </span>
                        <span className="badge tone-bloom">
                          %{price.percent} indirim
                        </span>
                      </>
                    )}
                  </p>

                  {price.isDiscounted && price.endsAt && (
                    <p className="flex items-center gap-2 text-[13px] text-muted">
                      <Icon name="clock" size={14} className="text-bloom-600" />
                      İndirimin bitmesine
                      <DiscountCountdown
                        endsAt={price.endsAt.toISOString()}
                        className="font-semibold text-plum-950"
                      />
                    </p>
                  )}

                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    <Link
                      href={`/urun/${weeklyPick.slug}`}
                      className="btn btn-primary btn-lg"
                    >
                      Ürünü incele
                      <Icon name="arrow-right" size={16} />
                    </Link>
                    <span className="text-[12.5px] text-muted">
                      {weeklyPick.seller.storeName} · {weeklyPick.seller.city}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          );
        })()}

      {/* ------------------------------ İndirimdekiler ---------------------------- */}
      {liveDiscounts.length > 0 && (
        <section className="mx-auto max-w-[1440px] px-4 pt-10 sm:px-6 md:pt-20">
          <SectionHead
            title="İndirimdekiler"
            description="İndirim süresi dolduğunda fiyat kendiliğinden liste fiyatına döner."
            action={{ href: "/urunler?koleksiyon=indirim", label: "Tüm indirimler" }}
          />
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:mt-8 md:grid-cols-4 lg:grid-cols-6">
            {liveDiscounts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                sameDay={sameDayOpen}
              />
            ))}
          </div>
        </section>
      )}

      {/* --------------------------------- Kampanya ------------------------------- */}
      {/* Uydurma indirim yok: kampanya, platformun gerçek kuralını duyurur —
          eşiğin üstünde teslimat ücretsiz. Rakam `pricing.ts`'ten gelir, iki
          yerde ayrı yazılmaz. */}
      {campaign && (
        <section className="mx-auto max-w-[1440px] px-4 pt-10 sm:px-6 md:pt-20">
          <div className="overflow-hidden rounded-[var(--radius-banner)] border border-line bg-plum-950 md:grid md:grid-cols-[1.05fr_1fr]">
            <div className="relative h-56 md:h-auto md:min-h-[21rem]">
              <ProductImage
                src={campaign.imageUrl}
                alt=""
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-plum-950/70 to-transparent md:bg-gradient-to-r md:from-transparent md:to-plum-950/60" />
            </div>

            <div className="px-6 py-8 sm:px-10 md:flex md:flex-col md:justify-center md:py-12">
              <p className="eyebrow text-bloom-300">Kampanya</p>
              <h2 className="mt-4 text-[clamp(1.6rem,3vw,2.4rem)] leading-[1.1] text-white">
                {formatPriceShort(FREE_SHIPPING_THRESHOLD)} üzeri{" "}
                <span className="text-bloom-200">teslimat bizden</span>.
              </h2>
              <p className="mt-4 max-w-sm text-[14.5px] leading-relaxed text-plum-200/80">
                Sepet toplamın eşiği geçtiğinde teslimat ücreti düşer. Çiçek
                yine alıcıya en yakın çiçekçiden çıkar, aynı gün yola koyulur.
              </p>

              <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4">
                <CampaignFact term="Teslimat ücreti" value="₺0" />
                <CampaignFact term="Son sipariş" value="18:00" />
                <CampaignFact term="Hediye notu" value="Ücretsiz" />
              </dl>

              <Link
                href="/urunler"
                className="btn btn-primary btn-lg mt-8 self-start"
              >
                Kampanyalı ürünlere bak
                <Icon name="arrow-right" size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------- Öne çıkanlar ----------------------------- */}
      <section className="mx-auto max-w-[1440px] px-4 pt-10 sm:px-6 md:pt-20">
        <SectionHead
          title="Bu hafta öne çıkanlar"
          description="Çiçekçilerimizin en çok gönderdiği aranjmanlar."
          action={{ href: "/urunler", label: "Tüm ürünler" }}
        />

        {featured.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              title="Henüz öne çıkan ürün yok"
              description="Vitrine ürün eklendiğinde burada listelenir."
              action={{ href: "/urunler", label: "Katalogu aç" }}
            />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:mt-8 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
            {featured.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={index < 6}
              />
            ))}
          </div>
        )}
      </section>

      {/* -------------------------------- Nasıl çalışır --------------------------- */}
      <section className="mx-auto mt-10 max-w-[1440px] px-4 sm:px-6 md:mt-20">
        <div className="rounded-[var(--radius-banner)] bg-plum-950 px-6 py-10 text-center sm:px-10 md:py-14">
          <p className="eyebrow text-plum-300">Sipariş verdikten sonra</p>
          <h2 className="mx-auto mt-4 max-w-lg text-[clamp(1.8rem,3.5vw,2.4rem)] leading-tight text-white">
            Üç adım, üç farklı kişi, tek ekran.
          </h2>

          {/* Numaralar gerçek bir sırayı bildiriyor: sipariş bu üç eli bu sırayla geçer. */}
          <ol className="mx-auto mt-8 grid max-w-4xl gap-7 text-left md:mt-12 md:grid-cols-3 md:gap-10">
            {[
              {
                step: "01",
                title: "Çiçekçi hazırlar",
                text: "Sipariş, alıcının şehrindeki çiçekçinin paneline düşer. Kalemleri hazırlayıp yola çıkarır.",
              },
              {
                step: "02",
                title: "Kurye taşır",
                text: "Operasyon ekibi kuryeyi atar. Kurye adres, alıcı ve hediye notunu telefonundan görür.",
              },
              {
                step: "03",
                title: "Sen izlersin",
                text: "Her adım sipariş takibine anında yansır. Teslim edildiğinde durum çubuğu tamamlanır.",
              },
            ].map((item) => (
              <li key={item.step} className="border-t border-white/15 pt-5">
                <span className="font-mono text-[11px] font-bold tracking-[0.16em] text-bloom-300">
                  {item.step}
                </span>
                <h3 className="mt-3 text-xl text-white">{item.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-plum-200/80">
                  {item.text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* --------------------------------- Satıcılar ------------------------------ */}
      <section className="mx-auto max-w-[1440px] px-4 pt-10 sm:px-6 md:pt-20">
        <SectionHead
          title="Platformdaki çiçekçiler"
          description="Her mağaza kendi ürününü hazırlar, kendi kazancını panelinden takip eder."
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 md:mt-8 xl:grid-cols-4">
          {sellers.map((seller) => (
            <Link
              key={seller.id}
              href={`/magaza/${seller.slug}`}
              className="product-card card overflow-hidden"
            >
              <div className="relative aspect-[16/9] bg-plum-100">
                <ProductImage
                  src={seller.coverUrl ?? ""}
                  alt={seller.storeName}
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                />
              </div>
              <div className="p-4">
                <h3 className="text-[15px] font-semibold text-plum-950">
                  {seller.storeName}
                </h3>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                  <Icon name="pin" size={13} />
                  {seller.district ? `${seller.district}, ` : ""}
                  {seller.city}
                </p>
                <p className="mt-3 line-clamp-2 text-[12.5px] leading-relaxed text-muted">
                  {seller.about}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

/** Vitrin kemeri: fotoğraf, üzerine gelince ürün adı belirir. */
function ArchFrame({
  product,
  className,
  sizes,
  priority = false,
}: {
  product: { slug: string; name: string; imageUrl: string };
  className?: string;
  sizes: string;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/urun/${product.slug}`}
      className={`arch-full group relative flex-none bg-plum-100 shadow-[var(--shadow-arch)] transition-transform duration-500 hover:-translate-y-1.5 ${className ?? ""}`}
    >
      <ProductImage
        src={product.imageUrl}
        alt={product.name}
        priority={priority}
        sizes={sizes}
        className="transition-transform duration-700 group-hover:scale-[1.04]"
      />
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-plum-950/85 to-transparent px-4 pb-4 pt-12 text-center text-[12.5px] font-semibold text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        {product.name}
      </span>
    </Link>
  );
}

/** Kampanya bandındaki rakam — koyu zeminde okunur, süslü değil. */
function CampaignFact({ term, value }: { term: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-plum-300/70">
        {term}
      </dt>
      <dd className="tabular mt-1.5 font-display text-[1.4rem] leading-none text-white">
        {value}
      </dd>
    </div>
  );
}

/** Telefondaki üçlü güven şeridi — afişin hemen altında, tek satır. */
function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-2 py-3">
      <dt className="tabular text-[15px] font-bold leading-none text-plum-950">
        {value}
      </dt>
      <dd className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted">
        {label}
      </dd>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="tabular font-display text-[2.1rem] font-medium leading-none text-plum-950">
        {value}
      </dt>
      <dd className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
        {label}
      </dd>
    </div>
  );
}

function SectionHead({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="rule-head">
        <h2 className="section-title md:whitespace-nowrap">{title}</h2>
      </div>
      {description && (
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
          {description}
        </p>
      )}
      {action && (
        <Link
          href={action.href}
          className="link-underline mt-3 inline-block text-[13px] font-semibold text-bloom-700"
        >
          {action.label} →
        </Link>
      )}
    </div>
  );
}
