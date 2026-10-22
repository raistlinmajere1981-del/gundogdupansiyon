# BlackSea özellik eşliği — yerel inceleme

22 Ekim 2026. Değişiklik kapsamı yalnız `/home/raistlin/gundogdu_web`. BlackSea ve canonical API sözleşmeleri salt okunur referanstır. Canlı deploy, commit/push ve canlı POST yapılmadı.

## Uygulama

| İşlev | Dosyalar ve davranış |
| --- | --- |
| Ortak veri | `assets/js/public-data.js`: beş endpoint için sınırlı aynı origin GET, dil projeksiyonları ve fail-closed kapılar. SSR self-HTTP yok. Aynı snapshot sessiz yenilemede tekrar çizilmez. |
| Oda | `odalar/oda/index.php`, `assets/js/rooms.js`, `assets/js/room-media.js`: BlackSea detay/galeri/medya akışı. Kartın fotoğrafı ve başlığı tam oda ID’sine gider. Bilinmeyen/eksik ID başka oda göstermez. Yayın yoksa panorama/video kontrolü yok. |
| Masa | `restoran/masa/index.php`, `assets/js/tables.js`, `assets/js/public-data.js`: kart/fotoğraf/başlık tam masa detayına gider; listede rezervasyon yok. Detay tüm yayınlı alanları, kapak/galeri ve canonical 180/360/video türlerini gösterir. Detaydaki canonical food.reserve ID/ad/görsel taşır; body.dataset.tableEnabled kapısına uyar. Kapalı taleplerde detay ve iletişim, geri çekilmede boş durum kalır. |
| QR Menü | `qr-menu/index.php`, `assets/js/qr-menu.js`: BlackSea kategori filtresi ve ürün renderer’ı, tek veri merkezinden beslenir. Yalnız yayınlı, kullanılabilir ürünler. Yayın kapanırsa nav/restaurant bağlantısı kapanır; doğrudan sayfa boş durum verir. |
| Galeri | `inc/site.php`, `assets/js/public-data.js`: yalnız işletmenin yayın sırasındaki görselleri; boş yayında boş galeri. Bölge fotoğrafı fallback’i ve scenic sekmesi kaldırıldı. |
| Dil | `inc/language.php`, `inc/flag-language.php`, `assets/js/language.js`, `assets/js/flag-language.js`, `assets/i18n/en.json`, `assets/flags/`: TR/EN, locale, metadata bazlı işletme çevirileri, alan bazlı TR fallback. Canonical widget document.lang kullanır; bundle değişmedi. |
| Dalga | `assets/js/water.mjs`, `assets/js/canvas/gideros.mjs`, `assets/css/site.css`: görünür 44 px kontrol, gerçek ticker durdurma ve overlay gizleme, kalıcı seçim; geçici TEST · MAX foam/offshore ve koordinatlara bağlı açılır alan rehberi. Performans bütçesi ve statik fallback’ler korundu. |
| Paket | `scripts/deploy-site.sh`, `sitemap.xml`: QR sayfası allowlist/sitemap içinde; oda detayı odalar dizinine dahil. Apache DirectoryIndex ve yerel router mevcut dizin rotalarını destekler. Masa detayı restoran dizinine dahil. Deploy --dry-run başarılı; uzak dosyalar değiştirilmedi. |

## Doğrulama

`bash scripts/check.sh`, `node scripts/check-browser.mjs`, `git diff --check` çalıştırılır. Güncel koşu sonucu `.test-artifacts/browser-report.json` içindedir. Tarayıcı testi yalnız yerel HTTP fixture sunucuları ve geçici site kopyası kullanır; dış istekler engellenir. POST testleri yalnız izole request fixture’ına gider.

Kapsam: self-HTTP deadlock regresyonu, oda detayı ve kimlik güvenliği, fotoğraf/panorama/video kontrolleri ve yerel video oynatma, selected room/table widget, QR filtre/geri çekme, business gallery boş/yayınlı/sıralı, TR/EN endpoint metadata ve eksik alan fallback, widget dili, SEO, 40 responsive sayfa kombinasyonu ve İngilizce 320/390 px, gerçek canvas pikseli ve OFF kare sayacı, reduced-motion/low hardware, yayın/capability geri çekme, ağ/503/bozuk yanıt, unsafe URL/metin, widget retry/idempotency, klavye ve JS kapalı fallback.

Bu kanıt gerçek Desktop yayını, fiziksel cihaz, canlı PHP-FPM havuzu, canlı rezervasyon veya üretim videosu/panoramasının kalitesi için doğrulama değildir. Üretim site inceleme sonrasına kadar değişmeden kalır.

Geçici MAX ayarlarının kapsamı ve doğal ayara dönüş adımları README içindeki “Geçici dalga tanısı” bölümündedir. Rehber, alfa piksel ve on/off kare ölçümleri browser-report.json içinde; ekranlar .test-artifacts altındadır.
