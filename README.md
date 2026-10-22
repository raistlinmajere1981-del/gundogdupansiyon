# Gündoğdu Pansiyon & Restoran — Gideros, Cide

Kastamonu/Cide, Gideros Koyu'ndaki işletme için bağımsız tanıtım sitesi.

## Aşama

**Altyapı hazırlığı.** Sayfa tasarımı, metinler, oda/menü bilgileri ve medya henüz hazırlanmadı. Mevcut Alwaysdata karşılama sayfası tasarım tamamlanana kadar korunur.

- GitHub: https://github.com/raistlinmajere1981-del/gundogdupansiyon
- Yerel repo: /home/raistlin/gundogdu_web
- Site: https://yardimciasistangunduodu.alwaysdata.net/
- SSH: yardimciasistangunduodu@ssh-yardimciasistangunduodu.alwaysdata.net
- Site kökü: /home/yardimciasistangunduodu/www
- Yardımcı Asistan modülü: /home/yardimciasistangunduodu/www/yardimci-asistan

Site dosyaları bu repoda; Yardımcı Asistan web modülü ana `YardimciAsistan` reposunda yönetilir. Site yayını modülün dizinine **dokunmaz**. Oda, masa, menü, fiyat ve rezervasyon verileri mümkün olduğunda Desktop/web API yayınlarından alınacak; prototip içerikleri gerçek işletme verisi gibi sunulmayacak.

## Bekleyenler

1. Alwaysdata SSH hesabına yerel `~/.ssh/id_ed25519.pub` anahtarının yetkilendirilmesi ve BatchMode bağlantısının doğrulanması.
2. Admin Control Center üzerinden web modülü ilk kurulumu (ayrı hesap/ayrı secret).
3. Gideros Koyu ve işletmeye ait fotoğraflar üzerinden tasarım planı; Codex uygulaması.
4. Site kodu geldikten sonra `bash scripts/deploy-site.sh --dry-run`, ardından onaylı canlı yayın.

Canlı yayın scripti yalnız tanımlanan site dosyalarını aktarır. `index.php` içinde `gundogdu-site` işareti gerekir. Var olan ilgisiz bir `index.php` üzerine yazmaz; ilk yayında yalnız Alwaysdata varsayılan `index.html` sayfasını kaldırabilir.
