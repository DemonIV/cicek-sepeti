# ciceksepeti.com navbar — saha notu (25 Ağustos 2026)

Kaynak: canlı site, `nav.header__navigation-desktop__parent` DOM'undan çıkarıldı.
Amaç: bizim `SiteHeader`'a uyarlamak — bizde olmayan kategorileri eklemek, düzeni benzetmek.

## 1. Başlık kaç katman?

Gerçek sitede **3 katman** var, bizimkiyle aynı sayıda ama içerikleri farklı:

| Katman | Onlarda | Bizde (şu an) |
|---|---|---|
| 1 (en üst, ince) | Sol: iki sekme rozeti (`çiçek` / `hediye & extra`) · Orta: kampanya metni · Sağ: Kurumsal Hediye, Yardım, Çiçeksepeti'nde Satış Yap | Koyu şerit: koleksiyonlar (Premium/Hediye/Balon/Pasta/Çikolata/İndirimdekiler) + Satıcı ol + bölge seçici |
| 2 (marka satırı) | Logo sol · arama ortada (yeşil buton) · sağda Favorilerim, Siparişlerim, Hesabım, Sepet | Logo sol · arama ortada · Hesabım, Sepet |
| 3 (**asıl kategori navbarı**) | **9 adet metin linki, hover'da açılır menülü** — ikon/foto YOK | Kategori şeridi: kemer fotoğraflı 11 kutucuk |

> **Kritik fark:** Onlarda 3. katman fotoğraflı değil, düz metin + dropdown.
> Fotoğraflı yuvarlak şerit onlarda **body'nin ilk elemanı** (Doğum Günü, Çok Satanlar,
> Yenilebilir Çiçekler, Gurme Lezzetler, Aynı Gün Hediye Seti, Trend Çiçekler, Yıl Dönümü,
> Geçmiş Olsun, İçimden Geldi, Hoş Geldin Bebek, Özür Çiçekleri, Lilyum & Zambak → oklu carousel).
> Yani: bizim fotoğraflı şerit = onların "hızlı erişim carousel"i; bizde **eksik olan**
> onların metin+dropdown navbarı.

## 2. Üst seviye 9 kategori (soldan sağa)

| # | Etiket | URL | Menü tipi |
|---|---|---|---|
| 1 | Çiçek | /d/cicek | **mega** (sol liste + sağ panel) |
| 2 | Yenilebilir Çiçek | /d/bonnyfood | düz (çok sütunlu liste) |
| 3 | Doğum Günü | /d/dogum-gunu-cicekleri | düz |
| 4 | Gönderim Amacı | /d/gonderim-amaci-cicek | düz |
| 5 | Orkide / Saksı Çiçekleri | /d/saksi-cicekleri | düz |
| 6 | Hediye | /d/hediye | düz (59 link, 5 sütun) |
| 7 | Hediye Setleri | /d/hediyelik-set | düz |
| 8 | Kişiye Özel | /d/kisiye-ozel-hediyelik | düz (44 link) |
| 9 | El Yapımı Hediye | /d/el-yapimi-urunler | düz |

## 3. Menü düzeni — iki kalıp

### A) Mega menü (yalnız "Çiçek")
- Tam genişlik beyaz panel, navbar'ın altına yapışık, hafif alt gölge.
- **Sol sütun (~140px):** "Tüm Ürünleri Gör ›" (link mavisi) + 13 alt kategori.
  Alt kırılımı olanların sağında `›` chevron. Aktif olanın sol kenarında ince dikey çizgi + kalın yazı.
- **Sağ panel:** aktif sol öğenin alt-altları; ilk satır yine "Tüm Ürünleri Gör ›",
  altında dikey akan liste (az öğede tek sütun, çokta çoklu sütun).
- Hover ile sol öğe değişince sağ panel değişir (DOM'da hepsi hazır, sadece `--active` sınıfı taşınıyor).

### B) Düz dropdown (diğer 8)
- Yine tam genişlik beyaz panel.
- Üstte "Tüm Ürünleri Gör ›", altında **5 sütuna bölünmüş, sütun-sütun akan düz liste**.
- Alt kırılım yok, tek seviye.
- Satır yüksekliği ~20px, 13px yazı, gri, hover'da koyulaşıyor.

## 4. Alt kategori listeleri (uyarlanacak ham veri)

### 1. Çiçek (mega — 13 dal)
1. **Çiçek Buketleri** → Karışık Buketler, Gül Buketleri, Papatya Buketi
2. **Saksı Çiçekleri** → Salon Çiçekleri, Orkide, Barış Çiçeği, Sukulent, Antoryum, Starliçe, Dağ Palmiyesi, Bonsai, Kaktüs, Deve Tabanı, Guzmanya, Zeytin Ağacı, Kalanchoe, Difenbahya, Şeflera, Haworthia
3. **Trend Çiçekler** → Saksı Bitkileri, Papatya & Gerbera, Güller, Kasımpatı
4. **Çiçek & Gurme Lezzetler** → (alt yok)
5. **Güller** → Kırmızı Gül, Gül Buketleri, Beyaz Gül, Vazoda Gül, Pembe Gül, Kutuda Güller, Saksıda Gül, Lila Gül, Çardak Güller, Turuncu Gül
6. **Orkide** → Beyaz Orkide, Mor Orkide, Ateş Orkide, Mini Orkide
7. **Vazoda Çiçek** → (alt yok)
8. **Lilyum & Zambak** → (alt yok)
9. **Çiçek & Hediye** → (alt yok)
10. **Çelenkler** → Düğün Çelenkleri, Ferforje Aranjmanlar, Cenaze Çelenkleri
11. **Kişiye Özel Çiçekler** → (alt yok)
12. **Kutuda Güller** → (alt yok)
13. **Renge Göre Çiçekler** → Karışık Renkli, Pembe, Mor, Beyaz, Sarı, Turuncu, Yeşil, Kırmızı Çiçekler

Sağ panelde ayrıca amaç bazlı iki grup daha akıyor:
Doğum Günü / İçimden Geldi / Geçmiş Olsun / Yeni Bebek / Sevgiliye / Yeni İş-Terfi /
Kek-Kurabiye / Özür Dilerim / Kişiye Özel / Yıl Dönümü / Gurme Lezzetler — ve —
Doğum Günü / Sevgiliye / Geçmiş Olsun / Trüf / Söz ve Nişan / Bebeğe / Anneye / Kız İsteme.

### 2. Yenilebilir Çiçek (22)
Kek & Kurabiye Buketi, Doğum Günü, Yenilebilir Çiçek Gurme, Gurme Lezzetler, Yeni İş/Terfi,
İçimden Geldi, Lotuslu Lezzetler, Yeni Bebek, Kitkatlı Lezzetler, Sevgiliye Özel Lezzetler,
Yıl Dönümü, Geçmiş Olsun, Trüf Gurme Lezzetler, Kişiye Özel, Özür Dilerim, Tebrik Ederim,
Arkadaşa, Kalpli Aranjmanlar, Anneye, Söz ve Nişan, Kız İsteme, Babaya

### 3. Doğum Günü (24)
Doğum Günü Çiçekleri, Doğum Günü Yenilebilir Çiçek, Doğum Günü Gurme Lezzetler,
Doğum Günü Hediyeleri, Kadına Hediye, Erkeğe Hediye, Aynı Gün Hediye Seti, Çocuğa Hediye,
Kişiye Özel, Saksı Çiçekleri, Anneye Hediye, Kişiye Özel Çiçekler, Lilyum, Ayıcık Buketi,
Fotoğraflı Ürünler, Takı & Aksesuar, Güller, Erkek Aksesuar, Papatya - Gerbera, Orkide,
Dini Hediyeler, Babaya Hediye, Kadın Saat, Saat ve Aksesuarları

### 4. Gönderim Amacı (15) — *bizde hiç yok, en değerli eksik*
Yeni İş/Terfi, Doğum Günü, Geçmiş Olsun, Yıl Dönümü, Yeni Doğan, İçimden Geldi,
Söz-Nişan-Düğün, Özür Dilerim, Tebrik, Sevgili, Açılış-Tören, Teşekkür, Evlilik Teklifi,
Cenaze, Kendim İçin

### 5. Orkide / Saksı Çiçekleri (16)
Orkide, Salon Çiçekleri, Sukulent, Barış Çiçeği, Antoryum, Bonsai, Starliçe, Dağ Palmiyesi,
Kaktüs, Kalanchoe, Deve Tabanı, Guzmanya, Zeytin Ağacı, Haworthia, Şeflera, Difenbahya

### 6. Hediye (59)
Kadına Hediye, El Yapımı Hediye, Doğum Günü, Erkeğe Hediye, Aynı Gün Teslim, Yeni Bebek,
Yeni İş/Terfi, Sevgiliye Hediye, Yıl Dönümü, Çocuğa Hediye, Aynı Gün Hediye Seti, İçimden Geldi,
Kişiye Özel, Dekoratif Ürünler, Anneye Hediye, Peluş Oyuncaklar, Kendin Tasarla, Özür Dilerim,
Nostaljik Hediyeler, Bebek Ürünleri, Ev Hediyesi, Hediye Kutusu, Erkek Aksesuarları,
Takı/Aksesuar, Parfüm, Ofis & Kırtasiye, Gurme Lezzetler, Fotoğraflı Ürünler, En Yeni Hediyeler,
Oyuncak, Kar Küresi, Müzik Kutusu, Kişiye Özel Telefon Kılıfı, Led Lamba, Kahve Fincanı,
Dini Hediyeler, Hediye Setleri, Ayıcık Buketi, Kupa Bardaklar, Magnet, Parfümlü Hediye Setleri,
Spotify Plak, Viski Bardağı-Taşı, Saat, Tablo, Astroloji Hediyeleri, Karikatürlü Ürünler,
Cüzdan, Rakı Bardağı, Babaya Hediye, Çerçeve, Kolye, Termos, Hobilere Özel, Çakmak, Puzzle,
Kitap, Kalem

### 7. Hediye Setleri (16)
Anneye, Aynı Gün, Kadınlara, Erkeklere, Sevgiliye, Doğum Günü, Kişiye Özel, Anne-Bebek,
Peluşlu, Nostaljik, Premium, Kahveli, Termoslu, Parfümlü, Kitaplı, Dini Temalı
(hepsi "… Hediye Setleri" biçiminde)

### 8. Kişiye Özel (44)
Fotoğraflı Ürünler, Kişiye Özel Çiçekler, Kendin Tasarla, Hediye Setleri, Ofis & Kırtasiye,
Dekoratif Ürünler, Takı-Saat-Aksesuar, Telefon Kılıfı, İsimlik, Kupa, Kar Küresi, Karikatür Biblo,
Ayıcık Buketi, Tablo, Bebek Ürünleri, Tişört, Kolye, Led Lamba, Tespih, Magnet, Termos,
Karikatürlü Ürünler, Viski Bardağı-Taşı, Çakmak, Peluş Oyuncak, Anahtarlık, Cüzdan, Spotify Plak,
Aksesuar, Yastık, Bileklik, Yüz Baskılı Bebek, Kol Saati, Spotify Aksesuarlar, Dini Hediyeler,
Hediye, Kalem, Defter, Ajanda, Rakı Bardağı, Yenilebilir Çiçek, Cep Saati, Kol Düğmesi

### 9. El Yapımı Hediye (16)
Kupa & Kahve Fincan Takımı, Ev Yaşam Ürünleri, El Yapımı Çanta, El Yapımı Takı & Aksesuar,
El Yapımı Dekoratif Obje, Oyuncak & Amigurumi, El Yapımı Kolye, El Yapımı Bileklik,
El Yapımı Mum & Mumluk, El Yapımı Duvar Süsü, Tütsü & Tütsülük, El Yapımı Küpe,
El Yapımı Nazarlık, El Yapımı Ayna, El Yapımı Örgü Runner Supla, Seramik Porselen Yemek Takımı

## 5. Bizde ne var / ne yok

Bizdeki kategoriler (`Category` tablosu — 10 adet + "Tümü"):
Buketler, Güller, Orkideler, Kutuda Çiçek, Teraryum, Saksı Çiçekleri, Çelenk, Hediye Setleri,
Doğum Günü, Yeni Bebek.

Bizdeki koleksiyonlar (`src/lib/collections.ts` — Prisma `where` parçası, tablo değil):
Premium, Hediye, Balon, Pasta, Çikolata, İndirimdekiler.

**Eksik üst başlıklar:** Yenilebilir Çiçek, Gönderim Amacı, Kişiye Özel, El Yapımı Hediye,
"Çiçek" çatısı (tüm çiçek kategorilerini toplayan üst düğüm), "Orkide / Saksı Çiçekleri" çatısı.

**Uyarlama kararı (öneri):** Kategori tablosunu 200 satıra şişirmek yerine —
- Üst seviye 9 başlık + alt dallar `src/lib/nav-tree.ts` içinde **statik ağaç** olsun
  (`COLLECTIONS` ile aynı mantık: her yaprak ya mevcut `/kategori/<slug>` ya da
  `/urunler?koleksiyon=…` / `?amac=…` gibi bir filtreye gitsin).
- "Gönderim Amacı" bizde zaten `Order` üzerinde gönderim amacı alanı olarak var →
  ürün tarafında `?amac=` filtresine bağlanabilir.
- 3. katman: fotoğraflı şerit **kalsın ama aşağı insin** (onlarda da carousel body'de);
  yerine metin + dropdown navbar gelsin.

## 6. Görsel detaylar (1568px viewport)
- Navbar linkleri: 13-14px, koyu gri, aralarında ince dikey `|` ayraç, ~24px boşluk.
- Dropdown paneli: beyaz, `container` genişliğinde (~980px içerik), alt gölge hafif.
- Panel iç boşluk: üstten ~24px, soldan ~14px; "Tüm Ürünleri Gör" link mavisi + `›`.
- Liste yazıları 13px, satır aralığı ~20px, sütun genişliği ~128px, sütunlar arası ~24px.
- Hover'da alt çizgi yok, sadece renk koyulaşması.
