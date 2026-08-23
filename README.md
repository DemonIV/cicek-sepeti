# ÇiçekSepeti — Çok Satıcılı Çiçek & Hediye Pazaryeri (Demo)

> **Bu bir sunum prototipidir, production sistemi değildir.**
> Ödeme, kargo, e-fatura, SMS/e-posta ve kimlik doğrulama **simüle edilmiştir**.
> Gerçek para hareketi, gerçek entegrasyon ve gerçek oturum güvenliği yoktur.
> Amaç, platformun uçtan uca nasıl çalışacağını tıklanabilir biçimde göstermektir.

Dört rol tek uygulamada yaşar: **Müşteri**, **Satıcı**, **Kurye**, **Admin**.
Bir sipariş birden fazla çiçekçinin ürününü içerebilir; her çiçekçi yalnızca
kendi kalemini görür ve yönetir.

---

## Kurulum

Harici servis, API anahtarı veya hesap gerekmez. Veritabanı tek dosyalık SQLite.

```bash
npm install
npx prisma migrate dev
npm run seed
npm run dev
```

Ardından http://localhost:3000 adresini aç.

| Komut | Ne yapar |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu |
| `npm run seed` | Veriyi **sıfırlayıp** yeniden kurar (sunum öncesi temiz başlangıç) |
| `npm run db:reset` | Migration'ları sıfırdan uygular ve seed eder |
| `npm run build` | Production derlemesi |

**Görseller hakkında:** Ürün ve mağaza görselleri Unsplash URL'lerinden gelir,
yani ilk açılışta internet bağlantısı gerekir. Bağlantı yoksa uygulama kırılmaz
— her görsel yerel bir çiçek çizimine düşer, kırık görsel ikonu çıkmaz. Sunumdan
önce sayfaları bir kez gezmek görselleri önbelleğe alır.

---

## Yayına alma (Render)

Depoda hazır bir `render.yaml` var. Render panelinde **New → Blueprint** → bu
repo seçilir; build/start komutları ve ortam değişkenleri oradan okunur. Elle
kurmak isteyen için karşılığı:

| Ayar | Değer |
| --- | --- |
| Runtime | Node |
| Build command | `npm ci --include=dev && npm run render-build` |
| Start command | `npm run start` |
| Ortam değişkeni | `DATABASE_URL=file:./dev.db` |

Bilinmesi gereken dört şey:

- **Görselleri Next optimizer'ına verme.** Ücretsiz plan 512 MB RAM; yerleşik
  optimizer ham Unsplash dosyalarını (~7 MB) bu kutuda açmaya kalkınca süreç OOM
  ile ölüyor ve **site tamamen 502 veriyor** (ilk yayın denemesi böyle düştü).
  Bu yüzden ölçeklendirme `src/lib/image-loader.ts` ile Unsplash CDN'ine
  devredildi. `next.config.ts`'te `loader: "custom"` satırını kaldırmayın.
- **Veri kalıcı değil.** SQLite dosyası build sırasında oluşturulup seed edilir,
  Render'ın diski ise geçicidir. Servis her yeniden başladığında veri seed
  hâline döner — sunumda girilen sipariş kalmaz. Demo için bilinçli tercih:
  her deploy tertemiz ve öngörülebilir bir demo verisi verir. Kalıcılık
  gerekirse `render.yaml` sonundaki disk notunu izleyin (ücretli plan gerekir).
- **Seed verisi deploy tarihine göre üretilir.** Admin panelindeki "son 7 gün"
  grafiği build anına göre doludur; aradan haftalar geçerse boşalır. Sunumdan
  önce Render'da **Manual Deploy** ile yeniden deploy edin, veri tazelenir.
- **Ücretsiz plan 15 dakika hareketsizlikten sonra uykuya geçer** ve uyanması
  ~1 dakika sürer. Müşteri sunumunda bu risk alınmamalı: `render.yaml` içinde
  `plan: free` → `plan: starter` yapın, ya da sunumdan hemen önce siteyi bir
  kez açıp uyandırın.

---

## Demo hesapları ve rol değiştirme

Giriş ekranı **yoktur**. Sağ üstteki **rol değiştirici** ile hesaplar arasında
tek tıkla geçilir — sunum sırasında login/logout ile vakit kaybedilmesin diye.

> Gerçek sistemde her rol kendi giriş ekranından şifreyle oturum açar. Buradaki
> "oturum", tek bir çerezde tutulan kullanıcı id'sinden ibarettir.

| Rol | Hesap | Notu |
| --- | --- | --- |
| **Müşteri** | Zeynep Aksoy | Menüde ayrıca Emre Çetin, Selin Yıldırım |
| **Satıcı** | Serkan Yalçın — Gül Bahçesi Çiçekçilik (İstanbul, %12 komisyon) | Ayrıca Aylin Doğan — Menekşe Çiçek Evi (Ankara, %14), Deniz Kaya — Ege Orkide (İzmir, %11) |
| **Kurye** | Murat Ilgaz | Ayrıca Hakan Yavuz, Serpil Kaya |
| **Admin** | Nazlı Öztürk — Operasyon Müdürü | Ayrıca Kerem Balcı — Bayi İlişkileri, Sibel Aksu — Finans. Üçü de kendi ismiyle girer; yaptıkları **İşlem kayıtları** ekranına düşer |

Yanlış rolle bir panele girilirse ekran kırılmaz: ne olduğunu anlatan ve tek
tıkla doğru role geçiren bir ara ekran çıkar.

---

## Demo senaryosu (sunumun bel kemiği)

Bu 10 adım uçtan uca test edilmiştir (son test: 21 Ağustos 2026); hiçbir adımda
hata, boş ekran veya kırık link yoktur.

1. **Teslimat bölgesi.** Başlığın sağ üstündeki *"Nereye göndereceksin?"* →
   İstanbul / Kadıköy / **Caferağa**. Katalog o mahalleye gönderilebilen ürünlere
   daralır; başlıkta ve katalogda bölge yazar. (Bursa'yı seçmeyi de dene: o
   şehrin bayisi hâlâ onay beklediği için mahalleler **kapalı** görünür.)
2. **Ürün seçimi.** Bir ürüne gir: galeride üç fotoğraf ve **tanıtım videosu**,
   indirimliyse **geri sayım** ve üstü çizili liste fiyatı. Sepete ekle.
3. **Ek ürün.** Aynı sayfada *"Yanında ne gitsin?"* şeridinden bir çikolata veya
   balon ekle. Ek ürün **Hediye Deposu**'ndan geldiği için sipariş kendiliğinden
   çok satıcılı olur — sepet bunu açıkça söyler.
4. **Ödeme adımı.** Alıcı bilgisi, **şehir → ilçe → mahalle**, tarih ve saat,
   **hediye notu** ve *"Kartın altına gönderici ismi yazılsın"* kutucuğu
   (işaretlenmezse kart imzasız gider). Ardından sahte kart ekranı ve **3D Secure
   simülasyonu** — bilinçli olarak *"Başarısız senaryoyu göster"* de seçilebilir;
   sipariş kaybolmaz, tekrar denenebilir. Başarılı ödemede stok düşer.
5. **Sipariş takibi:** durum çubuğu, mağaza bazında kalemler, hediye notu ve
   sipariş geçmişi.
6. **Rol değiştir → Satıcı.** Sipariş listesi **bugünle** açılır ve yeni sipariş
   oradadır. Satıcı "Hazırlamaya başla" der, **hazırlık onay görselini** yükler
   (telefonda doğrudan kamera açılır), sonra **"Arabaya verildi"** işaretler.
7. **Rol değiştir → Admin.** Sipariş tüm siparişlerde görünür; admin bir
   **kurye atar**. Sipariş detayında her satıcının komisyonu ayrı hesaplanır.
8. **Rol değiştir → Kurye.** Sipariş **"İşlem gören teslimatlar"** listesindedir
   (arabaya verilmemiş olsaydı "Çiçekçi hazırlığında" bölümünde beklerdi). Kurye
   alıcı bilgisini görür ve **"Teslim edildi"** işaretler.
9. **Rol değiştir → Müşteri.** Takip sayfasında durum "Teslim edildi" ve
   çiçekçinin gönderdiği **hazırlık fotoğrafı** görünür.
10. **Admin panosu:** ciro, sipariş sayısı ve son 7 gün grafiği güncel.

### Gösterilebilecek diğer akışlar

- **Finans ve raporlar** (`/admin/finans`): haftalık ciro, bayi hakedişleri,
  bayilerin yüklediği faturaları onaylama, **ödemesi yarım kalan siparişe
  hatırlatma gönderme**.
- **Bayi künyesi** (`/admin/saticilar` → *Aç*): hizmet bölgelerini mahalle
  mahalle açma, sipariş alımını durdurma, gün/sipariş kotası, hizmet puanı ve
  **"Gecikmeleri tara"** (geciken siparişlere otomatik −5 puan).
- **İşlem kayıtları** (`/admin/kayitlar`): hangi admin neyi değiştirmiş.
- **Satıcı faturaları** (`/satici/faturalar`): bayi kendi komisyon faturasını
  yükler, finans ekranında karşılığı anında görünür.
- **Satıcı ürünleri** (`/satici/urunler`): bayi mevcut ürüne dokunamaz, yalnızca
  **stoğu kapatır**; kapattığı ürün vitrinde "satışa kapalı" olur.
- **Ürün başvurusu** (`/satici/urunler/basvuru` → `/admin/urunler/basvurular`):
  bayi mağazasına **yeni ürün önerir**, operasyon onaylayınca ürün vitrine
  çıkar; reddedilirse sebep bayinin panelinde görünür.

---

## 21 Ağustos 2026 eklentileri

Müşteriden gelen 25 maddelik liste bu sürümde uygulandı (biri müşteri isteğiyle
iptal edildi). Madde madde ne yapıldığı **`ISTEKLER.md`** dosyasında; başlıklar:

| Alan | Ne geldi |
| --- | --- |
| **Teslimat bölgesi** | Şehir → ilçe → mahalle seçimi; katalog ve ödeme adımı seçilen bölgeye göre daralır. Bayi ↔ mahalle eşleşmesini operasyon açar. |
| **Ek ürünler** | Çikolata, balon, pasta, vazo, kart, oyuncak — ayrı bir tedarikçiden (Hediye Deposu), ürün sayfasında ve sepette. |
| **Zamanlı indirim** | Başlangıç/bitiş saatli indirim, ana sayfada geri sayım, "haftanın ürünü" bandı. |
| **Ürün galerisi** | Her üründe en az üç fotoğraf, seçili ürünlerde tanıtım videosu. |
| **Hazırlık onay görseli** | Çiçekçi buketin fotoğrafını yükler, müşteri takip ekranında görür. |
| **Gönderici ismi** | Kart notunun altına imza — istenmezse kutucuk kapalı kalır. |
| **Fatura akışı** | Bayi yükler, finans onaylar; iki panelde de durum görünür. |
| **Bayi yönetimi** | Sipariş alımını durdurma, gün/sipariş kotası, hizmet puanı (gecikmede otomatik −5), sorumlu kişi ataması. |
| **Arabaya verildi** | Sipariş araca verilene kadar kuryenin "işlem gören" listesine düşmez. |
| **Üç admin + denetim izi** | Üç kişi kendi ismiyle girer; her yetki değişikliği kim yaptıysa onun adıyla kaydedilir. |
| **Görünüm** | Outfit başlık yüzü, yuvarlak ana sayfa afişleri, logo sol / arama orta / sepet sağ, üstte koleksiyon şeridi, tanıdık e-ticaret ürün kartı. |

---

## 23 Ağustos 2026 eklentisi — bayiden ürün başvurusu

Müşteri isteği: *"satıcı kendi panelinde kendi mağazasına ürün ekleyebilmeli
ama adminin onayından geçecek."* 21 Ağustos'taki 4. madde (bayi ürün bilgisini
değiştiremez) korunarak eklendi:

- Bayi `/satici/urunler` → **Yeni ürün başvurusu** ile ürünü tanımlar (ad,
  kategori, fiyat, stok, açıklama, ana görsel + ek görseller, video, not).
  Gönderilen kayıt bir **başvurudur** — vitrinde görünmez, sepete girmez.
- Operasyon `/admin/urunler/basvurular` ekranında görür. **Onayla ve yayına
  al** ürünü (galerisiyle birlikte) oluşturup vitrine çıkarır; **Reddet**
  sebep ister ve sebep bayinin "Başvurularım" listesinde görünür.
- Bayi bekleyen başvurusunu **geri çekebilir**; sonuçlanmış başvuruya dokunamaz.
- Onaydan sonra ürünün fiyatı ve içeriği yine yalnızca operasyondan değişir;
  bayinin yetkisi stoğu kapatıp açmakla sınırlı kalır.
- Her onay/ret **denetim izine** kimin yaptığıyla birlikte yazılır.

---

## Ekranlar

**Müşteri**

| Yol | Ekran |
| --- | --- |
| `/` | Ana sayfa: haftanın ürünü, indirimdekiler, öne çıkanlar, kategoriler, çiçekçiler |
| `/teslimat-bolgesi` | Şehir → ilçe → mahalle seçimi; katalog buna göre daralır |
| `/urunler` | Katalog: koleksiyon, kategori, satıcı, fiyat filtresi ve sıralama |
| `/kategori/[slug]` | Kategori listesi |
| `/magaza/[slug]` | Mağaza vitrini |
| `/urun/[slug]` | Ürün detayı: galeri (3+ fotoğraf, video), indirim geri sayımı, ek ürünler |
| `/sepet` | Sepet — mağazaya göre gruplu, ek ürün şeridi |
| `/odeme` | Teslimat bilgileri, şehir/ilçe/mahalle, hediye notu + gönderici ismi |
| `/odeme/[siparisNo]` | Sahte kart ekranı + 3D Secure simülasyonu |
| `/siparis/[siparisNo]` | Sipariş takibi |
| `/hesabim`, `/hesabim/adresler` | Sipariş geçmişi, adresler |

**Paneller**

| Yol | Ekran |
| --- | --- |
| `/satici` | Genel bakış: sipariş, kazanç, **sorumlu kişi**, **kota**, **hizmet puanı** |
| `/satici/urunler` | Ürünlerim — okunur; **stoğu kapat/aç** + kendi **ürün başvuruları** |
| `/satici/urunler/basvuru` | Yeni ürün başvurusu (onaya gider) |
| `/satici/siparisler` | Kendi kalemleri; **teslimat tarihine göre**, bugünle açılır |
| `/satici/kazanc` | Komisyon düşülmüş kazanç dökümü |
| `/satici/faturalar` | Fatura yükleme ve inceleme durumu |
| `/kurye` | Atanan teslimatlar: **işlem gören** ve **çiçekçi hazırlığında** |
| `/kurye/[siparisNo]` | Teslimat detayı: alım noktaları, alıcı, teslim onayı |
| `/kurye/gecmis` | Tamamlanan teslimatlar |
| `/admin` | Ciro, sipariş, aktif satıcı, son 7 gün grafiği |
| `/admin/basvurular` | Satıcı başvuruları: onayla / reddet |
| `/admin/saticilar` | Satıcı yönetimi, komisyon oranı, puan, bölge sayısı |
| `/admin/saticilar/[id]` | Bayi künyesi: **hizmet bölgeleri**, sipariş alımı, kota, puan, sorumlu |
| `/admin/siparisler` | Tüm siparişler, filtre, kurye atama |
| `/admin/urunler` | Tüm ürünler; **ürün ekleme/düzenleme burada** (galeri, indirim) |
| `/admin/urunler/basvurular` | Bayilerin ürün başvuruları: onayla ve yayına al / reddet |
| `/admin/finans` | Finans ve raporlar: hakedişler, faturalar, yarım kalan ödemeler |
| `/admin/kayitlar` | İşlem kayıtları (denetim izi) |
| `/mobil-onizleme` | Müşteri arayüzü telefon çerçevesi içinde |

---

## Seed verisi

`npm run seed` her çalıştığında veriyi siler ve **aynı** içeriği yeniden kurar
(sabit tohumlu üreteç) — sunum yapan kişi ekranda sürprizle karşılaşmaz.

- **27 kullanıcı:** 14 müşteri, 7 satıcı, 3 kurye, **3 admin**
- **7 mağaza:** İstanbul, Ankara, İzmir, Kayseri'de 4 çiçekçi + ek ürünleri
  gönderen **Hediye Deposu** onaylı; Antalya ve Bursa'dan 2 mağaza **onay
  bekliyor** (admin başvuru ekranı dolu görünsün, Bursa mahalleleri kapalı kalsın)
- **11 kategori** (biri gizli: *Hediye Ekleri*), **71 ürün** — 61 çiçek +
  **9 ek ürün** + onaylanmış bir bayi başvurusu; birkaç ürün bilinçli olarak
  stokta az
- **55 mahalle** ve bayi ↔ mahalle eşleşmeleri; her bayi kendi şehrinin bir
  bölümüne hizmet verir, Hediye Deposu her yere kargolar
- **8 zamanlı indirim** (biri gelecek tarihli, yani "planlandı") ve bir
  **haftanın ürünü**
- Her üründe **en az 3 galeri görseli**; 4 üründe `public/video/` altında
  tanıtım videosu
- **38 sipariş**, son 30 güne yayılmış, tüm durumlara dağılmış; büyük bölümü
  **çok satıcılı** (çiçek + hediye eki)
- **10 fatura**, **7 denetim kaydı**, bayi puan hareketleri
- **4 ürün başvurusu:** ikisi onay bekliyor, biri onaylanıp yayına alınmış,
  biri sebebiyle reddedilmiş — üç durum da ekranda görünsün diye

---

## Mimari

**Yığın:** Next.js (App Router) + TypeScript, Tailwind CSS, Prisma + SQLite.
Veri erişimi sunucu bileşenlerinde, değişiklikler sunucu eylemlerinde.

İş mantığı ekranlara dağılmaz, tek yerde toplanır:

| Dosya | Sorumluluk |
| --- | --- |
| `src/lib/order-status.ts` | **Durum makinesi.** Geçiş kuralları, rol yetkileri, buton etiketleri ve çok satıcılı sipariş durumunun türetilmesi |
| `src/lib/pricing.ts` | Komisyon, satıcı kazancı, sepet toplamları |
| `src/lib/orders.ts` | Sipariş oluşturma, ödeme sonucu, durum ilerletme, olay kaydı |
| `src/lib/cart.ts` | Çerez tabanlı sepet ve mağazaya göre gruplama |
| `src/lib/auth.ts` | Demo oturumu ve rol değiştirici hesapları |
| `src/lib/discount.ts` | **Zamanlı indirim.** Geçerli fiyatı hesaplayan tek yer |
| `src/lib/delivery-area.ts` | Teslimat bölgesi: seçim, ağaç, bayi eşleşmesi filtresi |
| `src/lib/collections.ts` | Üst şeritteki koleksiyonlar (Premium, Hediye, Balon…) |
| `src/lib/seller-score.ts` | Bayi puanı ve otomatik gecikme cezası |
| `src/lib/audit.ts` | Denetim izi — admin eylemlerinin kaydı |

Ortak arayüz bileşenleri (`button`, `input`, `card`, `badge`, tablo) müşteri
tarafı ile paneller arasında paylaşılır; renk ve tipografi `globals.css`'te
token olarak tanımlıdır. Paneller aynı sistemi daha yoğun kullanır.

---

## Tasarım

**Yön: "Vitrin".** Kimlik çiçekçinin vitrininden alındı — pudra pembesi ambalaj
kağıdı, koyu patlıcan moru sargı ve tek bir doygun ahududu aksanı.

| Rol | Değer |
| --- | --- |
| Zemin (`paper`) | `#fbf0ec` — pembeye çalan kağıt beyazı |
| Yapı ve metin (`plum`) | `#1b0a15` → `#f9eff3` |
| Aksiyon ve fiyat (`bloom`) | `#c2154b` |
| Kıtlık ve puan (`gold`) | `#cf9128` — **yalnızca** stok uyarısı ve puan |
| Olumlu durum (`fern`) | `#3f6b4e` — **yalnızca** teslim edildi |

**Tipografi.** Başlıklarda **Outfit** (geometrik, açık gözlü sans), gövdede
**Manrope**, veri ve etiketlerde **JetBrains Mono**.

> 21 Ağustos 2026'da müşteri isteğiyle başlık yüzü değişti: önceki **Bodoni
> Moda** iri puntoda güzel duruyordu ama 16–18 px'te tırnakları dağılıyor,
> panel başlıkları zor okunuyordu. Outfit her ölçekte net. Didone tamamen
> atılmadı: **hediye notu** kartında italik olarak kaldı (`--font-note`) —
> markanın imza öğesi orası, el yazısı hissini o taşıyor.

**Ürün fotoğrafı tam karedir.** Kart, ürün detayı, sepet, ödeme özeti ve panel
tablolarında aynı 1:1 çerçeve kullanılır — tanıdık e-ticaret ızgarası.

**Izgara:** telefonda 2, 640 px'te 3, 768 px'te 4, 1024 px'te 5, 1536 px'te 6
sütun. Filtre kenar çubuğu olan katalog sayfası bir kademe geride: 4, sonra 5.
Kart genişliği her yerde 159–230 px arasında kalıyor; hiçbir genişlikte taşma
yok.

**Görsel kalitesi (production).** Fotoğraf bu vitrinin kahramanı olduğu için
ayarlar bilinçli:

- **Ölçeklendirme Unsplash CDN'inde**, kendi sunucumuzda değil
  (`src/lib/image-loader.ts` — özel `next/image` yükleyicisi). `auto=format` ile
  tarayıcı AVIF/WebP alıyor: 200 px'lik kart karesi AVIF'te ~16 KB, JPEG'de
  ~17 KB; 1080 px'lik kahraman görsel ~128 KB.
  > Neden: yerleşik optimizer görseli **bizim** sunucumuzda açıyor. Seed'deki
  > ham Unsplash dosyaları ~7 MB / ~6000 px; katalog onlarcasını aynı anda
  > isteyince 512 MB'lık Render free plan kutusu OOM ile ölüyor ve **tüm site
  > 502 veriyordu.** İlk yayın denemesi tam bu yüzden düştü. Özel yükleyici
  > devredeyken `remotePatterns`, `formats` ve `minimumCacheTTL` yerleşik
  > optimizere ait olduğu için işlemez — silinmeleri kasıtlı.
- `quality={88}` (Next varsayılanı 75). Fark pembe geçişlerde ve yaprak
  kenarlarında görülüyor.
- `imageSizes`'a 200/320 eklendi: kart genişlikleri 2 sütundan 6 sütuna
  değişiyor, ara basamak yoksa srcset bir üste yuvarlıyor.
- Her `ProductImage` çağrısında `sizes` gerçek kutu genişliğini tarif eder
  (kart için beş kademeli, küçük görsellerde piksel değeri). Yanlış `sizes`
  bulanık ya da gereksiz ağır görsel demektir — kalitede en belirleyici ayar bu.
- Yüklenirken pudra pembesi bir blur placeholder duruyor, beyaz sıçrama yok.

**İmza form: kemer.** Vitrin camının ve buketin silueti. Ürün ızgarası kareye
geçtiğinden kemer yalnızca editoryal yüzeylerde kaldı — seyrek olduğu için süs
değil marka gibi okunur:

- `arch-full` — ana sayfadaki vitrin üçlemesi
- `arch` — kategori karoları
- `arch-sm` — başlıktaki kategori şeridi ve marka işareti

**Kategoriler fotoğrafla gezilir.** Hem üst şeritte hem ana sayfada kategori
adının yanında değil, kategorinin kendi fotoğrafı durur — "buket" kelimesini
okumak yerine buketi görüp tıklarsın.

**Müşteri tarafı ortalanmış ve editoryaldir; paneller yoğun ve sola dayalıdır.**
İkisi aynı token setini kullanır, ama vitrin nefes alır, panel iş görür.

**Telefonda düzen değişir, kimlik değişmez.** Dar ekranda vitrin düzeni yerini
mobil ticaret kalıbına bırakır — masaüstünde hiçbir şey değişmez:

| | Masaüstü | Telefon |
| --- | --- | --- |
| Başlık | Marka ortada, üç sütun | Marka solda, sepet sağda; marka satırı ve arama yapışkan |
| Hero | Üç kemerli vitrin + hediye notu | Tek kampanya afişi (görsel üstünde başlık ve buton) + üçlü güven şeridi |
| Kategoriler | 5×2 ortalı ızgara | Başlıkta fotoğraflı şerit + 3 sütunlu ızgara |
| Katalog filtresi | Sürekli açık kenar çubuğu | Katlanır "Filtrele" — ürünler ilk ekranda |
| Gezinme | Başlık ve alt bilgi | Altta sabit sekme çubuğu (Ana sayfa · Kategoriler · Sepetim · Hesabım) |
| Ürün ızgarası | 4–6 sütun | 2 sütun |

Kemerin kubbesi de telefonda alçalır (`--arch-top` 7rem → 3.75rem); küçük
kategori karosunda tam kubbe fotoğrafın yarısını yiyordu.

**İkinci imza: hediye notu.** El yazısı kart müşteri ödemesinde, satıcı sipariş
detayında, kurye ekranında ve sipariş takibinde aynı biçimde görünür — dört rolü
birbirine bağlayan tek nesne.

**Bölüm başlığı tek ölçektir** (`.section-title`, `clamp(1.3rem, 2.6vw, 1.75rem)`).
Bodoni yüksek kontrastlı bir didone; 18 px'te tırnakları dağıldığı için alt sınır
21 px. Panel kartlarının 15 px'lik başlıkları bu ölçeğe dahil değil — orası yoğun
arayüz, gövde yüzünde kalır.

**Yükleniyor durumu boş ekran değildir.** Her rota ailesinin `loading.tsx`'i
gelecek düzenin iskeletini çizer (katalogda kenar çubuğu + kare ızgara, ürün
detayında kare görsel + bilgi sütunu, panellerde ölçüt kartları + tablo). Böylece
sayfa oturduğunda hiçbir şey yerinden zıplamaz. Parıltı `.skeleton` sınıfında,
`prefers-reduced-motion` altında durur.

**Puan seed'den gelir, uydurulmaz.** `Product.rating` ve `reviewCount` alanları
kartta ve ürün detayında gösterilir. Yıldız dolu çizilir ve `gold` tonundadır —
palette kadife sarısı zaten yalnızca kıtlık ve puan için ayrılmıştır.

**Kampanya alanı gerçek kurala dayanır.** Uydurma indirim yok: band, ücretsiz
teslimat eşiğini duyurur ve rakamı `pricing.ts`'ten alır. Ana sayfada kategoriler
ile öne çıkanlar arasında durur.

**Vitrin üçlemesi ve kampanya fotoğrafı elle seçilir** (`HERO_SLUGS`,
`CAMPAIGN_SLUG`). Sıralamaya bırakıldığında en büyük kemerde bir saksı bitkisi
durabiliyordu; oysa sayfanın ilk görülen yeri orası. Ürün yayından kalkarsa öne
çıkanlardan tamamlanır.

---

## Verilen kararlar

Küçük kararlar demo'nun amacına göre verildi; önemli olanlar:

- **Çok satıcılı sipariş durumu kalemlerden türetilir.** Siparişin durumunu en
  geride kalan kalem belirler: iki çiçekçili bir siparişte biri hazırlamayı
  bitirse bile sipariş, diğeri de bitirene kadar "Hazırlanıyor" kalır.
  **Ek ürünler (çikolata, balon) bu hesaba girmez** — çiçekle aynı pakete
  konduğu için paketi hazırlayan bayiyle birlikte ilerlerler.
- **Satıcı ürüne dokunamaz, yalnızca stoğunu kapatır** (müşteri isteği, 21 Ağu
  2026). Ürün adı, fiyatı, görseli, galerisi ve indirimi operasyon ekibindedir;
  böylece vitrindeki fiyat tek elden kontrol edilir. Bayi kendi panelinde
  sorumlusunun adını ve numarasını görür.
- **Teslimat bölgesi seçimi zorunlu değildir.** Seçilmezse katalog daralmaz;
  seçilince yalnızca o mahalleye gönderilebilen ürünler listelenir ve ödeme
  adımında hizmet vermeyen mağaza adıyla birlikte uyarı verir. Onay bekleyen
  bayinin şehri (Bursa, Antalya) bilinçli olarak **kapalı** görünür — admin o
  bayiyi onayladığında şehir açılır.
- **Komisyon kalem bazında ve sipariş anındaki oranla** yazılır. Admin bir
  satıcının oranını sonradan değiştirirse geçmiş siparişler etkilenmez.
- **Kurye siparişe atanır, kaleme değil.** Çok satıcılı siparişte kurye, birden
  fazla alım noktasını sırayla toplar; teslimat detayında hepsi listelenir.
- **Stok, ödeme onaylanınca düşer** — sipariş oluşturulduğunda değil.
- **Ödeme başarısız senaryosu sipariş kaybettirmez.** Sipariş "Beklemede"
  kalır, kart ekranından tekrar denenebilir. İkisi de sunumda gösterilebilir.
- **Teslimat ücreti** 79,90 TL, 1.000 TL üzeri sepette ücretsiz.
- **Sipariş numarası** `CS-YYYY-NNNN` biçiminde; demoda verilen yeni sipariş,
  seed'den gelen siparişlerle aynı seriden devam eder.
- **Mobil önizleme ayrı bir uygulama değil**, müşteri arayüzünün telefon
  genişliğinde çalışan hâli. Çerçevenin içinde demo şeridi gizlenir ki ekran
  "uygulama" gibi görünsün. Sayfada bunun bir önizleme olduğu not edilir.
- **Sepet çerezde tutulur**; seed yeniden çalıştığında tarayıcıda kalan eski
  sepet sessizce boşalır, rozette hayalet sayı bırakmaz. Teslimat bölgesi de
  aynı şekilde çerezdedir.
- **İndirim bir zaman aralığıdır.** İndirimli fiyat yalnızca aralık içinde
  geçerlidir; aralık başlamadıysa panelde "planlandı" görünür, bitince fiyat
  kendiliğinden liste fiyatına döner. Sepete giren tutar da bu hesaptan gelir.
- **Dosya yükleme demo ölçeğindedir.** Hazırlık fotoğrafı tarayıcıda 900 px'e
  küçültülüp veritabanında saklanır (sunucuda görsel işleme yok — Render free
  plan 512 MB). Faturada PDF'in kendisi saklanmaz; adı, türü, boyutu kaydedilir,
  görsel yüklenirse küçültülmüş önizlemesi tutulur. Gerçek sistemde burada bir
  nesne deposu (S3/Blob) olur.

---

## Kapsam dışı

Bilinçli olarak yapılmadı: gerçek ödeme entegrasyonu (iyzico/PayTR), kargo
API'si, e-fatura, SMS/e-posta gönderimi (ödeme hatırlatması yalnızca kayda
geçer), gerçek kimlik doğrulama ve şifre saklama, KVKK/yasal metinler, çok
dillilik, erişilebilirlik denetimi, **gerçek dosya deposu**, Docker/CI/CD/
deployment, test suite, canlı GPS takibi ve ayrı bir React Native uygulaması.

Kod okunabilir ve modüler tutuldu; bu demo gerçek projenin başlangıç noktası
olarak kullanılabilir.
