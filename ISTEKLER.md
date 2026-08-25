# Müşteri İstekleri — 21 Ağustos 2026

> Kaynak: müşteri tarafından 4 sayfalık liste hâlinde iletilen 25 madde.
> Bu dosya çalışma listesidir. Devir notları `OTURUM-NOTLARI.md`'de,
> teslim dokümanı `README.md`'de.

**Durum: 24 / 24 tamamlandı** (11. madde müşteri isteğiyle iptal edildi, 10. madde
süreç notu — kod işi değil).

> **Ek istekler — 23 Ağustos 2026:** (1) bayi kendi panelinden mağazasına ürün
> ekleyebilsin, ürün admin onayından geçsin — §G. (2) Müşteri ürünlere bakmadan
> önce adres seçsin, katalog o bölgeye göre gelsin — §H. (3) Çiçek Sepeti
> incelemesinden gelen dört ekleme — §I. Hepsi uygulandı.
>
> **İnceleme — 25 Ağustos 2026:** proje istek listesiyle karşılaştırıldı; eksik
> kalan ya da listede olmayan altı madde §J'de.

---

## A. Finans ve fatura

| # | İstek | Durum | Nasıl uygulandı |
| --- | --- | --- | --- |
| 1 | **Admin paneli:** finansal hizmetler ve raporlar; fatura yüklemeleri | [x] | Yeni ekran `/admin/finans`: ciro / komisyon / hakediş kartları, haftalık ciro raporu, bayi bazlı hakediş tablosu, fatura yüklemeleri (onayla / reddet + önizleme) ve yarım kalan ödemeler. |
| 2 | **Satıcı paneli:** fatura yönetimi — satıcı faturasını yükleyebilsin | [x] | Yeni ekran `/satici/faturalar`: dönem + fatura no + tutar + dosya ile yükleme, yüklenen faturaların durumu (İnceleniyor / Onaylandı / Reddedildi + ret sebebi). |

## B. Satıcı paneli

| # | İstek | Durum | Nasıl uygulandı |
| --- | --- | --- | --- |
| 3 | Sipariş bölümüne **tarih**; sistem günü otomatik algılayıp o günü göstersin | [x] | `/satici/siparisler` artık **teslimat tarihine** göre çalışıyor ve **bugünle açılıyor** ("Bugün · 21 Ağustos 2026 Cuma"). Şerit: Bugün (n) · Yarın (n) · 7 gün · Tümü + takvimden tarih seçme. Tabloya "Teslimat" sütunu eklendi. |
| 4 | Satıcı **ürün değiştiremesin**, yalnızca **stoğu kapatabilsin** | [x] | Ürün ekleme/düzenleme/silme satıcıdan alındı, admin paneline taşındı (`/admin/urunler/…`). Satıcının ürün listesi okunur; satır başına tek düğme: **Stoğu kapat / aç**. Kapalı ürün vitrinde "satışa kapalı" görünür, sepete eklenemez. |
| 21 | Satıcı **sorumlu kişinin adını ve numarasını** görsün | [x] | `Seller.accountManagerId` → admin kullanıcısı. Satıcı panosunda "Sorumlun" kartı (ad, unvan, tıklanabilir telefon); ürün listesinde de aynı kişiye yönlendirme. Admin, bayi künyesinden sorumluyu değiştirir. |

## C. Tipografi ve arayüz düzeni

| # | İstek | Durum | Nasıl uygulandı |
| --- | --- | --- | --- |
| 5 | Başlık fontu daha basit ve okunur olsun | [x] | Başlık yüzü **Bodoni Moda → Outfit** (geometrik sans, 600 ağırlık). Bodoni yalnızca **hediye notu** kartında kaldı (`--font-note`); gövde Manrope. |
| 7 | Ana sayfa **bannerları yuvarlak** | [x] | `--radius-banner` (1.75rem) ve `--radius-banner-sm` token'ları; telefon afişi, kampanya bandı, haftanın ürünü bandı ve "nasıl çalışır" bloğu yuvarlatıldı. Ürün kartları dik kalır — ikisi karışmasın. |
| 8 | **Logo solda — arama ortada — sepet/hesabım sağda** | [x] | Başlık `auto / 1fr / auto` ızgarasına geçti; arama hap formunda ortada. Telefonda marka solda, sepet sağda, arama kendi satırında yapışkan. |
| 9 | Üst boşluğa **Premium · Hediye · Balon** tarzı kategoriler | [x] | Başlığın üstüne koyu **koleksiyon şeridi**: Premium · Hediye · Balon · Pasta · Çikolata · İndirimdekiler. Koleksiyonlar `src/lib/collections.ts` içinde birer sorgu parçası; telefonda hap şeridi olarak görünür. |
| 25 | Ana sayfadaki ürün görselleri **Çiçek Sepeti ile aynı görünüm** | [x] | Ürün kartı yeniden kuruldu: yuvarlatılmış tam kare fotoğraf, sol üstte **%indirim rozeti**, sağ üstte "ek ürün" etiketi, altta satıcı → ad → puan → fiyat (indirimliyse üstü çizili liste fiyatı). |

## D. Sipariş akışı ve müşteri deneyimi

| # | İstek | Durum | Nasıl uygulandı |
| --- | --- | --- | --- |
| 6 | Siparişlerde **ek ürün** tarafı | [x] | Yeni tedarikçi **Hediye Deposu** ve 9 ek ürün (çikolata, balon, pasta, vazo, kart, oyuncak). Ürün sayfasında "Yanında ne gitsin?", sepette "Siparişine ek ürün ekle". Ek ürün ayrı satıcıdan geldiği için sipariş doğal olarak çok satıcılı olur; `OrderItem.isAddOn` ile panellerde ayrı gösterilir. |
| 11 | ~~Platformdaki çiçekler görünmesin~~ | **İPTAL** | 21 Ağu 2026: müşteri "bu maddeyi es geçelim, yanlış olmuş" dedi. |
| 12 | Müşteri **nereye göndereceğini seçsin**; şehir + mahalle | [x] | 55 mahallelik bölge ağacı. Başlıkta bölge düğmesi → `/teslimat-bolgesi`; seçim çerezde tutulur ve **katalog o bölgeye gönderilebilenlere daralır**. Ödeme adımında şehir → ilçe → mahalle zinciri; sepetteki bir mağaza o mahalleye hizmet vermiyorsa sipariş adıyla birlikte engellenir. |
| 13 | Kart notuna **gönderici ismi kutucuğu**, istenmezse kapansın | [x] | Hediye notu alanına "Kartın altına gönderici ismi yazılsın" kutucuğu; işaretlenince müşterinin adıyla dolar ve kartta imza önizlemesi çıkar. İşaretlenmezse `Order.senderName` boş kalır, dört rolde de kart imzasız görünür. |
| 14 | **Ödeme hatırlatma** butonu | [x] | `/admin/finans` → "Yarım kalan ödemeler": müşteri, tutar, kaç kez hatırlatıldığı ve **Ödeme hatırlat** düğmesi. Hatırlatma sipariş geçmişine ve denetim izine yazılır; müşteri takip ekranında "Ödemeyi tamamla" bandını görür. |
| 22 | Sipariş hazırlandığında **onay görseli** | [x] | Satıcı sipariş detayında "Hazırlık onay görseli": telefonda doğrudan kamera açılır, fotoğraf tarayıcıda 900 px'e küçültülüp kaydedilir. Müşteri takip ekranında "Çiçekçinden hazırlık görseli" olarak görür. |
| 23 | Ürünlere **en az 3 fotoğraf + video** | [x] | `ProductMedia` tablosu ve ürün galerisi (küçük görsel şeridi + aynı çerçevede oynayan video). Her üründe en az 3 kare; 4 üründe `public/video/` altındaki tanıtım videosu — dışarıya bağımlılık yok. |
| 24 | **Haftanın ürünü**, **indirimli ürün**, indirim zamanı | [x] | `discountPrice` + `discountStartsAt/EndsAt` + `isWeeklyPick`. Ana sayfada geniş "Haftanın ürünü" bandı (geri sayımlı) ve "İndirimdekiler" satırı. Fiyat hesabı tek yerde: `src/lib/discount.ts`. Admin ürün formunda indirim aralığı girilir; aralık dışında fiyat kendiliğinden liste fiyatına döner. |

## E. Satıcı yönetimi (admin tarafı)

| # | İstek | Durum | Nasıl uygulandı |
| --- | --- | --- | --- |
| 15 | **Bayi ↔ mahalle eşleşmesi** | [x] | Bayi künyesinde (`/admin/saticilar/[id]`) şehir → ilçe → mahalle ızgarası; mahalle tek tıkla açılır/kapanır, "İlçenin tamamını aç" kısayolu var. Kapalı mahalleye o bayinin ürünü gönderilemez. |
| 16 | Bayinin **sipariş alımını durdurabilme** | [x] | Künyede "Sipariş alımını durdur" (sebep yazılabilir). Kapalıyken ürünler vitrinde görünür ama sepete eklenemez; bayi kendi panosunda kırmızı uyarıyı ve sebebi görür. |
| 17 | Bayilere **puan sistemi** (gecikme → −5) | [x] | `Seller.score` 100'den başlar, `SellerScoreEvent` her hareketi tutar. "Gecikmeleri tara" düğmesi teslim tarihi geçmiş siparişleri bulup otomatik −5 yazar (aynı sipariş iki kez cezalandırılmaz). Elle düzeltme de var. Puan hem admin künyesinde hem satıcı panosunda görünür. |
| 18 | Sipariş **arabaya verildikten sonra** kuryeye düşsün | [x] | Satıcının "Yola çıkar" düğmesi **"Arabaya verildi"** oldu; `Delivery.dispatchedAt` işaretlenir. Kurye ekranı ikiye ayrıldı: **İşlem gören teslimatlar** (arabaya verilmiş) ve **Çiçekçi hazırlığında** (henüz verilmemiş). |
| 19 | Bayilere **gün bazlı ve sipariş bazlı kota** | [x] | `Seller.dailyQuota` (bir günde en fazla teslimat) ve `activeQuota` (aynı anda açık sipariş). Admin künyeden ayarlar; bayi panosunda kullanım çubuklarıyla görünür. **Kota ödeme adımında uygulanır** (25 Ağu 2026): dolu bayinin ürünü seçilen güne sipariş edilemez, müşteri mağaza adıyla ve sayıyla uyarılır. Sayımın tanımı `src/lib/seller-quota.ts` içinde tek yerde. |
| 20 | **3 admin kendi ismiyle girsin**, kim neyi değiştirmiş görünsün | [x] | Üç admin hesabı (Nazlı Öztürk · Operasyon Müdürü, Kerem Balcı · Bayi İlişkileri Uzmanı, Sibel Aksu · Finans Sorumlusu) rol değiştiricide. Yetki değiştiren her admin eylemi `AuditLog`'a yazılır; `/admin/kayitlar` ekranında kişiye göre filtrelenir. 25 Ağu 2026: panel başlığı ve rol değiştirici **herkesin kendi unvanını** gösterir (önce üçünde de "Operasyon" yazıyordu). |

## G. Bayiden ürün başvurusu (23 Ağustos 2026)

| # | İstek | Durum | Nasıl uygulandı |
| --- | --- | --- | --- |
| 26 | Satıcı kendi panelinden mağazasına **ürün ekleyebilsin**, ürün **admin onayından geçsin** | [x] | Yeni `ProductRequest` modeli. Bayi `/satici/urunler/basvuru` ekranından ürünü tanımlar (ad, kategori, fiyat, stok, açıklama, ana görsel + ek görseller, video, operasyona not) ve **Onaya gönder** der; kayıt vitrinde görünmez. Operasyon `/admin/urunler/basvurular` ekranında **Onayla ve yayına al** (ürün galerisiyle oluşur, vitrine çıkar) veya **Reddet** (sebep zorunlu alan olarak istenir, bayi görür) der. Bayi bekleyen başvurusunu geri çekebilir; ürün listesinin altındaki "Başvurularım" bölümünde durumu takip eder. Her karar denetim izine yazılır. |

**4. madde ile ilişkisi:** madde 4 korundu — bayi **mevcut** ürünün bilgisini
hâlâ değiştiremez, silemez; tek doğrudan yetkisi stok kapatma. Yeni ürün ise
bayiden gelebiliyor ama yayına çıkma kararı operasyonda. Onaydan sonraki her
düzenleme yine `/admin/urunler/[id]` üzerinden yapılır.

## H. Girişte adres seçimi (23 Ağustos 2026)

| # | İstek | Durum | Nasıl uygulandı |
| --- | --- | --- | --- |
| 27 | Kişi ürünlere bakmak istediğinde **göndereceği veya bulunduğu konumdaki** çiçekleri görsün — bunun için **adres istensin** (örnek görsel: "Siparişin Nereye Gönderilecek?" penceresi) | [x] | Vitrine girişte açılan **adres seçimi penceresi**: bilgi bandı, arama kutusu ve **Kayıtlı Adresler** listesi. Arama mahalle adının yanı sıra **okul, hastane, plaza, AVM, üniversite, otel, istasyon** adlarını da tarar (yeni `Landmark` tablosu, 67 nokta) — müşteri mahalleyi bilmese de "Acıbadem Altunizade Hastanesi" yazıp bölgeyi seçer. Kayıtlı adresler `Address.neighborhoodId` ile mahalleye bağlandı. Seçilen bölge katalogu daraltır; hizmet veren çiçekçisi olmayan nokta "kapalı" görünür ve seçilemez. Pencere başlıktaki bölge düğmesinden tekrar açılır. |

**Önceki 12. madde ile ilişkisi:** `/teslimat-bolgesi` sayfası (şehir → ilçe →
mahalle ızgarası) duruyor; pencereden "Tüm mahalleleri gör" ile açılıyor. Yeni
olan, girişte sorulması ve **noktadan** (okul/hastane/plaza) arama.

## I. Çiçek Sepeti incelemesi (23 Ağustos 2026)

Müşteri "çiçek sepetini incele, başka ne gibi bir şey olabilir" dedi. Gerçek
site gezildi (ana sayfa, kategori, ürün detay, gönderim amacı) ve demoda
karşılığı olmayan başlıklar çıkarıldı. Dördü uygulandı.

| # | İstek | Durum | Nasıl uygulandı |
| --- | --- | --- | --- |
| 28 | **Gönderim amacı** ekseni — "ne için gönderiliyor?" | [x] | `Occasion` + `ProductOccasion` modelleri, 12 amaç. Ana sayfada yuvarlak şerit, katalogda filtre, ürün sayfasında çipler. Etiketleri admin ürün formu yönetir; ürün başına en fazla 4 amaç. |
| 29 | **Ürün yorumları** | [x] | `Review` modeli (puan, metin, şehir, doğrulanmış alışveriş, satıcı cevabı, faydalı oyu, gizleme). Ürün sayfasında özet + dağılım + liste; `/satici/yorumlar` cevap yazma; `/admin/yorumlar` moderasyon. Ürün puanı **görünen** yorumlardan türetilir. |
| 30 | **Satıcı ol** — vitrinden başvuru | [x] | `/satici-ol` sayfası ve formu; kayıt `PENDING` mağaza olarak `/admin/basvurular` ekranına düşer. Başlıkta ve altbilgide bağlantı. Böylece "bu başvurular nereden geliyor?" boşluğu kapandı. |
| 31 | **Aynı gün teslimat** + ürün sayfasında gün/saat seçimi | [x] | `src/lib/delivery-time.ts`: kesim saati 18.00, gün çipleri (Bugün · Yarın · +2 · +3), o güne uygun saat aralıkları, geri sayım metni. Seçim çerezle ödeme adımına taşınır; ödeme eylemi de aynı kuralı doğrular. Katalog/ana sayfa kartlarında "Bugün teslim". |

### Aynı gün gelen iki düzeltme

| # | İstek | Durum | Nasıl uygulandı |
| --- | --- | --- | --- |
| 32 | Kategoriye basıldığında **adres formu gelsin**; ürünler o adrese yakın dükkanlardan olsun | [x] | Adres penceresi artık ürün listeleyen her yolda (`/kategori`, `/urunler`, `/magaza`, `/urun`) bölge seçili değilse kendiliğinden açılıyor — ilk girişteki "bir kez sor" kuralı bu sayfalarda geçerli değil. Ayrıca **kategori sayfası bölgeye göre daraltılmıyordu, düzeltildi**: artık yalnızca o mahalleye gönderim yapan çiçekçilerin ürünleri listeleniyor, başlıkta ve bantta bölge yazıyor, boş durumda "bölgeyi değiştir" çıkıyor. |
| 33 | Tarih kısmında Bugün/Yarın'dan sonra **takvim** olsun, ileri tarih seçilebilsin | [x] | Hazır çipler üçe indi (Bugün · Yarın · ertesi gün), dördüncü hücre **Takvim**. Takvimden 60 güne kadar ileri tarih seçilir; seçilen gün çiplerin arasına eklenir ve o gün için bütün saat aralıkları açık gelir. Seçim yine ödeme adımına taşınır. |

**Sırada bekleyen öneriler** (uygulanmadı, müşteri kararı bekliyor): favoriler
ve "X kişinin favorisi" sosyal kanıtı, özel gün hatırlatıcı, kupon/kampanya
kodu, kişiye özel (isim yazdırma, kart tasarımı), **bölge/tarih bazlı teslimat
ücreti kuralları** (bugün tek kural var: 79,90 TL, 1.000 TL üzeri ücretsiz —
rakamlar bizim varsayımımız, müşteri onayı bekliyor), kurumsal (B2B) toplu
gönderim.

> 25 Ağu 2026 düzeltmesi: bu listede "benzer ürün şeridi" de yazıyordu, oysa
> **zaten var** — ürün sayfasının altındaki "… kategorisinden" altılı şerit.
> Listeden çıkarıldı.

## J. İnceleme sonrası kapatılanlar (25 Ağustos 2026)

Müşteri "isteklerde olmayan bir şey var mı" diye baktırdı. Proje `ISTEKLER.md`
ile satır satır karşılaştırıldı; çıkan altı maddenin beşi kapatıldı, biri
müşteri kararına bırakıldı.

| # | Bulgu | Durum | Ne yapıldı |
| --- | --- | --- | --- |
| 34 | **Kurye teslim fotoğrafı** — bir ürün açıklaması "kurye teslimatında fotoğraf gönderilir" diyordu, `Delivery.proofPhotoUrl` alanı şemada duruyordu ama arayüzde karşılığı yoktu | [x] | Kurye teslimat detayında **"Teslim anı fotoğrafı"** kartı: telefonda doğrudan kamera açılır, kare 900 px'e küçültülüp kaydedilir, yanlış giderse kaldırılabilir. Müşteri takip ekranında **"Teslim anı"** kartı olarak kuryenin adı ve teslim saatiyle görünür. Zorunlu değil — kamerası olmayan bir makinede sunum tıkanmasın. Seed'de teslim edilmiş siparişlerin %70'inde dolu. Küçültme artık `src/lib/image-shrink.ts` içinde tek yerde (hazırlık görseli de oradan geçiyor). |
| 35 | **Kota (madde 19) uygulanmıyordu** — admin ayarlıyor, bayi panosunda çubuk görünüyordu ama ödeme adımında hiçbir kontrol yoktu | [x] | `src/lib/seller-quota.ts`: gün bazlı ve sipariş bazlı sayım tek yerde. Ödeme adımı mahalle kontrolüyle aynı dille engelliyor. İki engelin tavsiyesi ayrı: gün kotasında "başka bir gün seç", açık sipariş kotasında "mağaza teslimatlarını tamamlayınca". Bayi panosundaki çubuklar da artık aynı fonksiyondan besleniyor — iki yerde iki farklı sayım kalmadı. |
| 36 | **Admin unvanları** — üç admin de panelde "· Operasyon" görünüyordu (madde 20 eksik kalmış) | [x] | Panel başlığı ve rol değiştirici `User.title` okuyor: Operasyon Müdürü · Bayi İlişkileri Uzmanı · Finans Sorumlusu. |
| 37 | **Hediye notları ürünle ilgisizdi** — seed notu rastgele seçiyordu, "Başın sağ olsun" doğum günü siparişine düşebiliyordu | [x] | Her not artık uyduğu kategorileri taşıyor (`GIFT_NOTES[].fits`); not, siparişin ana kaleminin kategorisine göre seçiliyor, uyan yoksa sipariş notsuz kalıyor. Yeni bebek için ikinci bir not eklendi (dört siparişte de aynısı çıkıyordu). Başsağlığı notu yalnızca çelenkte. |
| 38 | **"Benzer ürün şeridi" bekleyen öneri sayılmıştı**, oysa çalışıyordu | [x] | Liste düzeltildi (§I sonu). |
| 39 | **Teslimat ücreti kuralı** (79,90 TL / 1.000 TL üzeri ücretsiz) müşteri onayı olmadan konmuştu ve aynı konu bekleyen öneri listesinde "yapılmamış" gibi duruyordu | **Karar bekliyor** | Kural yerinde bırakıldı, listede varsayım olduğu yazıldı. Müşteri rakamları ya onaylayacak ya da bölge/tarih bazlı kural isteyecek. |

**Kapsam dışı bırakılan tek kusur:** Hediye Setleri ve Doğum Günü
kategorilerinin ikisinde de pasta fotoğrafı var. 28 Temmuz'da kapsam dışı
bırakılmıştı, öyle kaldı.

---

## F. Süreç notu

| # | Not |
| --- | --- |
| 10 | Her istek için müşteri **örnek görsel** iletebilir. Belirsiz maddelerde görsel istenecek; 25. madde bu şekilde yorumlandı (tanıdık e-ticaret kartı kalıbı). |

---

## Verilen kararlar

- **11** — müşteri iptal etti (21 Ağu 2026).
- **5** — başlık fontu **Outfit**; gövde Manrope; hediye notunda Bodoni italik kaldı.
- **4** — "değişiklik yapılamayacak" ürün bilgisi olarak okundu: satıcı ürünü
  düzenleyemez/ekleyemez/silemez, yalnızca stoğu kapatır. Ürün yönetimi admin
  tarafına taşındı, böylece yetki tek yerde toplandı.
- **19** — iki kota tanımlandı: **gün bazlı** (bir günde en fazla teslimat) ve
  **sipariş bazlı** (aynı anda taşınabilecek açık sipariş).
- **6** — ek ürünler ayrı bir tedarikçiden (Hediye Deposu) geliyor; böylece hem
  "ek ürün" hem "çok satıcılı sipariş" tek akışta gösteriliyor. Ek ürünler
  siparişin durumunu geciktirmez, çiçekle aynı pakette ilerler.
- **12** — bölge seçimi **zorunlu değil**: seçilmezse katalog daralmaz, sunumu
  açan kişi boş ekranla karşılaşmaz. Seçilince katalog ve ödeme adımı daralır.
- **26** — başvuru onaylanınca ürün **doğrudan yayına** alınır (`isActive`),
  ayrıca "önce taslak" adımı konmadı: sunumda tek tıkla vitrinde görünmesi
  akışı anlaşılır kılıyor. Fiyat/indirim gibi vitrin kararları başvuru formunda
  yok — onlar operasyonun işi, ürün formunda kalıyor.
- **27** — adres seçimi **zorunlu değil**: "Şimdilik geç" pencereyi kapatır,
  bir daha kendiliğinden açılmaz (`cicek_demo_bolge_soruldu` çerezi) ve katalog
  daralmaz. Gerçek sistemde zorunlu tutulabilir; sunumu açan kişinin kapalı bir
  kapıyla karşılaşmaması için böyle bırakıldı. Görseldeki yeşil/mavi renkler
  yerine "Vitrin" paleti kullanıldı — düzen aynı, kimlik bizim.
- **28** — amaç etiketleri seed'de kategori havuzundan üretiliyor; ürün başına
  en fazla 4 amaç, yoksa filtre anlamını yitiriyor.
- **29** — yorum metinleri kategoriye bağlı (`only` alanı): "teraryum küçük ama
  şirin" yorumu gül buketinin altında görünmesin. Puan yorumlardan türetiliyor,
  elle girilmiyor.
- **31** — kesim saati **18.00** seçildi (gerçek sitede de büyük şehirlerde bu
  civarda). Saat aralığı, bitişine bir saatten az kaldıysa kapanıyor.
- **22 / 1 / 2** — dosya yükleme demo için tarayıcıda küçültülüp veritabanında
  saklanıyor; gerçek sistemde nesne deposu (S3/Blob) gerekir. Faturada PDF için
  yalnızca dosya bilgisi tutulur.
