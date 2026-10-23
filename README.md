# Gündoğdu Pansiyon & Restoran

Gideros Koyu için PHP sitesi; BlackSea’nin olgun dil, oda detayı, QR menü ve Canvas kalıpları Gündoğdu’nun mevcut görsel kimliğine uyarlanmıştır. Ana sayfa, Odalar, Oda Detayı, Restoran, QR Menü, Galeri ve İletişim sayfaları bulunur. Canlı site: https://yardimciasistangunduodu.alwaysdata.net/.

## Yerel önizleme

PHP 8+ gerekir. Yerel public GET proxy’si için cURL kullanılır. Üretim için Node, framework veya site veritabanı gerekmez.

    bash scripts/dev.sh

Adres: http://127.0.0.1:8077

Mevcut hostingdeki **public GET** yayınları okunur. Yerel router canlıya rezervasyon/talep/AI isteği göndermez; bu işlemler 503 döner. Tarayıcı işlem akışları, yalnız bu repo içindeki geçici HTTP contract fixture’larıyla kontrol edilir; gerçek backend entegrasyonu veya canlı rezervasyon kanıtı sayılmaz.

## Veri sahipliği

İşletme verilerinin sahibi Yardımcı Asistan Desktop’tır. Site /yardimci-asistan/api/ public HTTP projeksiyonlarını okur:

| Endpoint | Kullanım |
| --- | --- |
| business.php | Ad/metin, telefon, WhatsApp, e-posta, adres, koordinat, harita, sosyal bağlantılar, galeri, yayın/capability bayrakları ve JSON-LD |
| rooms.php | Etkin odalar, açıklama, yatak, kapasite, görsel, minor-unit gece fiyatı |
| tables.php | Etkin masa kataloğu ve masa bağlamı |
| menu.php | Yayınlanan kategori/ürün/fiyatlar |
| marketing.php | Ana sayfa duyuru ve kampanyaları |
| request.php, availability.php, chat.php | Canonical widget’ın mevcut işlem uçları |

PHP yalnız markalı sayfa düzenini, gerçek bölge fotoğraflarını ve güvenli boş durumları üretir; SSR sırasında HTTP isteği yapılmaz. Böylece PHP-FPM kendi public uçlarını bekleyerek worker havuzunu kilitlemez. assets/js/public-data.js DOMContentLoaded sonrasında mevcut beş aynı origin public GET ucunu bir kez, no-store ve süre/boyut sınırıyla okur. Odalar, masalar, menü, duyurular, işletme galerisi, hakkımızda, koşullar, iletişim, harita ve JSON-LD tarayıcıda güncellenir. İçerik textContent/DOM düğümleriyle, medya ve dış bağlantılar doğrulanarak yerleştirilir. İşletme kayıtları yerelde saklanmaz. Görünür sayfada 15 saniyelik ortak GET yenilemesi vardır; açık widget ve medya diyaloğu sırasında ertelenir, aynı snapshot tekrar çizilmez. Sayfa yeniden açıldığında veya tarayıcı geçmişinden geri getirildiğinde yayın yeniden okunur. API hatası, bozuk yanıt veya geri çekilmiş yayında ilgili içerik ve rezervasyon seçeneği kapanır; eski/tahmini telefon/adres kullanılmaz. JS olmadan markalı düzen, manzara ve iletişim sayfasına yönlendiren bağlantılar kalır.

GUNDOGDU_PUBLIC_API_ORIGIN yerel router’ın public GET proxy kaynağını değiştirebilir; mevcut fixture kullanımı korunur. Tarayıcı her durumda /yardimci-asistan/api/ altındaki aynı origin uçlarını çağırır. Bu ayar SSR okumalarını tekrar açmaz. Yerel proxy varsayılanı verilen Alwaysdata adresidir. .env dosyaları Git dışındadır.

## Görsel motorlar

Yeni koy/gün doğumu SVG işareti, açık/koyu varyantı ve favicon assets/brand/ içinde. Mevcut işletme logosu doğrulanamadığı için çizildi.

İki gerçek Gideros fotoğrafı Makalp / Commons, CC BY-SA 3.0. Lisans/kaynak ve dönüşüm atıfları tüm sayfalarda altbilgide açılabilen kısa «Fotoğraf kredileri» alanındadır. Oda/yemek fotoğrafı gibi sunulmaz. Görseller yerel WebP, fontlar Türkçe karakterleri içeren yerel WOFF2; içerik görselleri lazy loading kullanır.

BlackSea’den Canvas çekirdeği, koordinat/scheduler/random yardımcıları ve offshore alındı. Hero köpük kullanmaz; güneş parıltısı siteye özel shimmer katmanıdır. Gideros geometrisi/ayarları ayrıdır. 20 fps, 650 bin piksel bütçesi, azaltılmış hareket/düşük donanım/ağır çizimde statik fotoğraf ve kullanıcı durdurma desteği vardır.

assets/assistant/widget.js değişmemiş canonical bundle’dır. assets/css/widget-theme.css yalnız body[data-site="gundogdu"] altında tipografi, kart, buton, tarih/saat ve paneli temalar. assets/js/site.js güncel tarayıcı snapshot’ına göre widget config’ini, görünür seçenekleri, klavye ve dış tetikleyicileri bağlar. Widget’ın bağımsız business GET’i katalog yayın kapılarını aşamaz; yalnız yayınlanmış katalog + requests_enabled + ilgili public_surfaces birlikte rezervasyon açar. Site katmanı POST göndermez; canonical widget tek gönderim sahibidir. Talep validasyonu, retry/idempotency, availability ve gönderim bundle’da kalır. Ortak repo değiştirilmedi.

## Kontroller

    bash scripts/check.sh
    node scripts/check-browser.mjs
    bash scripts/deploy-site.sh --dry-run

Tarayıcı testi için bağımlılığı çalışma kökünde kurun:

    npm install --prefix .local/browser-tools --no-audit --no-fund @playwright/test

Test /usr/bin/brave kullanır; PLAYWRIGHT_CHROMIUM_EXECUTABLE ile değişebilir. Komşu repo, özel veri veya secret okunmaz. Fixture sunucusu ve geçici site kopyası .test-artifacts/ altında oluşturulur ve kapanışta temizlenir. Test, tek PHP worker’ında kendi public GET’ini bekleyen geçici tanıyla errno 28 / HTTP 0 durumunu üretir; ardından SSR’nin API çağrısı yapmadan tamamlandığını ve tarayıcının bağımsız HTTP fixture’ından 3 oda / 8 masa yüklediğini kanıtlar. Capability/yayın geri çekme, 503/bozuk JSON/ağ/zaman aşımı, güvenli metin/URL, widget seçenekleri, tekrar gönderim anahtarı ve 40 sayfa/ekran kombinasyonu ile ek İngilizce 320/390 px kontrolleri çalıştırılır. Oda navigasyonu/bilinmeyen kimlik/medya, masa bağlamı, QR filtreleri ve yayın geri çekme, yalnız yayınlı galeri, endpoint metadata çevirileri, canonical widget dili, oynatılabilir fixture video ve gerçek canvas çizim/durdurma durumu doğrulanır. Video fixture üretimi için ffmpeg gerekir. Rapor ve ekranlar .test-artifacts/browser-report.json ve aynı dizindeki PNG dosyalarındadır.

Çalışan yerel önizlemeden gerçek public verilerle ekran almak için:

    node scripts/capture-preview.mjs

## Yayın sınırı

Mevcut deploy scripti kullanılır. `--dry-run` da SSH bağlantısı açar; bu çalışma kapsamında yalnız `--dry-run` ön kontrolü başarılı oldu; uzak dosyalar değiştirilmedi. Allowlist: assets, inc, odalar (oda detayı dahil), qr-menu, restoran (masa detayı dahil), galeri, iletisim, kök .htaccess, 404.php, robots.txt, sitemap.xml, index.php.

/yardimci-asistan, config/runtime, .local, .env, .git, testler ve belgeler aktarılmaz. Silme senkronizasyonu yoktur. SSH host anahtarı, PHP/cURL, symlink ve bilinmeyen site index/htaccess kontrolleri vardır.

**Canlı yayın yalnız tasarım incelemesi ve açık kullanıcı onayı sonrasında yapılır.** Bu teslimde --yes, commit/push çalıştırılmadı.

[Teslim raporu](docs/DELIVERY.md) · [Kaynaklar ve lisanslar](docs/SOURCES.md)

## Özellik sahipleri

- `assets/js/public-data.js`: tek site GET/yenileme, yayın ve rezervasyon kapıları, güvenli medya URL’leri, katalog/galeri/iletişim projeksiyonları. Canonical widget kendi sözleşmesi kapsamında business GET yapmaya devam eder.
- `inc/language.php`, `assets/js/language.js`, `assets/i18n/en.json`: siteye ait TR/EN arayüz; `?lang=en|tr` ve yıl süreli site çerezi. Dil seçicisi mevcut path ve `id` parametresini korur. SSR dil seçimi API çağırmaz. API kayıtları yalnız kendi endpoint `localization.version=1`, `source_language=tr`, `target_languages` içinde `en` olduğunda alan bazında çevrilir; eksik alan Türkçe kalır.
- `assets/js/rooms.js`, `odalar/oda/`, `assets/js/room-media.js`: BlackSea oda detay/media renderer uyarlaması; yalnız tam kimlik eşleşmesi. Kapak/fotoğraf lightbox, yayın varsa 180/360 panorama ve kontrollü video. Panorama Pannellum 2.5.6 yerel dağıtımıdır; CDN çalışma zamanı bağımlılığı yoktur.
- `assets/js/qr-menu.js`, `qr-menu/`: BlackSea kategori/ürün/fiyat renderer uyarlaması, ortak snapshot üzerinden çalışır. Menü yayını ve menu/qr_menu yüzeyi kapalıysa bağlantılar gizlenir; doğrudan URL boş durumu korur.
- Galeri gridi yalnız `business.gallery` sırasını kullanır; Gideros fotoğrafları kapak/bölge bölümleri ve kaynak atfıyla sınırlıdır. Yayın yoksa galeri boştur.
- Oda görseli/başlığı detay bağlantısıdır. Masa kartının tamamı `/restoran/masa/?id=...` detayına gider. Detay, tüm yayınlı özellikler ve kapak/fotoğraf, desteklenen panorama/video içerir. Yalnız detay içindeki rezervasyon düğmesi seçili masa ID/ad/görselini canonical `food.reserve` bağlamına taşır; kapalı rezervasyonda detay ve iletişim bağlantısı kalır. Bilinmeyen/geri çekilmiş ID başka kayıt veya eski görsel göstermez.
- Dalga anahtarı gerçek ticker ve overlay’i kapatır/açar; seçim yerelde saklanır. Azaltılmış hareket, saveData, düşük donanım ve ağır çizim statik fallback’i korunur.

İzole fixture testleri üretim Desktop yayınını, gerçek cihazları veya canlı rezervasyon sağlayıcısını kanıtlamaz. Canlı ortama değişiklik yapılmamıştır.

## Hero · Efekt Atölyesi 1.1.0

Varsayılan görünüm statik fotoğraftır. Yalnız yeni Studio motoru kullanılır; eski MAX/debug/intensity ve Gideros motoru hero'dan çıkarıldı. `?effect-scene=sample` pasif örneği, `?effect-scene=off` zorunlu statik görünümü açar. Aktif sahne kullanıcı JSON kurulumundan sonra çalışır.

Atölye'de doğru 1818×1228 Gideros fotoğrafını düzenle → JSON dışa aktar → site dizininde `bash scripts/install-effect-scene.sh ~/Downloads/file.json` → yerelde doğrula → açık onaydan sonra site-only deploy. Ayrıntılar ve motor eşleme: [EFFECT_ENGINE.md](docs/EFFECT_ENGINE.md).
