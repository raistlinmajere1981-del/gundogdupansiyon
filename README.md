# Gündoğdu Pansiyon & Restoran

Gideros Koyu için bağımsız PHP sitesi. Ana sayfa, Odalar, Restoran, Galeri ve İletişim tamamlandı. Canlıya yayın yapılmadı.

## Yerel önizleme

PHP 8+ ve cURL gerekir. Üretim için Node, framework veya site veritabanı gerekmez.

    bash scripts/dev.sh

Adres: http://127.0.0.1:8077

Mevcut hostingdeki **public GET** yayınları okunur. Yerel router canlıya rezervasyon/talep/AI isteği göndermez; bu işlemler 503 döner. İşlem akışları izole test backend’iyle doğrulanır.

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

inc/data.php her sayfa isteğinde beş salt-okunur ucu paralel ve süre/boyut sınırlı okur. İşletme kayıtları yerelde saklanmaz. Yayın değişiklikleri sonraki sayfa isteğinde görünür; açık sayfada polling yapılmaz. API hatasında veya boş yayında eski/tahmini iletişim bilgisine dönülmez.

GUNDOGDU_PUBLIC_API_ORIGIN yerel/izole test kaynağını değiştirebilir. Varsayılan, verilen Alwaysdata adresidir. .env dosyaları Git dışındadır.

## Görsel motorlar

Yeni koy/gün doğumu SVG işareti, açık/koyu varyantı ve favicon assets/brand/ içinde. Mevcut işletme logosu doğrulanamadığı için çizildi.

İki gerçek Gideros fotoğrafı Makalp / Commons, CC BY-SA 3.0. Arşiv tarihi, atıf ve dönüşümler /galeri/#kaynaklar altında görünür. Oda/yemek fotoğrafı gibi sunulmaz. Görseller yerel WebP, fontlar Türkçe karakterleri içeren yerel WOFF2; içerik görselleri lazy loading kullanır.

BlackSea’den Canvas çekirdeği, koordinat/scheduler/random yardımcıları, offshore ve foam alındı. Gideros geometrisi/ayarları ayrıdır. 20 fps, 650 bin piksel bütçesi, azaltılmış hareket/düşük donanım/ağır çizimde statik fotoğraf ve kullanıcı durdurma desteği vardır.

assets/assistant/widget.js değişmemiş canonical bundle’dır. assets/css/widget-theme.css yalnız body[data-site="gundogdu"] altında tipografi, kart, buton, tarih/saat ve paneli temalar. assets/js/site.js yayın kapılarına göre görünür seçenekleri, klavye ve dış tetikleyicileri bağlar. Talep validasyonu, retry/idempotency, availability ve gönderim bundle’da kalır. Ortak repo değiştirilmedi.

## Kontroller

    bash scripts/check.sh
    node scripts/check-browser.mjs
    bash scripts/deploy-site.sh --dry-run

Tarayıcı testi komşu Yardımcı Asistan reposundaki Playwright ve /usr/bin/brave kullanır. YARDIMCI_ASISTAN_REPO ve PLAYWRIGHT_CHROMIUM_EXECUTABLE ile değişebilir. Yalnız API/lib kaynakları geçici dizine kopyalanır; müşteri config/veritabanı/secret’ları okunmaz. Test yayın/talepleri geçici backend’de oluşturulup silinir. Rapor/ekranlar Git dışındaki .test-artifacts/ içindedir.

Çalışan yerel önizlemeden gerçek public verilerle ekran almak için:

    node scripts/capture-preview.mjs

## Yayın sınırı

Mevcut deploy scripti kullanılır. Allowlist: assets, inc, odalar, restoran, galeri, iletisim, kök .htaccess, 404.php, robots.txt, sitemap.xml, index.php.

/yardimci-asistan, config/runtime, .local, .env, .git, testler ve belgeler aktarılmaz. Silme senkronizasyonu yoktur. SSH host anahtarı, PHP/cURL, symlink ve bilinmeyen site index/htaccess kontrolleri vardır.

**Canlı yayın yalnız tasarım incelemesi ve açık kullanıcı onayı sonrasında yapılır.** Bu teslimde --yes, commit/push çalıştırılmadı.

[Teslim raporu](docs/DELIVERY.md) · [Kaynaklar ve lisanslar](docs/SOURCES.md)
