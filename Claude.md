# Claude Code Prompt — Çiçek Marketplace Demo

---

Çok satıcılı bir çiçek & hediye e-ticaret platformunun **çalışan demo prototipini** sıfırdan geliştir. Bu demo, potansiyel bir müşteriye sunum yapmak için kullanılacak — yani gerçekçi görünmeli, tıklanabilir olmalı ve platformun tüm rollerini uçtan uca gösterebilmeli. Production sistemi değil.

## 1. Demo'nun Amacı

Müşteriye 10 dakikalık bir sunumda şunu göstermek: "İşte platformunuz böyle çalışacak." Müşteri ekranları gezecek, ürün seçip sipariş verecek, satıcı panelinde o siparişin düştüğünü görecek, kuryenin teslim ettiğini işaretleyecek, admin panelinde raporu görecek. Bu döngü kusursuz çalışmalı.

## 2. Kapsam Dışı (BUNLARI YAPMA)

Demo hızlı ve kırılgan olmayan bir şey olmalı. Aşağıdakiler **kesinlikle kapsam dışı**:

- Gerçek ödeme entegrasyonu (iyzico/PayTR) → **sahte/mock ödeme ekranı** yeterli
- Gerçek kargo API'si, e-fatura, SMS/e-posta gönderimi → hepsi mock
- Gerçek kimlik doğrulama, şifre hash'leme, oturum güvenliği → basit mock auth yeterli
- KVKK/yasal metinler, çok dillilik, erişilebilirlik denetimi
- Docker, CI/CD, deployment, ölçekleme, test suite
- Gerçek dosya yükleme (görseller placeholder/URL olsun)

Bunlara zaman harcama. Demo'nun değeri **görünen akışta**, altyapıda değil.

## 3. Teknoloji Yığını

- **Next.js (App Router) + TypeScript**
- **Tailwind CSS**
- **Prisma + SQLite** (tek dosya DB, kurulum derdi yok)
- Tek repo, tek komutla ayağa kalksın: `npm install && npx prisma migrate dev && npm run seed && npm run dev`
- Harici servis, API anahtarı, hesap açma gerektirmesin. `git clone` → `npm install` → çalışıyor olmalı.

## 4. Roller ve Demo Erişimi

Dört rol var: **Müşteri, Satıcı, Kurye, Admin.**

**Kritik demo özelliği:** Sağ üstte kalıcı bir **"Rol Değiştir"** menüsü olsun. Sunum sırasında login/logout ile uğraşmadan roller arası anında geçilebilsin. Her rol için önceden seed edilmiş bir hesap seçilir, uygulama o rolün görünümüne geçer. (Gerçek sistemde ayrı girişler olacağını bir not olarak belirt, ama demo'da bu switcher olsun.)

## 5. Veri Modeli

Prisma şeması şu varlıkları içersin (alanları makul şekilde sen tamamla):

- `User` — id, ad, e-posta, rol (CUSTOMER | SELLER | COURIER | ADMIN)
- `Seller` — kullanıcıya bağlı; mağaza adı, şehir, onay durumu (PENDING | APPROVED | REJECTED), komisyon oranı
- `Category` — ad, slug
- `Product` — satıcıya ve kategoriye bağlı; ad, açıklama, fiyat, stok, görsel URL, aktif mi
- `Order` — müşteriye bağlı; sipariş no, toplam tutar, durum, teslimat adresi, alıcı adı/telefonu, hediye notu, oluşturma tarihi
- `OrderItem` — siparişe ve ürüne bağlı; adet, birim fiyat, satıcı referansı (çok satıcılı sipariş için kritik)
- `Delivery` — siparişe bağlı; atanan kurye, durum, teslim zamanı

**Sipariş durumu akışı:** `BEKLEMEDE → ONAYLANDI → HAZIRLANIYOR → YOLDA → TESLIM_EDILDI` (+ `IPTAL`). Durum geçişlerini tek bir yerde tanımla, her panelde aynı mantık kullanılsın.

**Çok satıcılı mantık:** Bir sipariş birden fazla satıcının ürününü içerebilir. Satıcı panelinde her satıcı **yalnızca kendi kalemlerini** görür. Komisyon hesabı basit tutulsun: satıcı kazancı = kalem tutarı − (kalem tutarı × komisyon oranı).

## 6. Ekranlar

### Müşteri (web)
- Ana sayfa: öne çıkan ürünler, kategoriler, kampanya alanı
- Kategori/listeleme: filtre (fiyat, kategori, satıcı), sıralama
- Ürün detay: görsel, açıklama, satıcı bilgisi, sepete ekle
- Sepet
- Checkout: teslimat adresi, alıcı bilgisi, **hediye notu alanı** (çiçek sektörü için ayırt edici), teslimat tarihi seçimi
- Sahte ödeme ekranı: kart formu + "3D Secure" simülasyonu → başarılı/başarısız seçilebilsin (ikisini de göstermek demo'da işe yarar)
- Sipariş onayı + sipariş takip sayfası (durum çubuğu ile)
- Hesabım: sipariş geçmişi, adresler

### Satıcı paneli (web, responsive)
- Dashboard: bugünkü sipariş sayısı, bekleyen sipariş, toplam kazanç, düşük stok uyarısı
- Ürünlerim: liste, ekle/düzenle/sil, stok güncelleme
- Siparişlerim: sadece kendi kalemleri; durum güncelleme (Hazırlanıyor → Yolda)
- Kazançlarım: komisyon düşülmüş kazanç tablosu

### Kurye paneli (web, responsive)
- Atanan teslimatlar listesi (adres, alıcı, telefon)
- Teslimat detay → "Teslim Edildi" onayı
- Tamamlanan teslimatlar geçmişi
- (Canlı GPS **yok** — sadece liste ve durum onayı)

### Admin paneli (web)
- Dashboard: toplam ciro, sipariş sayısı, aktif satıcı, basit grafik (son 7 gün siparişleri)
- Satıcı başvuruları: onayla/reddet
- Satıcı yönetimi: liste, komisyon oranı düzenleme
- Tüm siparişler: filtreleme, durum görüntüleme, kurye atama
- Ürün yönetimi: tüm satıcıların ürünleri, yayından kaldırma

### Mobil görünüm (demo hilesi)
Ayrı bir React Native uygulaması **yapma** — demo için gereksiz. Bunun yerine `/mobil-onizleme` adında bir sayfa oluştur: müşteri arayüzünü bir **telefon çerçevesi** içinde (iPhone mockup görünümü) responsive olarak göster. Sunumda "mobil uygulama bu akışı native olarak taşıyacak" denebilsin. Sayfada bunun bir önizleme olduğunu belirten küçük bir not olsun.

## 7. Seed Verisi (Gerçekçi Olsun — Demo'nun Yarısı Bu)

Lorem ipsum kullanma. Türkçe, sektöre uygun, inandırıcı veri üret:

- **6 satıcı:** gerçekçi çiçekçi isimleri, farklı şehirler (İstanbul, Ankara, İzmir, Kayseri, Bursa, Antalya), 1-2 tanesi onay bekleyen durumda
- **8-10 kategori:** Buketler, Güller, Orkideler, Kutuda Çiçek, Teraryum, Saksı Çiçekleri, Çelenk, Hediye Setleri, Doğum Günü, Yeni Bebek
- **50-60 ürün:** gerçekçi Türkçe isimler ("11 Kırmızı Gül Buketi", "Beyaz Orkide Ferforje"), makul fiyatlar (250–4.500 TL aralığı), çeşitli stok seviyeleri, birkaç ürün stokta az
- **Görseller:** telifsiz placeholder servisi veya Unsplash çiçek URL'leri kullan; her ürünün görseli olsun, kırık görsel kalmasın
- **12-15 müşteri**, **3 kurye**
- **30-40 sipariş:** farklı durumlarda dağılmış (bazıları teslim edilmiş, bazıları yolda, bazıları yeni), son 30 güne yayılmış tarihlerle — böylece admin grafiği ve raporlar dolu görünür
- Bazı siparişler **birden fazla satıcının ürününü** içersin (çok satıcılı mantığı göstermek için kritik)

Seed komutu tekrar çalıştırıldığında veriyi sıfırlayıp yeniden kursun (`npm run seed`).

## 8. Tasarım Yönü

Bu demo'nun ikna ediciliği görselliğine bağlı. Şablon görünümlü, jenerik bir admin template havası **olmasın.**

- Çiçek sektörüne uygun, sıcak ama modern bir kimlik kur. Renk paletini ve tipografiyi bilinçli seç ve `globals.css`'te token olarak tanımla.
- **Kaçınılacak klişeler:** krem arka plan + terracotta aksan kombinasyonu, her yerde aynı görünen gradient kartlar, gereksiz emoji, aşırı yuvarlatılmış "bootstrap" havası.
- Ürün görselleri kahraman öğe — katalog ve ürün detayında görsele alan tanı, kartlar kalabalık olmasın.
- Panellerde (satıcı/kurye/admin) süs değil **verimlilik**: net tablolar, okunur durum rozetleri, filtre/arama, yoğunluğu yüksek ama nefes alan düzen.
- Müşteri tarafı ile panel tarafı aynı tasarım sistemini paylaşsın (ortak buton, input, kart, rozet bileşenleri) ama panel daha yoğun/işlevsel olsun.
- Boş durum, hata durumu ve yükleniyor durumlarını atlama — demo sırasında biri boş bir listeye tıklarsa orada düzgün bir mesaj olmalı.
- Tüm arayüz metinleri **Türkçe** ve doğal olsun. "Submit" değil "Siparişi tamamla".
- Mobil responsive çalışsın (sunum tablet/telefondan da açılabilir).

## 9. Demo Senaryosu (Bu Akış Kusursuz Çalışmalı)

Aşağıdaki tıklama yolu, sunumun bel kemiği. Bittiğinde bunu baştan sona test et:

1. Müşteri ana sayfaya girer → kategoriden ürün seçer → sepete ekler
2. Farklı bir **satıcının** ürününü de sepete ekler (çok satıcılı olduğunu göstermek için)
3. Checkout → adres + alıcı + hediye notu → sahte ödeme → başarılı
4. Sipariş takip sayfasında durumu görür
5. **Rol değiştir → Satıcı:** yeni sipariş satıcı panelinde görünür; satıcı "Hazırlanıyor" yapar
6. **Rol değiştir → Admin:** admin siparişi görür, bir kurye atar
7. **Rol değiştir → Kurye:** kurye teslimatı görür, "Teslim Edildi" işaretler
8. **Rol değiştir → Müşteri:** sipariş takibinde durum "Teslim Edildi" görünür
9. **Admin dashboard:** ciro ve grafik güncellenmiş

Bu 9 adımda hiçbir yerde hata, boş ekran veya kırık link olmasın.

## 10. Geliştirme Sırası

Şu sırayla ilerle, her adımda çalışır durumda kal:

1. Proje kurulumu, Tailwind, tasarım tokenları, ortak bileşenler (buton, input, kart, rozet, tablo)
2. Prisma şeması + migration + seed scripti
3. Mock auth + rol değiştirici + layout/navigasyon iskeleti
4. Müşteri akışı (katalog → sepet → checkout → sahte ödeme → takip)
5. Satıcı paneli
6. Admin paneli
7. Kurye paneli
8. Mobil önizleme sayfası
9. Demo senaryosunu baştan sona test et, boş/hata durumlarını doldur, cilala

## 11. Teslim

- Kök dizinde `README.md`: tek komutla kurulum, demo hesapları, demo senaryosu adımları (§9), ve "bu bir demodur, production değildir" notu
- Kod okunabilir ve modüler olsun — bu demo ileride gerçek projenin başlangıç noktası olabilir
- İş mantığı (sipariş durumu, komisyon hesabı, yetki kontrolü) tek bir yerde toplansın, ekranlara dağılmasın

Belirsiz kalan küçük kararları bana sormadan, demo'nun amacına en uygun şekilde kendin ver ve README'de not düş. Büyük bir mimari sapma gerekiyorsa önce sor.