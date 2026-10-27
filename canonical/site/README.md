# Gündoğdu canonical yerel tema

`YardimciAsistan/web-site-template` 0.4.0 dağıtımı; manifestteki 67 ortak dosya değiştirilmedi.
Document root yalnız `canonical/public/`. Eski site ayrı durur.

Gündoğdu deposundan API olmadan yerel sunum:

```bash
php -S 127.0.0.1:8098 -t canonical/public canonical/site/router.php
```

Yayınlı içerik için public API origin'ini açıkça tanımlayın:

```bash
YA_SITE_API_ORIGIN=http://127.0.0.1:8097 php -S 127.0.0.1:8098 -t canonical/public canonical/site/router.php
```

Origin yalnız sunucu tarafı public GET hizmetidir. Tarayıcıdan widget/talep/medya
uçları aynı origin'de `/yardimci-asistan/` altında mevcut web modülüne bağlanmalıdır.
Yerel testte ayrı fixture ve aynı-origin proxy kullanılır; üretim proxy'si veya backend
bu temanın içinde dağıtılmaz. API yoksa yalnız siteye ait bölge anlatımı, statik
hero ve canonical kesinti durumu gösterilir; işletme adı/telefon/oda uydurulmaz.

Özelleştirmeler `site/views/`, `public/assets/site/` ve `locales/tr.json` içindedir.
Katalogda yalnız Türkçe kaynak vardır; hedef diller canonical publication'dan gelir.
Ortak PHP/dil/widget/rezervasyon sahipleri kullanılır; eski runtime kopyalanmadı.
Sunum modülü mevcut widget düğümlerini sıralar ve katalogdan başlık/karşılama
metnini uygular; mevcut Nexa avatarını veya form state'ini değiştirmez.

## Korunan varlıklar

`site/SOURCES.md`, eski kaynak/lisans belgesinin birebir kopyasıdır ve tarihsel
uygulamayı da anlatır. Canonical temanın güncel motor durumu bu dosyada tanımlanır:
**effects: []**, statik fotoğraf; adaptör, sahne veya motor yüklenmez.
`site/asset-provenance.json` taşınan fotoğraf/font/işaret ve iki arşiv sahnesinin
SHA-256 eşleşmelerini içerir. Sahne dosyaları `site/preserved-effects/` altında,
web kökü dışında ve pasiftir. Eski motor, scriptler, örnek sahne ve değiştirilmiş
`../scripts/check-effect-browser.mjs` eski sitede aynen korunur. Ortak dağıtımın
vendor motoru manifestin değişmemiş parçasıdır; yüklenmez. Sonraki efekt aşaması
canonical adaptörün responsive/kadraj ve yaşam döngüsü sözleşmesiyle ayrıca sınanır.

Fotoğraflar Makalp'in 30 Haziran 2007 Gideros Bay1/Bay2 arşivleridir; CC BY-SA 3.0.
WebP türevleri aynı lisansla sunulur. İşletme/oda/restoran fotoğrafı veya odadan
manzara olarak kullanılmaz. Header/footer özgün koy/güneş işaretini kullanır;
resmî işletme logosu olduğu iddia edilmez. Cormorant 500 ve Manrope 400/600,
Latin/Latin Extended WOFF2 ve iki OFL dosyası byte-identical korunur.

## Dar doğrulama

Gündoğdu deposundan:

```bash
node canonical/tools/manifest.mjs
node canonical/site/tests/browser.mjs
node canonical/site/tests/permissions.mjs
```

Tarayıcı testi mevcut `.local/browser-tools` Playwright kurulumunu ve `/usr/bin/brave`
kullanır; alternatif `PLAYWRIGHT_CHROMIUM_EXECUTABLE` verilebilir. Sunucular geçicidir.
Görseller `.test-artifacts/canonical/` altına yazılır. Fixture yalnız TEST kayıtları
sunar. Oda/masa görselleri yoktur; galeri decode kontrolünde özgün işaret kullanılır,
fotoğraf gibi sunulmaz. Bunlar gerçek işletme yayını veya gerçek işletmeye talep gönderimi değildir.
`permissions.mjs`, kardeş YardimciAsistan deposundaki web modülünü (alternatif
`YA_SOURCE_ROOT`) yalnız geçici dizine kopyalar; gerçek PHP/SQLite ile sentetik
genel/oda/masa talebi yazar ve sonra geçici dizini temizler.
Ana depodaki kayıtlı `smoke-web-site-template.mjs --contracts-only`, gerçek izole
PHP/SQLite public API ve mutation/capability sözleşmelerinin dar kontrolüdür.

## İkinci tur: işlev eşliği ve hosting

Ortak masa detayı `?page=restaurant&id=...`, oda detayı `?page=rooms&id=...`
ile aynı yayın kümesinden açılır. Liste başlığı ve kapak detaya gider;
bilinmeyen/geri çekilmiş ID 404'tür. Canonical medya/özellik/rezervasyon
bileşenleri kullanılır; yetki yoksa talep düğmesi yoktur.

QR Menü `category` GET filtresi ve geçerli public `updated_at` tarih/saatini
gösterir. Kategori filtresi no-JS çalışır. Masa rezervasyonu ve katalog sipariş
yetkileri menüden bağımsızdır. Eski `/odalar/oda/`, `/restoran/masa/`,
`/qr-menu/` vb. yollar ve `index.php` biçimleri ortak allowlist üzerinden
kimlik/dil/kategoriyi koruyarak yönlenir. Ek query ile hedef sayfa değiştirilemez.

`public/.htaccess` siteye ait Apache 2.4/mod_rewrite hosting girişidir. PHP
built-in önizlemede yukarıdaki `site/router.php` kullanılmalıdır. API modülü
ayrıca aynı origin'de kurulmalı; eski Gündoğdu web kökü değiştirilmedi.
Gerçek domain için `YA_SITE_PUBLIC_ORIGIN=https://izinli-site-domaini.example`
yalnız origin olarak verilir; Host header'ından domain üretilmez. Tanımlı
origin ile canonical URL, `?resource=sitemap` veya `/sitemap.xml` ve yalnız
yayımlanmış işletme kimliği/alanlarından JSON-LD üretilir. `business.php`
`business_publication` metadata'sı yoksa JSON-LD kapalı kalır. Gizli/account
içerik sitemap'e girmez; API kesintisi/eksik origin sitemap 503 verir.

Sekmeye/BFCache sayfasına en az 60 saniye sonra dönüşte ortak sunum açık
yenileme bağlantısı önerir. Form/sepet state'i otomatik yenilenmez, ikinci
poller yoktur. Menüde elle yenileme bağlantısı her zaman vardır. Eski 15 sn
polling'in birebir eşliği amaçlanmaz. İşlem anındaki yetki API'de tekrar denetlenir.

Ek dar testler:

```bash
node canonical/site/tests/round2.mjs
node canonical/site/tests/effects-round2.mjs
```

Efekt, mevcut canonical adaptörle geçici yerel kopyada prototiplendi ve
reduced-motion/düşük güç/lifecycle/fallback kontrolleri geçti. Görsel katkıya
karşı sürekli çizim maliyeti nedeniyle gerçek config **effects: []** kalır.
Sahne ve kaynak atıfları korunur.

Kalan yayın işleri: gerçek domain/origin ve hosting rewrite/HTTPS, aynı-origin
web modülü/medya, gerçek sağlayıcılar ve availability freshness, fiziksel cihaz
kabulü, son ortak sürüm/hash sabitlemesi ve bütün sitelerin kontrollü eşitlenmesi.
Gerçek hosting, canlı işlem veya kesin rezervasyon onayı kanıtı yoktur.
