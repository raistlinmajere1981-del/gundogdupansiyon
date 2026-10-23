# Efekt Atölyesi 1.1.0

Hero yalnız `assets/effect-engine/src` içindeki Studio motorunu kullanır. Eski motor, eski kontroller ve preset uyumluluğu yoktur. Kıyı köpüğü henüz Studio registry içinde değildir.

Aktif `assets/effects/hero.scene.json` Atölye üzerinden kurulur; yoksa fotoğraf statiktir. `?effect-scene=sample` pasif örneği açar; `?effect-scene=off` her zaman fotoğrafı gösterir. Geçersiz/eksik JSON, azaltılmış hareket, veri tasarrufu ve çok düşük donanım statik kalır. Motor görünmeyen sekme/viewport için durur, piksel/FPS bütçesi uygular; sürekli yavaş çizimde statik fotoğrafa döner. Sahne isteği `cache: no-store` kullanır.

1. Atölye'de doğru fotoğrafla çalışın: Gündoğdu `examples/gideros.scene.json` (1818×1228), BlackSea `examples/blacksea.scene.json` (1536×1024). BlackSea örneği `?example=blacksea` ile açılabilir. Fotoğraf kullanım hakkı siteye bağlıdır.
2. Bölgeleri/efektleri düzenleyin, **JSON dışa aktar** kullanın.
3. Hedef site dizininde:
   ```bash
   bash scripts/install-effect-scene.sh ~/Downloads/file.json --check-only
   bash scripts/install-effect-scene.sh ~/Downloads/file.json
   node scripts/check-effect-engine.mjs
   node scripts/check-effect-browser.mjs
   ```
4. Yerelde kontrol edin. Onay geldiğinde yalnız site deploy edin; bu çalışma deploy yapmaz.

Kurucu vendor `importProject` ile şema, çokgen, tür ve parametreleri; ayrıca site boyutlarını doğrular. Geçersiz dosya ve `--check-only` mevcut kurulumu değiştirmez. Geçerli dosya aynı dizinde geçici dosyaya yazılır ve atomik rename ile kurulur. Mutlak/göreli dosya yolu kabul edilir. `photo.src` yalnız metadata'dır; site fotoğrafını veya responsive picture kaynağını değiştirmez. BlackSea mobil kırpması adapter tarafından derlenen sahneye eklenir (0,0,1180,1024).

Motor güncelleme: `bash scripts/sync-effect-engine.sh`. Varsayılan kaynak kardeş `../EfektAtolyesi`; alternatif `EFFECT_STUDIO_ROOT=/path/to/EfektAtolyesi bash scripts/sync-effect-engine.sh`. Runtime/registry/model byte-identical kopyalanır; siteye özel motor fork'u yoktur. Çalışma zamanında Studio dizinine bağımlılık yoktur. Deploy betikleri bütün `assets` dizinini kopyalar; motor ve varsa aktif sahne de pakete girer.
