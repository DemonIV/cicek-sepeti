# Oturum Notları — Çiçek Marketplace Demo

> Bu dosya bir sonraki oturumun kaldığı yerden devam etmesi için yazıldı.
> Proje brief'i `Claude.md`'de, teslim dokümanı `README.md`'de.
> **Son güncelleme:** 26 Ağustos 2026 (ilk yazım: 27 Temmuz 2026)

---

## 1. Projenin durumu: çalışır ve sunuma hazır

Dört rollü (Müşteri · Satıcı · Kurye · Admin) çok satıcılı çiçek pazaryeri
demosu. Next.js App Router + TypeScript + Tailwind + Prisma/SQLite.

**Müşteri istekleri `ISTEKLER.md`'de takip ediliyor — yeni bir işe başlamadan
önce oraya bak.** 21 Ağustos'ta 25 maddelik ilk liste uygulandı (§1a);
23 Ağustos'ta yedi madde daha geldi: bayiden ürün başvurusu (§1b), girişte
adres seçimi (§1c), Çiçek Sepeti incelemesinden dört ekleme + iki düzeltme
(§1d). Toplam **33 madde**, hepsi kapalı. 25 Ağustos'ta proje istek listesiyle
karşılaştırıldı; çıkan beş eksik kapatıldı (§1e) — toplam **38 madde**, biri
müşteri kararında.

```bash
npm install
npx prisma migrate dev
npm run seed
npm run dev          # localhost:3000
```

**Depo:** https://github.com/DemonIV/cicek-sepeti — `main` dalı, 28 Temmuz 2026'da
tek commit olarak yüklendi. `.env` (sadece SQLite yolu) bilerek repoda; `git clone`
sonrası ek ayar gerekmesin diye.

**Yayın:** 30 Temmuz'da Render'da canlıya alındı →
https://cicek-marketplace-demo.onrender.com (blueprint `render.yaml`, free plan,
Frankfurt, `main` dalından otomatik deploy). SQLite build sırasında seed edilir,
Render diski geçici — veri her yeniden başlatmada seed hâline döner. Ayrıntılar
ve sunum öncesi yapılacaklar README'nin "Yayına alma" bölümünde. **İlk deneme
502 verdi; sebebi ve çözümü §2a'da — oraya bakmadan görsel ayarlarına
dokunma.**

**README'deki 10 adımlık demo senaryosu 21 Ağustos'ta uçtan uca test edildi ve
geçti** (ayrıntı §1a → "Test edildi"). Bölge seçimi → ürün/galeri/video → ek
ürün → mahalleli ödeme → satıcı hazırlama + fotoğraf → arabaya verildi → admin
kurye atama → kurye teslim → müşteri takibi → admin panosu döngüsünde kırık
ekran veya hata yok.

`tsc --noEmit` temiz, `npm run build` tüm rotaları hatasız derliyor (41 rota).

### Sıradaki oturum için

**Kod tarafında bekleyen iş yok.** 25 Ağustos'un iki turu (§1e inceleme +
navbar/vitrin) 26 Ağustos'ta push edildi — bkz. dosya sonundaki yayın kaydı.
Çalışma ağacı temiz. Müşteriye sunulmuş ama henüz
istenmemiş öneriler `ISTEKLER.md` §I sonundaki "sırada bekleyen öneriler"
listesinde: favoriler ve "X kişinin favorisi", özel gün hatırlatıcı,
kupon/kampanya kodu, kişiye özel (isim yazdırma, kart tasarımı), bölge/tarih
bazlı teslimat ücreti kuralları, kurumsal (B2B) toplu gönderim.

**Müşteriye sorulacak tek şey:** teslimat ücreti 79,90 TL / 1.000 TL üzeri
ücretsiz — bu rakamları biz koyduk, onay ya da farklı bir kural bekliyor.

**Çalışma ortamı tuzağı — okumadan iş yapma:** `next dev` ile `next build`
aynı `.next` klasörünü kullanıyor. Dev sunucusu açıkken build alırsan dev
tarafı `ENOENT: ... .next\serverpp\(shop)\page.js` ya da "Jest worker
encountered child process exceptions" verip çöker. Çözüm: node süreçlerini
kapat → `.next` klasörünü sil → `npm run dev`. Aynı şekilde `prisma generate`
dev açıkken EPERM (DLL kilidi) veriyor; önce dev'i durdur. Bu oturumda iki kez
buna takıldı.

---

## 1a. 21 Ağustos 2026 oturumu — müşteri istek listesi (25 madde)

Müşteri 4 sayfalık bir liste gönderdi; 24'ü uygulandı, 11. maddeyi kendisi
iptal etti ("bu maddeyi es geçelim, yanlış olmuş"), 10. madde süreç notu.
**Tam döküm ve nasıl uygulandığı `ISTEKLER.md`'de.** Burada yalnızca bir
sonraki oturumun bilmesi gerekenler var.

### Şema büyüdü (iki migration)

`20260821155928_genisletilmis_demo` ve `20260821160132_unvan_ve_gizli_kategori`:

| Yeni model | Ne için |
| --- | --- |
| `Neighborhood`, `SellerArea` | Teslimat bölgesi ve bayi ↔ mahalle eşleşmesi (12, 15) |
| `ProductMedia` | Ürün galerisi: 3+ fotoğraf, video (23) |
| `PreparationPhoto` | Hazırlık onay görseli (22) |
| `Invoice` | Bayi faturası (1, 2) |
| `SellerScoreEvent` | Bayi puan hareketleri (17) |
| `AuditLog` | Denetim izi (20) |

Mevcut modellere eklenenler: `Seller.acceptingOrders/pauseReason/score/
dailyQuota/activeQuota/accountManagerId`, `Product.stockClosed/isAddOn/
addOnKind/discountPrice/discountStartsAt/discountEndsAt/isWeeklyPick/videoUrl`,
`Order.deliveryDistrict/neighborhoodId/senderName/reminderCount/lastReminderAt`,
`OrderItem.isAddOn`, `Delivery.dispatchedAt/proofPhotoUrl`, `User.title`,
`Category.isHidden`.

### Yeni iş mantığı dosyaları

`discount.ts` (zamanlı indirim — geçerli fiyatı hesaplayan **tek** yer),
`delivery-area.ts` (bölge çerezi + filtre), `collections.ts` (üst şerit),
`seller-score.ts` (puan + otomatik gecikme taraması), `audit.ts` (denetim izi).
Yeni ekran yazarken fiyatı `priceInfo()`'dan al, `product.price`'ı doğrudan
yazma — indirim aralıktaysa yanlış tutar çıkar.

### Yetki değişimi — dikkat

**Satıcı artık ürün ekleyemez / düzenleyemez / silemez** (madde 4). Ürün CRUD
`actions/seller.ts`'ten `actions/admin.ts`'e taşındı, rotalar
`/satici/urunler/yeni` ve `/satici/urunler/[id]` **silindi**, yerine
`/admin/urunler/yeni` ve `/admin/urunler/[id]` geldi. Satıcının tek yetkisi
`setStockClosed`. Bu kuralı gevşetme — müşterinin açık isteği.

### Demo verisi

7. mağaza olarak **Hediye Deposu** eklendi: yalnızca ek ürün satar, tüm
mahallelere kargolar. Amacı çift: "ek ürün" akışını (madde 6) gerçek bir
mağazaya dayandırmak ve her siparişi doğal olarak çok satıcılı yapmak.
**Ek ürünler siparişin durumunu geciktirmez** — `sellerAdvanceItems` içinde
durum yalnızca `isAddOn: false` kalemlerden türetilir, ek ürünler pakete
eşlik eder. (Bunu değiştirirsen demo senaryosu 6. adımda takılır.)

Bursa ve Antalya bayileri hâlâ onay beklediği için o şehirlerin mahalleleri
bölge seçicide **kapalı** görünür. Bu kasıtlı: admin bayiyi onaylayınca şehir
açılır, sunumda gösterilebilecek bir bağ.

### Videolar yerel

`public/video/*.mp4` — dört ürünün tanıtım videosu. Unsplash karesinden ffmpeg
ile üretilmiş 7 saniyelik yavaş zoom (Ken Burns), toplam ~2,7 MB. Dış CDN
denendi, hepsi 403 verdi; yerel dosya internetsiz de oynar. Yenisini üretmek
istersen: `ffmpeg -loop 1 -i kare.jpg -filter_complex
"scale=2160:2160,zoompan=z='min(zoom+0.00035,1.22)':d=210:s=1080x1080:fps=30,
format=yuv420p" -t 7 -c:v libx264 -crf 26 -movflags +faststart -an cikti.mp4`.

### Tipografi

Başlık yüzü **Bodoni Moda → Outfit**. Bodoni yalnızca hediye notunda kaldı
(`--font-note`). CSS değişkeni adlarına dikkat: next/font değişkenleri
`--font-outfit` ve `--font-bodoni-note`; Tailwind `@theme` içindeki
`--font-display` bunları sarar. next/font'a doğrudan `--font-display` adını
verirsen kendi kendini referanslayıp yazı tipi çöker.

### Yayın kaydı

21 Ağustos akşamı `main`'e push edildi: **`bb79e4b`** (67 dosya, +7.526/−904).
Render `main`'den otomatik deploy ediyor, yayın kendiliğinden tetiklendi.

> ⚠️ Bu commit'in **başlık satırı bozuk**: mesajın başına ve sonuna birer `@`
> karakteri kaçtı (PowerShell here-string sözdizimi yanlışlıkla Bash tarafında
> kullanıldı). Gövde eksiksiz. Kullanıcı "böyle kalsın" dedi — geçmişi yeniden
> yazma, `--force` push atma. Sonraki commit'lerde `-m` için düz tırnak kullan.

### Test edildi

10 adımlık demo senaryosu tarayıcıda uçtan uca koşuldu (sipariş `CS-2026-0039`):
bölge seçimi → indirimli ürün + galeri/video → ek ürün → mahalle seçimli ödeme +
imzalı kart notu → satıcı bugün listesi → hazırlık fotoğrafı yükleme → arabaya
verildi → admin kurye atama → kurye teslim → müşteri takibinde fotoğraf →
admin panosu. Ayrıca fatura yükleme + onaylama, bölge açma/kapatma, stok
kapatma/açma ve denetim izi tek tek denendi. `tsc --noEmit` ve `npm run build`
temiz (37 rota).

---

## 1b. 23 Ağustos 2026 oturumu — bayiden ürün başvurusu

Müşteri sordu: finans/fatura yapıldı mı (yapılmıştı — madde 1 ve 2, §1a) ve
şunu istedi: *"satıcı kendi panelinde kendi mağazasına ürün ekleyebilmeli ama
adminin onayından geçecek."*

### Nasıl çözüldü — madde 4'ü bozmadan

Madde 4 (bayi ürün bilgisini değiştiremez) hâlâ geçerli. Yeni ürün **doğrudan
`Product` olarak yazılmıyor**; bayi bir **başvuru** gönderiyor, ürün ancak
admin onaylayınca oluşuyor. Yani vitrindeki içerik yine tek elden yönetiliyor.

- Yeni model **`ProductRequest`** (migration `20260823094908_urun_basvurusu`):
  ürün alanları + `status` (BEKLIYOR | ONAYLANDI | REDDEDILDI) + `reviewNote`
  (ret sebebi, bayi görür) + `productId` (onaylanınca oluşan ürün).
- Bayi: `/satici/urunler/basvuru` (form) ve `/satici/urunler` altındaki
  **"Başvurularım"** bölümü (durum + ret sebebi + bekleyeni geri çekme).
- Admin: `/admin/urunler/basvurular` — durum sekmeleri, kart başına
  **Onayla ve yayına al** / **Reddet (sebeple)**. Bekleyen sayısı hem yan
  menüde hem `/admin/urunler` üstündeki uyarı bandında görünür.
- Eylemler: `submitProductRequest` / `withdrawProductRequest`
  (`actions/seller.ts`), `reviewProductRequest` (`actions/admin.ts`).
  Onay, ürünü ve galerisini admin ürün akışıyla **aynı** `writeGallery`
  yardımcısından geçirir — iki ayrı ürün oluşturma yolu yok.
- Denetim izine yeni iki eylem: `productRequest.approve/reject`
  (`src/lib/audit.ts` içindeki birlik tipine eklendi — yeni bir eylem
  eklerken orayı güncellemeyi unutma, `tsc` yakalar).
- Seed'de 4 başvuru (`PRODUCT_REQUESTS`, `seed-extra.ts`): 2 bekleyen,
  1 onaylanmış (ürünü de oluşturulur), 1 sebebiyle reddedilmiş — üç durum da
  ekranda dolu görünsün diye.

### Yayın kaydı

23 Ağustos'ta `main`'e push edildi: **`a3d2880`** (18 dosya, +1.339/−29).
Aynı push'la bir önceki oturumdan bekleyen `865dcf7` de gitti. Render
`main`'den otomatik deploy ediyor.

### Test edildi

Tarayıcıda uçtan uca: bayi "Beyaz Lale Buketi" başvurusu gönderdi → admin
onayladı → ürün vitrinde (`/urun/beyaz-lale-buketi` 200) ve bayinin ürün
listesinde "Satışta" göründü → başka bir başvuru sebeple reddedildi, sebep
bayi panelinde çıktı → denetim izine `Nazlı Öztürk` adıyla yazıldı. Sonra
`npm run seed` ile veri demo hâline döndürüldü. `tsc --noEmit` ve
`npm run build` temiz (39 rota).

---

## 1c. 23 Ağustos 2026 — girişte adres seçimi penceresi

Müşteri bir ekran görseli gönderdi ("Siparişin Nereye Gönderilecek?") ve şunu
istedi: *"kişi ürünlere bakmak istediğinde göndereceği veya bulunduğu konumdaki
çiçekleri görsün, o yüzden adres isteyeceğiz."*

- Yeni model **`Landmark`** (migration `20260823104450_adres_noktalari`):
  mahalleye bağlı tanınmış nokta (OKUL | HASTANE | PLAZA | AVM | UNIVERSITE |
  OTEL | ISTASYON). Seed'de **67 nokta** (`LANDMARKS`, seed-extra.ts).
  **`Address.neighborhoodId`** eklendi; seed kayıtlı adresleri mahalleye bağlar.
- **`DeliveryAreaDialog`** (`components/site/DeliveryAreaDialog.tsx`): arama +
  kayıtlı adres radyoları. `(shop)/layout.tsx` içinde duruyor, ilk girişte
  kendiliğinden açılır (`shouldAskForArea`), sonra başlıktaki **`AreaTrigger`**
  düğmesi `cicek:adres-sec` window olayıyla açar. Bu olay yöntemi bilinçli:
  başlık sunucu bileşeni, araya context koymamak için.
- Arama `searchAreas()` (`lib/delivery-area.ts`) — mahalle + nokta birlikte,
  açık olanlar önce. Sunucu eylemleri: `searchDeliveryPoints`,
  `chooseDeliveryArea` (yönlendirmez, `router.refresh()` ile yerinde günceller),
  `dismissAreaPrompt`.
- **Seçim zorunlu değil.** "Şimdilik geç" `cicek_demo_bolge_soruldu` çerezini
  yazar, pencere bir daha kendiliğinden açılmaz. Bunu zorunlu hâle getirirsen
  sunumda kapalı kapı riski doğar — önce README'deki notu güncelle.
- Görseldeki yeşil/mavi yerine "Vitrin" paleti kullanıldı; düzen aynı.

Tarayıcıda denendi: giriş penceresi açıldı, "hastane" araması noktaları
mahalleleriyle listeledi (kapalı olan soluk ve seçilemez), *Acıbadem Altunizade
Hastanesi* seçilince başlık "Üsküdar / Altunizade" oldu ve katalog daraldı;
kayıtlı adres yoluyla da bölge değişti. `tsc --noEmit` ve `npm run build` temiz.

---

## 1d. 23 Ağustos 2026 — Çiçek Sepeti incelemesi ve dört ekleme

Müşteri "çiçek sepetini incele, başka ne olabilir" dedi. Gerçek site tarayıcıda
gezildi; çıkan liste `ISTEKLER.md` §I'de. Dördü uygulandı (28–31. maddeler).

### Şema (üç migration)

`20260823114811_gonderim_amaci`, `20260823115931_urun_yorumlari` ve daha önceki
`20260823104450_adres_noktalari`:

| Model | Ne için |
| --- | --- |
| `Occasion`, `ProductOccasion` | Gönderim amacı ekseni (28) |
| `Review` | Ürün yorumları (29) |
| `Landmark`, `Address.neighborhoodId` | Adres penceresi (27, §1c) |

### Dikkat edilecekler

- **Ürün puanı artık türetilmiş veri.** `Product.rating` / `reviewCount`
  alanları duruyor (katalog sıralaması tek tablodan çalışsın diye) ama değerleri
  **görünen** yorumlardan hesaplanıyor. Yorum gizlenince
  `refreshProductRating()` çağrılmalı — `actions/review.ts` bunu yapıyor.
- **Amaç etiketi ürün başına en fazla 4.** Seed'de `perProduct` sayacı bunu
  tutuyor; kaldırırsan bir buket sekiz amaca birden girip filtreyi anlamsızlaştırır.
- **Yorum metinleri kategoriye bağlı** (`REVIEW_TEXTS[].only`). Yeni metin
  eklerken ürün-özel olanlara `only` yazmayı unutma.
- **Aynı gün teslimat kuralı tek yerde:** `src/lib/delivery-time.ts`
  (kesim saati 18.00, gün seçenekleri, saat aralığı kapanması, geri sayım).
  Ürün sayfası, ödeme sayfası, ödeme eylemi ve kartlar aynı fonksiyonları
  çağırıyor — kuralı değiştireceksen orada değiştir.
- **`"use server"` dosyasından sabit export edilemez.** `DELIVERY_PREF_COOKIE`
  bu yüzden `lib/delivery-time.ts` içinde; `actions/delivery.ts` oradan alıyor.
  (Bir kez bu hataya düşüldü, sayfa 500 verdi.)
- **Dev sunucusu açıkken `npm run build` çalıştırma** — ikisi de `.next`
  klasörüne yazıyor, dev sunucusu "Cannot find module './xxxx.js'" verip çöküyor.
  Ayrıca `prisma generate` dev açıkken EPERM veriyor (DLL kilidi): önce durdur.

### Yeni ekranlar

`/satici-ol` (vitrinden bayi başvurusu), `/satici/yorumlar`, `/admin/yorumlar`.
Katalogda "Ne için gönderiliyor?" filtresi, ana sayfada amaç şeridi, ürün
sayfasında teslimat günü/saati seçici ve yorum bölümü.

### Sonradan gelen iki düzeltme (32–33)

- **Adres penceresi artık katalog yollarında her girişte açılıyor.**
  `DeliveryAreaDialog` `usePathname()` ile `/kategori`, `/urunler`, `/magaza`,
  `/urun` yollarını tanıyor; bölge seçili değilse "bir kez sor" çerezine
  bakmadan açılıyor. Bölge seçilince susuyor.
- **Kategori sayfası bölgeye göre daralmıyordu** — gerçek bir eksikti,
  düzeltildi (`areaFilter()` + bölge bandı + bölgeye özel boş durum). Katalog
  ve ana sayfa zaten daralıyordu; kategori atlanmış.
- **Tarih çipleri üçe indi, dördüncü hücre Takvim.** `DAY_OPTION_COUNT = 3`,
  `MAX_ADVANCE_DAYS = 60`. Takvimden seçilen gün `customDate` olarak çiplere
  ekleniyor; o gün `slots` haritasında olmadığı için `allSlots` (hepsi açık)
  kullanılıyor. `input type="date"` görünmez şekilde düğmenin üstünde duruyor,
  `showPicker()` ile açılıyor.

### Yayın kaydı

23 Ağustos'ta `main`'e push edildi: **`fcb261c`** (47 dosya, +3.511/−66) —
27–33. maddelerin tamamı. Render `main`'den otomatik deploy ediyor.

### Test edildi

Tarayıcıda: amaç şeridi → katalog filtresi; ürün sayfasında yorumlar ve satıcı
cevabı; satıcı panelinde "Yorumlarım" (mağaza puanı 4.5, cevap bekleyen 44);
`/satici-ol` formundan gönderilen **Sardunya Çiçek Atölyesi** başvurusu admin
başvuru ekranında göründü; ürün sayfasında "Bugün · 15:00 - 18:00" seçimi ödeme
adımına dolu geldi. Düzeltmelerden sonra: bölge çerezi silinip kategoriye
girildiğinde pencere açıldı, kayıtlı adres seçilince kategori 3 ürüne daraldı;
takvimden **15 Eylül · 12:00 - 15:00** seçildi ve ödeme adımına o tarihle geldi.
`tsc --noEmit` temiz.

---

## 1e. 25 Ağustos 2026 — inceleme turu (istekte olmayanlar)

Kullanıcı: *"projeyi incele, ISTEKLER.md'yi incele, isteklerde olmayan bir şey
var mı."* 33 madde kodda tek tek arandı, `Claude.md` brief'iyle ve rota
grafiğiyle karşılaştırıldı. Altı bulgu çıktı; beşi kapatıldı, biri müşteri
kararına bırakıldı. Tam döküm `ISTEKLER.md` §J'de. Buradakiler bir sonraki
oturumun bilmesi gerekenler.

### Kurye teslim fotoğrafı (bulgu 34) — ölü şema alanı canlandı

`Delivery.proofPhotoUrl` şemada duruyordu ama **hiçbir yerde okunmuyordu**.
Üstelik seed'deki bir ürün açıklaması bunu vaat ediyordu (`seed-data.ts`,
51 kırmızı gül: *"Kurye teslimatında fotoğraf gönderilir"*). Kapatıldı:

- Yeni bileşen `components/panel/ProofPhotoUpload.tsx`, kurye teslimat
  detayında (`/kurye/[orderNo]`). Sipariş YOLDA ya da TESLIM_EDILDI iken —
  veya fotoğraf zaten varsa — görünür.
- Yeni eylemler `uploadDeliveryProof` / `removeDeliveryProof`
  (`actions/courier.ts`), kurye + kendi teslimatı kontrolüyle.
- Müşteri tarafı: `/siparis/[orderNo]` içinde **"Teslim anı"** kartı, kuryenin
  adı ve teslim saatiyle.
- **Migration gerekmedi** — alan zaten şemadaydı.
- Küçültme mantığı `PrepPhotoUpload` içinden çıkarılıp
  **`src/lib/image-shrink.ts`**'e taşındı; iki yükleyici de oradan geçiyor.
  Ölçüyü değiştireceksen orada değiştir.
- Seed: teslim edilmiş siparişlerin %70'inde dolu, ürün karesinin ikinci
  kadrajı kullanılıyor (hazırlık karesi birinciyi kullanıyor — ikisi arka
  arkaya aynı fotoğraf gibi durmasın).

### Kota artık uygulanıyor (bulgu 35)

Madde 19 yarım kalmıştı: admin kotayı ayarlıyor, bayi panosunda çubuk
görünüyordu ama **ödeme adımında hiçbir kontrol yoktu.**

- Yeni dosya **`src/lib/seller-quota.ts`** — sayımın tanımı burada:
  `countDayDeliveries`, `countActiveOrders`, `sellerQuotaUsage`,
  `findQuotaBlocks`. İptal edilmiş siparişler hiçbir sayıma girmez.
- `actions/checkout.ts` mahalle kontrolünün hemen ardından kotaya bakıyor.
- `satici/page.tsx` iki inline `db.order.count()` yerine `sellerQuotaUsage()`
  çağırıyor — **iki yerde iki farklı tanım kalmasın**, yoksa panoda "11/12"
  görünürken sipariş reddedilir.
- İki engelin metni ayrı: gün kotası başka bir günle çözülür, açık sipariş
  kotası çözülmez.
- **Seed kotaları bilerek bol** (25/gün, 12 açık — kullanım 3/25, 6/12
  civarında). Demo'nun ana akışı kapalı kapıya çarpmasın. Kotayı sunumda
  göstermek isteyen admin künyesinden sınırı bugünkü kullanıma indirir;
  README'de "Gösterilebilecek diğer akışlar" altında yazıyor. **Seed kotalarını
  daraltma.**

### Admin unvanları (bulgu 36)

`admin/layout.tsx` başlığı `${user.name} · Operasyon` diye sabitti; üç adminde
de "Operasyon" yazıyordu. `DemoBar` de rol değiştiricide üçüne "Platform
yönetimi" diyordu. İkisi de `User.title` okuyor artık.

### Hediye notları ürüne bağlandı (bulgu 37)

`GIFT_NOTES` düz metin dizisiydi ve seed rastgele seçiyordu — "Başın sağ olsun"
notu doğum günü balonuna düşebiliyordu. Artık her not `fits: string[]`
(kategori slug'ları) taşıyor; not, siparişin **ana kaleminin** (ek ürün değil)
kategorisine göre seçiliyor, uyan yoksa sipariş notsuz kalıyor. Yeni not
eklerken `fits` yazmayı unutma — boş bırakırsan o not hiçbir yerde çıkmaz.

### Doküman düzeltmeleri (bulgu 38, 39)

- "Benzer ürün şeridi" bekleyen öneri listesindeydi ama **zaten vardı**
  (PDP altındaki "… kategorisinden" altılı şerit). Listeden çıkarıldı.
- Teslimat ücreti (79,90 TL / 1.000 TL) müşteri onayı olmadan konmuştu ve aynı
  konu bekleyen öneri listesinde "yapılmamış" gibi duruyordu. Kural yerinde
  bırakıldı, her iki dokümanda **varsayım** olduğu yazıldı. **Müşteriye
  sorulacak.**

### Test edildi

Tarayıcıda uçtan uca: kurye `CS-2026-0005`'e teslim fotoğrafı yükledi →
"Müşteriye iletildi" rozeti → müşteri takip sayfasında "Teslim anı" kartı
göründü. Kota: Gül Bahçesi'nin açık sipariş kotası doldurulunca ödeme adımı
*"…taşıyabileceği en fazla siparişe ulaştı (6/6)"* dedi; gün kotası 0 yapılınca
*"seçtiğin gün için teslimat kotasını doldurdu"* + tarih alanı hatası çıktı;
kota seed değerine dönünce sipariş normal geçti (`CS-2026-0039`). Admin
unvanları hem panel başlığında hem rol değiştiricide doğru. Hediye notu
eşleşmesi 34 siparişin tamamında kontrol edildi. Sonra `npm run seed` ile veri
demo hâline döndürüldü. `tsc --noEmit` ve `npm run build` temiz (43 rota).

### Kapsam dışı bırakılan

Hediye Setleri ve Doğum Günü kategorilerinin ikisinde de pasta fotoğrafı var
(§4/1). 28 Temmuz'da kapsam dışı bırakılmıştı, öyle kaldı.

---

## 2a. 30 Temmuz oturumu — Render'da yayına alındı, 502 çözüldü

Kullanıcı Render panelinden Blueprint ile servisi kurdu (`New → Blueprint → repo
→ Apply`). İlk deploy başarılı geçti ama **site 502 veriyordu.**

**Teşhis:** sayfa kodunda hata yok — sunucu süreci ölüyordu. `curl` ile rotalar
tek tek denendi; HTML rotaları 200 dönerken `/_next/image?...` istekleri 502
veriyordu ve o istekten sonra **ana sayfa da** 502'ye düşüyordu. Sebep:

- Next'in yerleşik görsel optimizer'ı kareyi **kendi sunucumuzda** açıyor.
- Seed'deki URL'ler ham Unsplash dosyasına işaret ediyor: ölçüldü, tanesi
  **6.996.185 bayt (~7 MB), ~6000 px**.
- Katalog sayfası bir seferde onlarca kare istiyor. Free plan kutusu 512 MB;
  `sharp` çözerken bellek bitiyor, Node OOM ile ölüyor, tüm servis düşüyor.

**Çözüm:** `src/lib/image-loader.ts` — özel `next/image` yükleyicisi. Unsplash
URL'lerine `w`/`q`/`auto=format`/`fit=crop` ekliyor, ölçeklendirme imgix'e
(Unsplash CDN) geçti. Sunucuya düşen iş sıfır. Kazanımlar korundu: AVIF/WebP
(200 px kart ~16 KB, 1080 px kahraman ~128 KB — `Accept` başlığıyla doğrulandı),
`imageSizes` basamaklarıyla responsive `srcSet`, blur placeholder, `quality={88}`.

> ⚠️ **`next.config.ts`'ten `loader: "custom"` satırını kaldırma** — kaldırınca
> free plan'de site yine çöker. Özel yükleyici devredeyken `remotePatterns`,
> `formats` ve `minimumCacheTTL` yerleşik optimizere ait olduğundan işlemez;
> bu yüzden silindiler, eksik değiller. Unsplash dışı konaklar (satıcı panelinden
> elle girilen URL) olduğu gibi geçer.

`tsc --noEmit` temiz, `npm run build` temiz, üretim sunucusunda `srcSet`
çıktısında `_next/image` kalmadığı doğrulandı.

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
  **JetBrains Mono**. *(Üçü de sonradan değişti — bugünkü hâli: Outfit /
  Poppins / IBM Plex Mono. Bodoni hediye notunda kaldı. Bkz. §1a ve
  26 Ağustos mono turu.)*
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
- **Render free plan 512 MB RAM.** Sunucuda görsel işlemek (Next optimizer) bu
  kutuda tüm servisi 502'ye düşürüyor — bkz. §2a. Yeni bir ağır iş eklerken
  (PDF üretimi, görsel işleme, büyük dosya) belleği hesaba kat.
- **Görseller Unsplash'ten geliyor, internet gerekir.** Bağlantı yoksa uygulama
  kırılmaz; `ProductImage` yerel çiçek çizimine düşer. Sunumdan önce sayfaları
  bir kez gezip önbelleğe almak iyi olur.
- **Tarayıcı otomasyonunda ekran görüntüsü aldatıcı olabilir.** Bu makinede
  Chrome %75 yakınlaştırmada ve pencere 2560 CSS px genişliğinde; ekran
  görüntüsü sayfanın yalnızca bir bölümünü kırpıyor, sayfa boş sanılabiliyor.
  Doğrulamayı `javascript_tool` ile DOM üzerinden yap.
- **Sunucu eylemi tıklaması işe yaramıyorsa** sayfa muhtemelen henüz hydrate
  olmamıştır (dev sunucusunda ilk derleme yavaş). Yeniden yükleyip tekrar dene;
  `document.body.innerText.length` küçükse sayfa hâlâ geliyordur.
- Kökte dört markdown var ve dördü de gereklidir: `Claude.md` (brief),
  `README.md` (teslim dokümanı), `ISTEKLER.md` (müşteri istek listesi ve
  karşılıkları), `OTURUM-NOTLARI.md` (bu dosya).

---

## 4. Doğrulanmayan / sıradaki olası işler

Aşağıdakiler **yapılmadı**, istenirse sıradaki oturumda ele alınabilir:

1. **Seed içeriği** (28 Temmuz'da kapsam dışı bırakıldı, istenirse geri gelir):
   Hediye Setleri ve Doğum Günü kategorilerinin ikisinde de pasta fotoğrafı var.
   *(Hediye notu uyumsuzluğu 25 Ağustos'ta kapatıldı — §1e.)*
2. ~~**Ürün galerisi.**~~ 21 Ağustos'ta yapıldı (madde 23, `ProductMedia`).
3. **Odaklı ödeme başlığı.** Ödeme adımında 210 px'lik başlık (logo + arama +
   kategori şeridi) duruyor; gerçek e-ticarette bu adımda başlık daralır.
4. `RoleGate`, yanlış rolle girilen sayfaya değil panelin köküne yönlendiriyor
   (`/satici/kazanc` → `/satici`). Küçük konu, düzeltilebilir.
5. Ana sayfada başlıktaki kategori şeridi ile "Ne göndermek istersin?" ızgarası
   telefonda aynı 10 kategoriyi arka arkaya gösteriyor. Referans kalıpta da
   böyle ama istenirse biri kaldırılabilir.
6. ~~**Kapanış anı fikri.**~~ 25 Ağustos'ta yapıldı — kurye teslim fotoğrafı,
   §1e.

---

## 5. Demo hesapları (hatırlatma)

Giriş ekranı yok; sağ üstteki **rol değiştirici** ile geçiliyor.

| Rol | Hesap |
| --- | --- |
| Müşteri | Zeynep Aksoy |
| Satıcı | Serkan Yalçın — Gül Bahçesi Çiçekçilik (İstanbul, %12) |
| Kurye | Murat Ilgaz |
| Admin | Nazlı Öztürk (ayrıca Kerem Balcı, Sibel Aksu) |

Seed: 27 kullanıcı, 7 mağaza (2'si onay bekliyor), 11 kategori (biri gizli),
70 ürün (9'u ek ürün), 55 mahalle, 38 sipariş (`CS-2026-0001` …
`CS-2026-0038`), 10 fatura, 7 denetim kaydı. Sabit tohumlu — her kurulumda
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

---

## 25 Ağustos 2026 — Kategori navbar'ı (ciceksepeti düzeni)

Müşteri, ciceksepeti.com'un navbar'ındaki kategorileri gezip bizde olmayanları
aynı düzende istedi. Canlı site tarayıcıdan incelendi, çıkarılan yapı
**`CS-NAVBAR-GOZLEM.md`** dosyasına yazıldı (9 üst başlık, her birinin alt
listesi, iki menü kalıbı, ölçüler, bizdeki karşılıkları).

**Ne değişti**

- Yeni **`src/lib/nav-tree.ts`** — dokuz üst başlık ve alt dallar statik ağaç.
  Kategori tablosu şişirilmedi: her yaprak mevcut bir sorguya bağlanır
  (`/kategori/<slug>`, `?koleksiyon=`, `?amac=`, `?q=`). Üç eksen (kategori /
  koleksiyon / gönderim amacı) tek ağaçta birleşti.
- Yeni **`src/components/site/MainNav.tsx`** — metin başlıkları + hover'da tam
  genişlik panel. İlk başlık ("Çiçek") mega menü: solda 12 dal, sağda seçili
  dalın altları. Diğer sekizi çok sütunlu düz liste. Esc kapatır, klavyeyle
  gezilir.
- **`SiteHeader`** üçüncü katmanı artık bu navbar. Fotoğraflı kategori şeridi
  ana sayfanın en üstüne indi (gerçek sitede de o şerit gövdenin ilk elemanı).
  Telefonda başlıkta iki hap satırı olmasın diye koleksiyon hapları da
  `MainNav`'ın tek şeridine katıldı.

**Dikkat — SQLite arama tuzağı**

`contains` filtresi SQLite `LIKE`'ına düşer; **yalnızca ASCII harflerde**
büyük/küçük harf ayrımını yok sayar. "Ç", "İ", "Ö", "Ş" ile başlayan ürün
adları küçük harfli terimle bulunamıyor — `?q=çikolata seti` boş dönerken
`?q=Çikolata Seti` çalışıyor. Ağaçtaki terimler bu yüzden ürün adındaki
yazımla verildi. Arama kutusu için de geçerli bir kısıt; ileride düzeltilecekse
adı normalize eden bir sütun gerekir.

Ayrıca **onay bekleyen satıcının ürünü hiçbir yerde listelenmez** — "Lale
Buketi" ve "Kuru Çiçek Aranjmanı" bu yüzden menüden çıkarıldı. Ağacın her
yaprağı ürün döndürecek şekilde bir kerelik betikle doğrulandı; boş yaprak yok.

### Aynı gün — kategori vitrini

Müşteri, ciceksepeti'nde kategoriye tıklayınca ürünlerin **üstünde** çıkan
afiş/kutucuk bloklarını da istedi (ekran görüntüleri
`Belgeler\ccicekspetifotoğraflar`). Canlı `/d/cicek` sayfasından ölçülen sıra
birebir uygulandı:

    ikili afiş (2.4:1) → alt kategori ızgarası (6 sütun × 2 satır)
    → üçlü afiş → ikili afiş → ürün ızgarası

- Yeni **`src/lib/category-showcase.ts`** — on kategorinin her biri için 7 afiş
  ve **11 kutucuk**. Kutucuk sayısı 11 çünkü "Tümünü görüntüle" ile birlikte 12
  eder; 12, ızgaranın 3 / 4 / 6 sütunlu hâllerinde tam satırla kapanır.
- Yeni **`src/components/site/CategoryShowcase.tsx`** — afiş satırları ve
  kutucuk ızgarası. Afiş fotoğrafı ayrı bir görsel varlık değil, **mevcut bir
  ürünün** fotoğrafı (`productSlug`). Demoya yeni dosya girmiyor, kırık görsel
  olmuyor; ürün yayından kalkarsa o kare sessizce düşüyor.
- Afiş yazısı referansta sağda; burada sola alındı — Türkçe başlıklar uzun,
  sola yaslı okununca satır kırılmıyor.

Nav ağacındaki kural burada da geçerli: bütün afiş ve kutucuk adresleri tek
seferlik betikle sorgulandı, **boş dönen yok**.

### Aynı gün — üst başlıklara vitrin sayfaları

Kategori vitrini beğenilince aynısı navbar'ın **üst başlıkları** için de
istendi. Bu başlıkların bir kısmının `Category` tablosunda karşılığı yok
("Çiçek" yedi kategoriyi toplar, "Hediye" bir koleksiyon sorgusudur, "Kişiye
Özel" elle seçilmiş bir listedir), o yüzden tabloya satır açmak yerine yeni bir
rota açıldı:

- **`/vitrin/[slug]`** — `src/app/(shop)/vitrin/[slug]/page.tsx`.
  Kategori sayfasıyla aynı iskelet (kapak → kardeş başlıklar → vitrin →
  ürün ızgarası), tek fark ürünlerin `landing.ts` içindeki `where` parçasından
  gelmesi. `CategoryShowcase` bileşeni ikisini ayırt etmiyor.
- **`src/lib/landing.ts`** — altı vitrin: Çiçek (44 ürün), Yenilebilir Çiçek
  (10), Gönderim Amacı (45), Hediye (23), Kişiye Özel (15), El Yapımı (11).
  Her biri `where` + `showcase` + kapak ürünü.
- `nav-tree.ts`'te bu altı başlığın `href`'i artık `/vitrin/<slug>`.
  Böylece navbar'da vitrini olmayan üst başlık kalmadı: kalan üçü zaten
  kategori sayfasına gidiyor (Doğum Günü, Orkide/Saksı, Hediye Setleri).

"Kişiye Özel" ve "El Yapımı" pazaryerinde bir alan değil — ürünler elle seçildi
(`PERSONAL_SLUGS`, `HANDMADE_SLUGS`). Gerçek sistemde bunlar ürün üzerinde bir
etiket olur; demoda liste yeterli.

Doğrulama yine betikle: altı vitrinin ürün sayısı, kapak fotoğrafı ve
108 afiş/kutucuk adresinin hepsi sorgulandı — boş dönen yok.

### Aynı gün — sepet doluyken adres + geri sayım bandı

Navbar'ın altında, ciceksepeti'ndeki gibi iki panelli bir bant istendi:
solda gönderim adresi, sağda aynı gün teslimat için kalan süre.

- **`src/components/site/DeliveryBand.tsx`** — istemci bileşeni.
  Sol panel **fern** (token'ın niyeti: yalnızca olumlu durum), sağ panel
  **gold** (yalnızca kıtlık). Sol panel `openAreaDialog()` ile mevcut adres
  penceresini açar, JS kapalıysa `/teslimat-bolgesi` sayfasına düşer.
- `(shop)/layout.tsx` bandı **yalnızca `cartCount > 0` iken** çiziyor.
  Boş sepette geri sayım baskı kurar ama karşılığı yok; ürün sepete girdiği an
  "bunu bugün alabilir miyim" sorusu gerçek oluyor.
- Adres satırı önce seçili mahalledeki kayıtlı adresi gösterir (sokak dahil),
  yoksa mahallenin tam adına düşer, bölge hiç seçilmemişse "Adres seç" der.

**`delivery-time.ts`'e eklenenler:** `SAME_DAY_WINDOW_START_HOUR` (09:00),
`istanbulMinutes`, `formatMinutesLeft`, `sameDayWindow`. `timeUntilCutoff`
artık bunları kullanıyor — kesim saati hesabı hâlâ tek yerde.

Süre sunucuda bir kez hesaplanıp istemcide dakikası düşülüyor (15 sn'de bir
tik). Pencere kapalıyken ilerleme çubuğu **hiç çizilmiyor**: dolu bir çubuk
"hâlâ vakit var" der, oysa yok.

İki durum da tarayıcıda görüldü: 18:00 öncesi "Bugün teslim için son 47 dakika"
+ altın çubuk, sonrası "Aynı gün penceresi kapandı" + "yarın sabah tezgâhta".

### Yayın kaydı

26 Ağustos'ta `main`'e push edildi: **`640ebb1`** (31 dosya, +4.407/−188) —
25 Ağustos'un iki turu (§1e inceleme bulguları 34-38 ve navbar/vitrin/teslimat
bandı) tek commit'te gitti. Push öncesi `tsc --noEmit` ve `npm run build`
koşuldu: temiz, **41 rota** (`/vitrin/[slug]` altı yolla SSG). Render `main`'den
otomatik deploy ediyor.
