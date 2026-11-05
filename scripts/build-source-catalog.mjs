import {createHash} from 'node:crypto';
import {readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';

const site = resolve(new URL('..', import.meta.url).pathname);
const sha256 = value => createHash('sha256').update(value).digest('hex');
const valid = value => typeof value === 'string' && value.trim() !== '' && value.length <= 12000 && !/[<>\u0000-\u0008]/u.test(value);
const texts = new Set();

// The checked-in phrase list contains Turkish UI source text only. English
// values are never read, copied or published.
for (const line of readFileSync(join(site, 'scripts/source-phrases.txt'), 'utf8').split('\n')) {
  const value = line.trim();
  if (valid(value)) texts.add(value);
}

const unscramble = value => value.replace(/\\(['"\\])/g, '$1');
const files = [];
const walk = dir => {
  for (const entry of readdirSync(dir, {withFileTypes: true})) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) { if (!['flags', 'fonts', 'img', 'effect-engine', 'effects', 'nexa'].includes(entry.name)) walk(path); }
    else if (/\.(?:php|js|mjs)$/.test(entry.name) && entry.name !== 'widget.js') files.push(path);
  }
};
walk(join(site, 'inc'));
walk(join(site, 'assets/js'));
walk(join(site, 'odalar'));
walk(join(site, 'restoran'));
walk(join(site, 'galeri'));
walk(join(site, 'iletisim'));
walk(join(site, 'qr-menu'));
files.push(join(site, 'index.php'));

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(/(?:site_text|\bt|\btext)\(\s*(['"])((?:\\.|(?!\1)[^\\])*)\1/g)) {
    const value = unscramble(match[2]).trim();
    if (valid(value) && !value.includes('\n')) texts.add(value);
  }
}

// Static UI phrases that are not passed through the helper functions.
for (const value of [
  'Türkçe', 'English', 'Dil değiştir', 'Change language',
  'Fotoğraf kredileri', 'Gideros Koyu arşiv fotoğrafları', 'Gideros · Cide', 'Gündoğdu',
  'Gideros Koyu · Bölge fotoğrafı', 'Gideros Koyu · Makalp / CC BY-SA 3.0',
  'Gideros’ta,', 'hayat', 'yavaşlar.', 'Biraz yavaşlamaktır.', 'mavi başlar.',
  'GİDEROS KOYU · CİDE', 'GÜNDOĞDU’YA HOŞ GELDİNİZ', 'BİR KIYI MOLASI', 'GÜNDOĞDU’DAN HABERLER',
  'SOFRADA BULUŞALIM', 'BİR YERDEN DAHA FAZLASI', 'GİDEROS KOYU', 'Cide, Kastamonu',
  'YAVAŞLA · NEFES AL · DİNLEN', 'FOTOĞRAF DEFTERİ', 'Gündoğdu’dan kareler.',
  'YOLUMUZ GİDEROS’A DÜŞSÜN', 'GİDEROS’UN KIYISINDA', 'Yolunuz açık olsun.',
  'KENDİNİZE BİR MOLA AYIRIN', 'Bir sonraki güzel anınız,', 'Gideros’ta.',
  'Ad soyad', 'Talebi Gönder', 'Kısa not', '(isteğe bağlı)', 'Sorunuz',
  'Konaklama tarihleri', 'Tarih seç', 'Saat seç', 'Misafir sayısı',
  'PANSİYON & RESTORAN', 'Gündoğdu Pansiyon & Restoran', 'Gündoğdu · Yardımcı Asistan',
  'Ziyaret planınız', 'Ziyaret planı asistanını aç'
]) if (valid(value)) texts.add(value);

const entries = {};
for (const text of [...texts].sort((a, b) => a < b ? -1 : a > b ? 1 : 0)) {
  const key = 'phrase.' + sha256(text);
  entries[key] = {text, hash: sha256(text)};
}
const revision = sha256(Object.keys(entries).sort().map(key => `${key}:${entries[key].hash}\n`).join(''));
const catalog = {version: 1, id: 'gundogdu-site', revision, source_language: 'tr', entries};
writeFileSync(join(site, 'assets/i18n/tr.json'), JSON.stringify(catalog, null, 2) + '\n');
console.log(`gundogdu-source-catalog-built: ${Object.keys(entries).length} entries, ${revision}`);
