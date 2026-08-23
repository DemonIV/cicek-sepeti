# Müşteri İstekleri — 21 Ağustos 2026

> Kaynak: müşteri tarafından 4 sayfalık liste hâlinde iletilen 25 madde.
> Bu dosya çalışma listesidir. Devir notları `OTURUM-NOTLARI.md`'de,
> teslim dokümanı `README.md`'de.

**Durum: 24 / 24 tamamlandı** (11. madde müşteri isteğiyle iptal edildi, 10. madde
süreç notu — kod işi değil).

> **Ek istek — 23 Ağustos 2026:** bayi kendi panelinden mağazasına ürün
> ekleyebilsin, ürün admin onayından geçsin. Uygulandı; §G'ye bakın.

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
| 19 | Bayilere **gün bazlı ve sipariş bazlı kota** | [x] | `Seller.dailyQuota` (bir günde en fazla teslimat) ve `activeQuota` (aynı anda açık sipariş). Admin künyeden ayarlar; bayi panosunda kullanım çubuklarıyla görünür. |
| 20 | **3 admin kendi ismiyle girsin**, kim neyi değiştirmiş görünsün | [x] | Üç admin hesabı (Nazlı Öztürk · Operasyon, Kerem Balcı · Bayi İlişkileri, Sibel Aksu · Finans) rol değiştiricide. Yetki değiştiren her admin eylemi `AuditLog`'a yazılır; `/admin/kayitlar` ekranında kişiye göre filtrelenir. |

## G. Bayiden ürün başvurusu (23 Ağustos 2026)

| # | İstek | Durum | Nasıl uygulandı |
| --- | --- | --- | --- |
| 26 | Satıcı kendi panelinden mağazasına **ürün ekleyebilsin**, ürün **admin onayından geçsin** | [x] | Yeni `ProductRequest` modeli. Bayi `/satici/urunler/basvuru` ekranından ürünü tanımlar (ad, kategori, fiyat, stok, açıklama, ana görsel + ek görseller, video, operasyona not) ve **Onaya gönder** der; kayıt vitrinde görünmez. Operasyon `/admin/urunler/basvurular` ekranında **Onayla ve yayına al** (ürün galerisiyle oluşur, vitrine çıkar) veya **Reddet** (sebep zorunlu alan olarak istenir, bayi görür) der. Bayi bekleyen başvurusunu geri çekebilir; ürün listesinin altındaki "Başvurularım" bölümünde durumu takip eder. Her karar denetim izine yazılır. |

**4. madde ile ilişkisi:** madde 4 korundu — bayi **mevcut** ürünün bilgisini
hâlâ değiştiremez, silemez; tek doğrudan yetkisi stok kapatma. Yeni ürün ise
bayiden gelebiliyor ama yayına çıkma kararı operasyonda. Onaydan sonraki her
düzenleme yine `/admin/urunler/[id]` üzerinden yapılır.

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
- **22 / 1 / 2** — dosya yükleme demo için tarayıcıda küçültülüp veritabanında
  saklanıyor; gerçek sistemde nesne deposu (S3/Blob) gerekir. Faturada PDF için
  yalnızca dosya bilgisi tutulur.
