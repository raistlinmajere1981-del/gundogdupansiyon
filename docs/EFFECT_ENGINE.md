# Gündoğdu · Kanonik Efekt Yayını

Güncel site kanonik şablonu kullanır. Ana sayfanın sabit fotoğrafı
`assets/site/img/gideros-1-1818.webp` (1818 × 1228) dosyasıdır.

## Aktif bağlantı

- Sahne: `canonical/public/assets/site/scenes/hero.scene.json`
- Manifest: `canonical/public/assets/site/scenes/effects-manifest.json`
- Tarayıcı aynaları: `assets/site/scenes/hero.scene.json` ve
  `assets/site/scenes/effects-manifest.json`
- Manifest kaydı: `source: site/img/gideros-1-1818.webp`,
  `slot: hero`, `scene: hero.scene.json`
- Runtime: ortak `canonical/public/assets/core/effects.mjs` ve
  `canonical/public/assets/vendor/effect-engine/`

Eski `assets/effects/hero.scene.json` ve `assets/js/hero-effects.mjs`
kanonik ana sayfada kullanılmaz. Eski `install-effect-scene.sh`
betiği de aktif yayını güncellemez.

## Yayın akışı

Efekt Atölyesi'nde Gündoğdu → Ana sayfa · Gideros hero seçilip
kaydedildikten sonra **Siteye yayınla**:

1. Fotoğraf SHA-256'sı ve v1 sahne/efekt geçerliliği kontrol edilir.
2. Kanonik sahne ile manifest her iki yerel varlık dizinine yazılır.
3. Yalnız dört site dosyası alwaysdata'ya SSH üzerinden aktarılır.
4. HTTPS üzerinden canlı sahne ve manifest karşılaştırılır.

Yardımcı Asistan web modülüne ve API verilerine dokunulmaz.
Geçersiz sahne, azaltılmış hareket veya düşük donanım koşullarında
orijinal fotoğraf görünür kalır.

## Doğrulama

- `node scripts/package-site.mjs --check`
- `node scripts/sync-public-assets.mjs --check`
- `node --test tests/canonical-effects.test.mjs`
- `bash scripts/deploy-site.sh --dry-run`

Canlı kabulde ana sayfanın `.hero-photo[data-effect-state=animated]`
işareti ve efekt Canvas'ı hem masaüstü hem mobilde kontrol edilir.
