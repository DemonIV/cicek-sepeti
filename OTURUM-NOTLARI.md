# Oturum Notları — Çiçek Marketplace Demo

> Bu dosya bir sonraki oturumun kaldığı yerden devam etmesi için yazıldı.
> Proje brief'i `Claude.md`'de, teslim dokümanı `README.md`'de.
> **Son güncelleme:** 28 Temmuz 2026 (ilk yazım: 27 Temmuz 2026)

---

## 1. Projenin durumu: çalışır ve sunuma hazır

Dört rollü (Müşteri · Satıcı · Kurye · Admin) çok satıcılı çiçek pazaryeri
demosu. Next.js App Router + TypeScript + Tailwind + Prisma/SQLite.

```bash
npm install
npx prisma migrate dev
npm run seed
npm run dev          # localhost:3000
```

**Depo:** https://github.com/DemonIV/cicek-sepeti — `main` dalı, 28 Temmuz 2026'da
tek commit olarak yüklendi. `.env` (sadece SQLite yolu) bilerek repoda; `git clone`
sonrası ek ayar gerekmesin diye.

**§9'daki 9 adımlık demo senaryosu 27 Temmuz'da uçtan uca test edildi ve geçti.**
Sipariş verme → satıcı hazırlama → admin kurye atama → kurye teslim → müşteri
takibi → admin panosu döngüsünde kırık ekran veya hata yok.

> ⚠️ **28 Temmuz'daki değişiklikler sonrası senaryo yeniden koşulmadı.** O gün
> yapılanlar görünüm katmanındaydı (kart, ızgara, iskelet, puan, kampanya) ve iş
> mantığına dokunulmadı; `tsc` ve `npm run build` temiz, sayfalar tek tek
> tarayıcıda görüldü. Yine de **sunumdan önce 9 adımı bir kez baştan sona
> tıkla** — özellikle sepet (çapraz satış eklendi) ve ürün detay (düzen değişti)
> adımlarını.

`tsc --noEmit` temiz, `npm run build` tüm rotaları hatasız derliyor.

---

## 2. 28 Temmuz oturumu — ürün ızgarası kareye çevrildi

Kullanıcı: "ürün görselleri tam kare olsun, ciceksepeti.com'daki gibi ve o kadar
ürün sığsın." Uygulandı:

- **`ProductCard` yeniden kuruldu.** Kemerli/kutusuz kart yerine kutulu kart:
  `product-card card`, `aspect-square` görsel, sola dayalı sıkı metin
  (satıcı · şehir → ad → fiyat). Ortalı metin ve `arch` gitti.
- **Tüm ürün fotoğrafları 1:1 oldu** — ürün detayındaki kahraman görsel de
  (`arch-full aspect-[4/5]` → `aspect-square`, en fazla 34rem), sepet, ödeme
  özeti, sipariş detayları, kurye ekranı ve panel tablolarındaki küçük görseller
  (`h-11 w-10` gibi 4:5 kutular → `size-11`), satıcı ürün formu önizlemesi.
- **Izgara merdiveni** (son hâl): `2 / sm:3 / md:4 / lg:5 / 2xl:6`. Katalog
  sayfası 15rem filtre çubuğu taşıdığı için bir kademe geride: `2 / sm:3 / md:4
  / xl:5`. Ölçüldü (390–1920 px): kart 159–230 px, taşma yok.

  > Ara denemede telefon da 5 sütun yapılmıştı (kart 63 px, kuruşsuz fiyat,
  > gizli satıcı satırı). Kullanıcı beğenmedi, mobil 2 sütuna döndü.
  > **Tekrar denemeye değmez.**

- **Telefon çerçevesi 21rem (336 px) → 24.375rem (390 px)** yapıldı;
  `PhonePreview` "390 × 844" yazıyordu ama gerçekte 336 px'ti.
- Ana sayfa öne çıkanlar `take: 8 → 12`; sorgu `isFeatured` filtresinden
  `orderBy: [isFeatured desc, reviewCount desc]`e çevrildi (vitrinde işaretli
  yalnızca 12 ürün var, eksik kalırsa popülerlerle tamamlanır). Ürün detayında
  benzer ürünler `take: 4 → 6`.

### Tasarım cilası — 11 maddelik tur

Tasarım gözden geçirmesi yapıldı (tüm ekranlar 1440 px'te tek tek incelendi),
çıkan liste sırayla uygulandı. **12. madde (seed içeriği: iki pasta fotoğrafı,
ürüne uymayan hediye notları) kullanıcı tarafından kapsam dışı bırakıldı.**

| # | İş | Nerede |
| --- | --- | --- |
| 1 | **Yükleniyor iskeletleri.** Projede hiç `loading.tsx` yoktu (brief §8 istiyor). Ortak `Skeleton.tsx` + 8 rota iskeleti: `(shop)`, `urunler`, `urun/[slug]`, `kategori/[slug]`, `magaza/[slug]`, `admin`, `satici`, `kurye`. `.skeleton` parıltısı `globals.css`'te | yeni dosyalar |
| 2 | **Ürün puanı.** `Product.rating` + `reviewCount` seed'de vardı, hiçbir yerde çizilmiyordu. `Rating.tsx` (dolu yıldız, `gold`), karta ve ürün detayına eklendi. `ProductCardData` tipine iki alan girdi | `ui/Rating.tsx`, `ProductCard`, PDP |
| 3 | **Hero kürasyonu.** `HERO_SLUGS` sabiti; en büyük kemerde saksı bitkisi yerine 51 kırmızı gül. Fallback öne çıkanlardan | `(shop)/page.tsx` |
| 4 | **PDP dengesi.** Üst blok `max-w-[78rem]` içinde ortalandı (kahraman görsel sol kenara yapışıyordu), üç teslimat vaadi çipi eklendi (`DeliveryPromise`) | PDP |
| 5 | **Grafikte sıfır günler.** Çubuk çizilmeyen günlerde soluk kütük + "0" etiketi; bugün sıfırsa grafik bozuk görünüyordu | `OrdersChart` |
| 6 | **Boş kart gerilmesi.** `items-start` — stok uyarısı kartı yanındaki tablonun boyuna uzayıp boş kalıyordu. Aynı düzeltme 5 panel ızgarasına uygulandı | satıcı/admin/kurye |
| 7 | **Sepette çapraz satış.** "Bu siparişe eklenebilir" — sepettekilerle aynı kategoriden 5 ürün; masaüstündeki boşluğu kapatır | `sepet` |
| 8 | **Başlık tipografisi.** `.section-title` tek token; önceden üç ayrı biçim vardı (kategori sayfası 18 px Bodoni semibold okunmuyordu) | `globals.css` + 5 yer |
| 9 | **Panel telefon görünümü.** Sipariş no `whitespace-nowrap` (üç satıra bölünüyordu), `PanelTabNav`'a sağ kenar solması | `PanelNav`, 6 tablo |
| 10 | **Favicon.** `src/app/icon.svg` — patlıcan zeminde kemer + ahududu çiçek. `public/` klasörü yoktu, sekmede jenerik ikon duruyordu | yeni dosya |
| 11 | **Kampanya alanı** (brief §6, masaüstünde eksikti). Fotoğraf + koyu panel; uydurma indirim yok, `FREE_SHIPPING_THRESHOLD` duyuruluyor | `(shop)/page.tsx` |

> **Sahte galeri yapılmadı.** PDP'ye küçük görsel şeridi düşünülmüştü ama her
> ürünün tek fotoğrafı var; aynı kareyi üç kez göstermek çiçekçi müşteriye
> bozuk görünür. Gerçek galeri için `Product`'a çoklu görsel alanı ve seed
> gerekir — istenirse ayrı iş.

### Görsel kalitesi — production ayarları

Kullanıcı "productionda görseller güzel gözüksün" dedi. Yapılanlar:

| Ayar | Yer | Not |
| --- | --- | --- |
| `formats: ["image/avif","image/webp"]` | `next.config.ts` | Aynı kare: AVIF 11 KB, WebP 14 KB, JPEG 15 KB. Doğrulandı (Accept başlığıyla fetch). |
| `quality={88}` | `ProductImage` | Next varsayılanı 75 |
| `imageSizes`'a 200 / 320 | `next.config.ts` | Kart genişlikleri arasında basamak yoktu, optimizer üste yuvarlıyordu |
| `sizes` her çağrıda gerçek kutuya göre | tüm `ProductImage`'lar | Kartta beş kademeli `CARD_SIZES`; küçük görsellerde kutu kaç px ise o (44/56/64/96). Kare kutulara geçince eskiler yanlış kalmıştı. |
| blur placeholder | `ProductImage` | 8×8 SVG'nin base64'ü **sabit** yazıldı — istemci bileşeni, tarayıcıda `Buffer` yok. Tekrar `Buffer.from` yazma. |
| `minimumCacheTTL: 2678400` | `next.config.ts` | 31 gün (varsayılan 60 sn) |
- `.lift` sınıfı ve `.lift .arch` kuralları kaldırıldı (kullanan kalmadı).

**Kemer nerede kaldı:** ana sayfa vitrin üçlemesi (`arch-full`), kategori
karoları (`arch`), başlık kategori şeridi + marka işareti (`arch-sm`), telefon
kampanya afişi. Ürün fotoğrafında artık kemer yok — yeni ekran yazarken bu ayrımı
koru.

`tsc --noEmit` temiz, `npm run build` 29 rotayı hatasız derliyor. Katalog,
kategori, ürün detayı, hesabım ve satıcı ürün tablosu tarayıcıda gözden geçirildi;
mobil önizlemede 2 sütun ve tam kare (133×133) doğrulandı.

---

## 2b. 27 Temmuz oturumunda yapılanlar

### 2.1 Bulunup düzeltilen kusurlar

| # | Dosya | Sorun | Çözüm |
| --- | --- | --- | --- |
| 1 | `src/lib/order-status.ts` | `allowedActions`, siparişin **zaten bulunduğu duruma** geçişi de eylem sayıyordu (`pathTo(x,x)` boş dizi döndürüyor). "Hazırlanıyor"daki siparişte "Hazırlamaya başla" butonu aktif kalıyordu | `target !== current` filtresi eklendi — tek noktadan tüm paneller düzeldi |
| 2 | `src/lib/cart.ts` | Seed sonrası tarayıcıdaki eski sepet çerezi rozette hayalet sayı bırakıyordu (sepet sayfası boş, rozet dolu) | `getCartCount` artık yalnızca hâlâ satışta olan ürünleri sayıyor |
| 3 | `prisma/seed.ts` | Seed `CS-2026-038` üretirken uygulama `CS-2026-0039` üretiyordu — demoda verilen sipariş farklı seride görünüyordu | Seed `nextOrderNo()` ile aynı biçime (`padStart(4,"0")`) hizalandı |
| 4 | `prisma/seed.ts` | Kullanıcı kayıt tarihleri rastgeleydi; seed'in yazdırdığı demo hesabı ile uygulamanın açtığı hesap farklı olabiliyordu, kurye menüsünün sırası tutmuyordu | Müşteri/kurye/satıcı `createdAt` değerleri dizi sırasına göre deterministik yapıldı. Satıcıda `appliedAt` ile `createdAt` artık aynı tarih |
| 5 | `src/components/site/PhonePreview.tsx` + `DemoBar.tsx` | Telefon çerçevesinin **içinde** demo şeridi ve rol değiştirici görünüyordu | Çerçeveye stil enjekte edilip `[data-demo-bar]` gizleniyor. Ekran hazır olana kadar iframe saklanıyor (geçişteki titreme için) |

> ⚠️ 5'te ilk denemem `<html>` üzerine `data-frame` özniteliği koymaktı; bu
> **hydration uyumsuzluğu** üretip dev'de kırmızı "1 issue" rozeti çıkardı.
> Stil enjeksiyonuna çevrildi. Aynı hatayı tekrarlama.

### 2.2 Tasarım yeniden kuruldu — "Vitrin"

Kullanıcı ilk tasarımı beğenmedi ("şablon gibi"). `frontend-design` skill'i
yüklenip yön belirlendi, sonra uygulandı. **Detaylar `README.md` → Tasarım
bölümünde.** Özet:

- **Palet:** pudra pembesi zemin `#fbf0ec`, koyu patlıcan yapı (`plum`),
  doygun ahududu aksan `#c2154b`. `gold` yalnızca kıtlık/puan, `fern` yalnızca
  olumlu durum — ikisi de süs değil işaret.
- **Tipografi:** başlıklarda **Bodoni Moda**, gövdede **Manrope**, veride
  **JetBrains Mono**.
- **İmza form: KEMER.** Üç ölçek — `arch-full`, `arch`, `arch-sm`. Fotoğraf
  taşımayan hiçbir yüzeyde kullanılmaz. (28 Temmuz'da kapsamı daraldı: ürün
  fotoğrafları kare oldu, kemer editoryal yüzeylerde kaldı — bkz. §2.)
- **İkinci imza: hediye notu.** Dört rolde de aynı kart — değiştirme.
- `leaf-*` renk ölçeği **`plum-*` olarak yeniden adlandırıldı** (55 dosya).
  Rozet tonu adı olan `tone="leaf"` (yeşil = olumlu) yerinde kaldı, karıştırma.

### 2.3 Mobil düzen mobil ticaret kalıbına çevrildi

Kullanıcı "telefondan ciceksepeti.com'a girdiğimde gördüğüm gibi olsun" dedi.
**Masaüstü düzenine dokunulmadı**, tüm değişiklik `md` kırılımının altında.

- Yeni: `src/components/site/MobileTabBar.tsx` — altta sabit sekme çubuğu
  (Ana sayfa · Kategoriler · Sepetim · Hesabım), sepet rozetli, `md:hidden`.
  `(shop)/layout.tsx` içinde render ediliyor + `h-[4.25rem]` boşluk bırakıcı.
- Başlık: telefonda marka solda / sepet sağda, **marka satırı ve arama yapışkan**,
  kategori şeridi yukarı kayıyor. Masaüstünde üç sütunlu ortalı düzen aynı.
- Demo şeridi telefonda yapışkan **değil** (iki yapışkan çubuk üst üste binmesin),
  masaüstünde sabit.
- Ana sayfa: telefonda tek **kampanya afişi** + üçlü güven şeridi; masaüstünde
  kemerli vitrin. İki ayrı blok, biri `md:hidden` diğeri `hidden md:block`.
- Katalog: filtreler telefonda katlanır `<details>`, masaüstünde sürekli açık
  kenar çubuğu. (Önceden `<details open>` her ekranda açıktı — ürüne ulaşmak
  için tüm filtreleri geçmek gerekiyordu.)
- `--arch-top` telefonda 7rem → **3.75rem** (küçük kartta tam kubbe ürünün
  yarısını yiyordu).

**Sonuç:** telefonda ana sayfa 7108px → 5916px, yatay taşma yok.

### 2.4 `README.md` yazıldı

Kurulum, demo hesapları, 9 adımlık senaryo, ekran haritası, mimari, **Tasarım**
bölümü (palet/tipografi/kemer + masaüstü-telefon farkı tablosu), verilen
kararlar, kapsam dışı.

---

## 3. Tuzaklar — zaman kaybetme

- **Tarayıcı otomasyonunda koordinatla tıklama güvenilmez.** Tarayıcı %100
  yakınlaştırmada değilse `computer left_click` hedefi ıskalıyor; uygulamada
  kusur yok. Butonları `javascript_tool` ile metninden bulup `.click()` yap.
- **Ekran görüntüsü uzun ve görsel yoğun sayfalarda zaman aşımına uğruyor.**
  Sekmeyi kapatıp yenisini açmak çözüyor.
- **Dev sunucusu açıkken `npm run build` çalıştırma** — ikisi `.next` dizinini
  paylaşıyor, istemci paketi bozuluyor (bir kez "sepete ekle çalışmıyor" gibi
  görünen sahte bir hataya yol açtı). Önce sunucuyu durdur.
- **Görseller Unsplash'ten geliyor, internet gerekir.** Bağlantı yoksa uygulama
  kırılmaz; `ProductImage` yerel çiçek çizimine düşer. Sunumdan önce sayfaları
  bir kez gezip önbelleğe almak iyi olur.
- Kökte üç markdown var ve üçü de gereklidir: `Claude.md` (brief),
  `README.md` (teslim dokümanı), `OTURUM-NOTLARI.md` (bu dosya).

---

## 4. Doğrulanmayan / sıradaki olası işler

Aşağıdakiler **yapılmadı**, istenirse sıradaki oturumda ele alınabilir:

1. **Seed içeriği** (28 Temmuz'da kapsam dışı bırakıldı, istenirse geri gelir):
   Hediye Setleri ve Doğum Günü kategorilerinin ikisinde de pasta fotoğrafı var;
   hediye notları ürüne uymuyor (ZZ bitkisinde "Başın sağ olsun").
2. **Ürün galerisi.** Her üründe tek fotoğraf var; PDP'de küçük görsel şeridi
   için `Product`'a çoklu görsel alanı ve seed gerekir.
3. **Odaklı ödeme başlığı.** Ödeme adımında 210 px'lik başlık (logo + arama +
   kategori şeridi) duruyor; gerçek e-ticarette bu adımda başlık daralır.
4. `RoleGate`, yanlış rolle girilen sayfaya değil panelin köküne yönlendiriyor
   (`/satici/kazanc` → `/satici`). Küçük konu, düzeltilebilir.
5. Ana sayfada başlıktaki kategori şeridi ile "Ne göndermek istersin?" ızgarası
   telefonda aynı 10 kategoriyi arka arkaya gösteriyor. Referans kalıpta da
   böyle ama istenirse biri kaldırılabilir.
6. **Kapanış anı fikri.** Ürün açıklamasında "kurye teslimatında fotoğraf
   gönderilir" yazıyor ama arayüzde yok. Kurye "Teslim edildi" dediğinde takip
   sayfasında teslimat fotoğrafı kartı belirse demo senaryosu gerçek bir finalle
   kapanır. Tasarımdan çok küçük bir özellik.

---

## 5. Demo hesapları (hatırlatma)

Giriş ekranı yok; sağ üstteki **rol değiştirici** ile geçiliyor.

| Rol | Hesap |
| --- | --- |
| Müşteri | Zeynep Aksoy |
| Satıcı | Serkan Yalçın — Gül Bahçesi Çiçekçilik (İstanbul, %12) |
| Kurye | Murat Ilgaz |
| Admin | Nazlı Öztürk |

Seed: 24 kullanıcı, 6 mağaza (2'si onay bekliyor), 10 kategori, 61 ürün,
38 sipariş (`CS-2026-0001` … `CS-2026-0038`). Sabit tohumlu — her kurulumda
aynı veri.

---

## 6. Dokunurken dikkat

- **İş mantığı tek yerde:** `src/lib/order-status.ts` (durum makinesi, rol
  yetkileri, çok satıcılı durum türetme), `src/lib/pricing.ts` (komisyon),
  `src/lib/orders.ts` (sipariş yaşam döngüsü). Ekranlara mantık dağıtma.
- **Sipariş durumu kalemlerden türetilir** — en geride kalan kalem belirler.
  İki satıcılı siparişte biri hazırlamayı bitirse bile sipariş "Hazırlanıyor"
  kalır. Bu kasıtlı, düzeltilecek bir hata değil.
- Tasarım token'ları `src/app/globals.css` içinde. Bileşen sınıflarının API'si
  (`.btn`, `.card`, `.field`, `.badge`, `.data-table`, `.gift-note`) değişmedi;
  değerler değişti. Yeni ekran yazarken bu sınıfları kullan.
