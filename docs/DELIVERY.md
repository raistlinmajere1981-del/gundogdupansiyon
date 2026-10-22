# Yerel teslim — 22 Ekim 2026

Site tamamlandı. Canlı yayın, commit ve push yapılmadı.

## Tamamlananlar

- Ana sayfa, Odalar, Restoran, Galeri, İletişim ve HTTP 404.
- Koyun geniş fotoğrafı; sıcak kireç, koyu orman, kum paleti; serif başlıklar, sade mobil gezinme.
- Yeni özgün SVG logo, açık/koyu varyant ve favicon. Mevcut logo doğrulanamadı.
- Makalp’in gerçek Gideros Bay1/Bay2 fotoğrafları, CC BY-SA 3.0; 2007 arşiv tarihi kaynak kaydında; kısa kaynak/lisans atıfları altbilgide açılır. [Kaynak kaydı](SOURCES.md).
- BlackSea Canvas çekirdeği, offshore/foam; Gideros’a özgü su/kıyı geometrisi, 26 yüzey parçası ve 2 küçük köpük rotası. Daha düşük hız/şiddet, 20/15 fps, 650 bin piksel, statik ve azaltılmış hareket desteği.
- Canonical widget değişmeden; siteye özel tipografi, panel, kart, buton, takvim ve saat teması. Yayın/katalog/capability kapıları, klavye ve odak desteği.
- business/rooms/tables/menu/marketing public API bağlantıları. İletişim, harita, WhatsApp, sosyal bağlantılar ve JSON-LD aynı işletme projeksiyonundan.
- Oda/menü/iletişim eksikse temiz boş durumlar. İkinci işletme veritabanı ve uydurma oda/fiyat/hizmet yok.
- Yerel WebP ve WOFF2; lazy loading, SEO, sosyal paylaşım görseli, sitemap ve robots.

Yayın değişiklikleri sonraki sayfa isteğinde görünür; açık sayfada polling yapılmaz. Oda/masa talebi; requests_enabled, ilgili yüzey ve etkin/dolu katalog birlikte açıkken sunulur. İşlem validasyonu, availability, retry/idempotency ve gönderim mevcut widget’ta kalır.

## Doğrulama kanıtı

| Kontrol | Sonuç |
| --- | --- |
| PHP/JS-MJS/shell syntax ve diff whitespace | Geçti: bash scripts/check.sh |
| İzole güncel PHP/SQLite backend ile tarayıcı | **19 kontrol, 25 sayfa/ekran kombinasyonu, 6 ekran kaydı geçti** |
| Genişlikler | 320, 360, 390, 768, 1440 px; yatay taşma yok |
| Kısa mobil widget | 320×640 ve 390×667; panel ve takvim sığıyor |
| Oda talebi | İzole backend’den gerçek HTTP 201 receipt; 503 sonrası form korunuyor; retry aynı idempotency anahtarı ve oda bağlamını taşıyor |
| Restoran | Yayınlanan menü, masa bağlamı, 19:30 saat seçimi |
| Yayın geri çekme/capability | Eski oda/masa/menü/duyuru ve iletişim kalmıyor; capability OFF seçeneği kapatıyor |
| Hatalı API | 503 ve bozuk şekilli JSON; sayfa ve JSON-LD çalışıyor |
| Hareket/klavye | İlk yükleme ve çalışma anında reduced-motion; iki çekirdekte statik; menü/lightbox/Escape; JS kapalı SSR/fallback |
| Tarayıcı/PHP | JS exception ve PHP warning/fatal yok |
| Deploy dry-run | Başarılı; SSH/PHP/cURL, allowlist ve modül sınırı doğrulandı |
| Dry-run sonrası uzak kök | Yalnız mevcut index.html ve yardimci-asistan; site dosyası yüklenmedi |

Git dışındaki .test-artifacts/ altında browser-report.json, php-test.log, deploy-dry-run.txt, remote-root-after-dry-run.txt, live-api-summary.json bulunur.

İnceleme ekranları:

- desktop-home.png, mobile-home.png, mobile-widget.png: gerçek public GET verileriyle yerel önizleme.
- fixture-desktop-home.png, widget-mobile-calendar.png, widget-mobile-success.png, widget-mobile-time.png: **yalnız izole test verileri**; gerçek işletme odası/fiyatı veya canlı rezervasyon kanıtı değildir.

## Canlı yayından önce kalanlar

1. Tasarım/logo ve yayın için kullanıcı incelemesi ve açık yayın onayı.
2. Gerçek telefon, adres, koordinat, WhatsApp/sosyal bağlantılar, açıklama ve kullanım hakkı işletmede olan güncel görsellerin Desktop’tan yayınlanması.
3. Oda/masa/menü katalogları ve ilgili capability/yayınların açılması. Bugünkü public API’de iletişim ve galeri boş; oda/masa ve talepler kapalı. Site bunları uydurmadan bekliyor.
4. Onaylı ilk yayından sonra HTTP/asset/SEO/harita ve widget’ın canlı kontrolü. Gerçek rezervasyon/masa talebi işletmeyle koordinasyon içinde ayrıca doğrulanmalı.

Fiziksel iOS/Android cihaz, canlı AI sağlayıcısı, gerçek WhatsApp gönderimi, gerçek işletme rezervasyonu ve deploy sonrası Apache davranışı yerel testle kanıtlanmadı. Büyük Yardımcı Asistan pre-main paketi çalıştırılmadı. Önizleme canlıya POST iletmez. Diğer referans repoları değiştirilmedi.

Önizleme:

    bash scripts/dev.sh

http://127.0.0.1:8077
