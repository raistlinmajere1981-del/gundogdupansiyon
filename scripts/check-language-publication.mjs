import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {mkdtempSync, cpSync, writeFileSync, rmSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {installLocalApi, publish} from './browser-fixture.mjs';

const require = createRequire(new URL('../.local/browser-tools/package.json', import.meta.url));
const {chromium, expect} = require('@playwright/test');
const site = resolve(new URL('..', import.meta.url).pathname);
const temp = mkdtempSync(join(site, '.test-artifacts/gundogdu-language-'));
for (const name of ['assets', 'inc', 'odalar', 'qr-menu', 'restoran', 'galeri', 'iletisim', 'index.php', '404.php', 'router.php', 'robots.txt', 'sitemap.xml']) {
  cpSync(join(site, name), join(temp, name), {recursive: true});
}
const moduleRoot = installLocalApi(join(temp, 'yardimci-asistan'));
const image = '/yardimci-asistan/media/fixture/photo.webp';
const sha256 = value => createHash('sha256').update(value).digest('hex');
const sourceKey = value => 'phrase.' + sha256(value);
const business = {business_name: 'YEREL TEST Kıyı Evi', profile_id: 'pension_restaurant', phone: '+90 (555) 010 20 30',
  whatsapp: '+90 555 010 20 30', whatsapp_enabled: true, email: 'fixture@example.test', address: 'Yalnız Test Sokak No:7',
  latitude: 40.1234, longitude: 30.4321, directions_note: 'Yalnız izole test kapısı.', about_text: 'YALNIZ YEREL API TEST METNİ',
  gallery: [], social_links: []};
const room = {id: 'fixture-room', name: 'YEREL TEST Odası', description: 'İşletme odası değildir; fixture.', capacity: 2,
  bed_info: 'YEREL TEST yatak', nightly_price_minor: 123456, currency: 'TRY', price_note: 'Yalnız test fiyatıdır.', media: []};
const caps = ['core.customers', 'customer.requests', 'accommodation.rooms', 'accommodation.reservations', 'food_service.reservations', 'service.whatsapp'];
publish(moduleRoot, 'android_snapshot', {enabled: false, business_capabilities: caps});
publish(moduleRoot, 'business_context', business);
publish(moduleRoot, 'room_catalog', {version: 1, enabled: true, rooms: [room]});
publish(moduleRoot, 'table_catalog', {version: 1, enabled: true, tables: []});
publish(moduleRoot, 'menu', {enabled: true, categories: [], items: []});
publish(moduleRoot, 'marketing_website', {version: 1, enabled: true, publications: []});

const freePort = () => new Promise(resolvePort => {
  const server = createServer();
  server.listen(0, '127.0.0.1', () => { const port = server.address().port; server.close(() => resolvePort(port)); });
});
const apiPort = await freePort(), sitePort = await freePort();
const origin = 'http://127.0.0.1:' + sitePort, apiOrigin = 'http://127.0.0.1:' + apiPort;
writeFileSync(join(temp, 'fixture-router.php'), '<?php return require __DIR__."/yardimci-asistan/fixture.php";');
writeFileSync(join(temp, 'site-router.php'), `<?php
if (str_starts_with($_SERVER['REQUEST_URI'],'/yardimci-asistan/')) {
  $handle=curl_init('${apiOrigin}'.$_SERVER['REQUEST_URI']);
  curl_setopt_array($handle,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_TIMEOUT_MS=>2000,CURLOPT_CUSTOMREQUEST=>$_SERVER['REQUEST_METHOD']]);
  $body=curl_exec($handle); http_response_code(curl_getinfo($handle,CURLINFO_RESPONSE_CODE) ?: 503);
  header('Content-Type: '.(curl_getinfo($handle,CURLINFO_CONTENT_TYPE) ?: 'application/json')); header('Cache-Control: no-store'); echo $body; curl_close($handle); return true;
}
return require __DIR__.'/router.php';`);
const servers = [];
let log = '';
const server = (port, router) => {
  const child = spawn('php', ['-d', 'opcache.enable_cli=0', '-S', '127.0.0.1:' + port, router], {cwd: temp, stdio: ['ignore', 'ignore', 'pipe']});
  child.stderr.on('data', chunk => { log += chunk; });
  servers.push(child);
};
server(apiPort, 'fixture-router.php');
server(sitePort, 'site-router.php');
const disabled = {version: 1, source_language: 'tr', target_languages: [], translations: [],
  languages: [{code: 'tr', name: 'Türkçe', nativeName: 'Türkçe', locale: 'tr-TR', direction: 'ltr'}]};
let browser;
const report = {checks: [], pageErrors: []};
const check = name => report.checks.push(name);
try {
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(apiOrigin + '/yardimci-asistan/api/business.php')).ok) break; } catch {}
    await new Promise(resolveWait => setTimeout(resolveWait, 100));
  }
  const catalogResponse = await fetch(origin + '/?resource=translation-source');
  assert.equal(catalogResponse.status, 200);
  const catalog = await catalogResponse.json();
  assert.equal(catalog.id, 'gundogdu-site');
  assert.equal(catalog.source_language, 'tr');
  assert.match(catalog.revision, /^[a-f0-9]{64}$/);
  assert(catalog.entries[sourceKey('Odalar')] && catalog.entries[sourceKey('Ad soyad')]);
  check('Root catalog route is app-valid: id, Turkish source, hashes and revision');

  const siteText = {
    'Odalar': 'Published rooms',
    'Ad soyad': 'Full name',
    'Oda detayları': 'Published room details',
    'Rezervasyon': 'Published reservation',
    'Dil değiştir': 'Change language'
  };
  const enabled = {
    version: 1, source_language: 'tr', target_languages: ['en'],
    languages: [
      {code: 'tr', name: 'Türkçe', nativeName: 'Türkçe', locale: 'tr-TR', direction: 'ltr'},
      {code: 'en', name: 'English', nativeName: 'English', locale: 'en-GB', direction: 'ltr'}
    ],
    site_catalog: {id: catalog.id, entries: catalog.entries},
    translations: {site_text: Object.fromEntries(Object.entries(siteText).map(([source, translated]) =>
      [catalog.id + ':' + sourceKey(source), {en: {text: translated}}]))}
  };
  const enabledBusiness = {...business, localization: enabled};
  const enabledRoom = {enabled: true, rooms: [room], localization: {version: 1, source_language: 'tr', target_languages: ['en'],
    translations: {room: {'fixture-room': {en: {name: 'Published English Room'}}}}}};

  browser = await chromium.launch({executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/usr/bin/brave', headless: true, args: ['--no-sandbox']});
  const context = await browser.newContext({viewport: {width: 1440, height: 1000}});
  await context.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:') || route.request().url().startsWith('data:') ? route.continue() : route.abort());
  const page = await context.newPage();
  page.on('pageerror', error => report.pageErrors.push(error.message));
  const staticEnglish = [];
  let documentLoads = 0;
  page.on('request', request => {
    if (request.resourceType() === 'document') documentLoads++;
    if (request.url().includes('/assets/i18n/en.json')) staticEnglish.push(request.url());
  });
  const visit = async url => {
    const response = await page.goto(url, {waitUntil: 'domcontentloaded'});
    await expect(page.locator('body')).toHaveAttribute('data-public-state', 'ready', {timeout: 10000});
    return response;
  };

  publish(moduleRoot, 'business_context', {...business, localization: disabled});
  const disabledPage = await (await fetch(origin + '/odalar/oda/?id=fixture-room&lang=en')).text();
  assert(!disabledPage.includes('GundogduEnglish'));
  await visit(origin + '/odalar/oda/?id=fixture-room&lang=en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
  await expect(page.locator('[data-flag-language]:visible')).toHaveCount(0);
  await expect(page.locator('.desktop-nav')).toContainText('Odalar');
  await expect(page.locator('[data-room-name]').last()).toHaveText(room.name);
  await context.addCookies([
    {name: 'gundogdu_language', value: 'en', url: origin, httpOnly: true},
    {name: 'gundogdu_site_language', value: 'en', url: origin}
  ]);
  await visit(origin + '/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
  await expect(page.locator('[data-flag-language]:visible')).toHaveCount(0);
  await expect(page.locator('[data-public-about]')).toHaveText(business.about_text);
  assert(!(await context.cookies(origin)).some(cookie => cookie.name === 'gundogdu_language'), 'retired HttpOnly cookie must be expired server-side');
  assert.deepEqual(staticEnglish, []);
  check('Published target_languages [] forces TR with no selector even for ?lang=en and old HttpOnly/client cookies; the server expires the retired cookie and no static English asset is loaded');

  publish(moduleRoot, 'business_context', enabledBusiness);
  publish(moduleRoot, 'room_catalog', enabledRoom);
  const beforeEnabledVisit = documentLoads;
  await visit(origin + '/odalar/oda/?id=fixture-room&lang=en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  assert.equal(await page.evaluate(() => location.pathname + location.search), '/odalar/oda/?id=fixture-room&lang=en');
  await page.waitForTimeout(500);
  assert.equal(documentLoads, beforeEnabledVisit + 1, 'authorized language must apply without a reload loop');
  await expect(page.locator('[data-flag-language]')).toBeVisible();
  await expect(page.locator('[data-flag-language] button[name=lang]')).toHaveCount(2);
  await expect(page.locator('.desktop-nav')).toContainText('Published rooms');
  await expect(page.locator('[data-room-name]').last()).toHaveText('Published English Room');
  await page.locator('[data-room-reserve]').click();
  await expect(page.locator('[data-ya-form]')).toBeVisible();
  await expect(page.locator('[data-ya-form]')).toContainText('Full name');
  await page.keyboard.press('Escape');
  check('Published target language applies only declared metadata and application-owned site/record text after business GET; deep-link id survives');

  await page.locator('[data-flag-language] summary').click();
  await page.locator('[data-flag-language] button[name=lang][value=tr]').click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('body')).toHaveAttribute('data-public-state', 'ready', {timeout: 10000});
  await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
  await expect(page.locator('.desktop-nav')).toContainText('Odalar');
  await expect(page.locator('[data-room-name]').last()).toHaveText(room.name);
  await page.locator('[data-flag-language] summary').click();
  await page.locator('[data-flag-language] button[name=lang][value=en]').click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('body')).toHaveAttribute('data-public-state', 'ready', {timeout: 10000});
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await visit(origin + '/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('[data-flag-language]')).toBeVisible();
  check('Picker switches in-page without losing the path/query and the authorized choice survives navigation');

  await context.addCookies([
    {name: 'gundogdu_language', value: 'en', url: origin, httpOnly: true},
    {name: 'gundogdu_site_language', value: 'tr', url: origin}
  ]);
  await visit(origin + '/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
  await expect(page.locator('.desktop-nav')).toContainText('Odalar');
  assert(!(await context.cookies(origin)).some(cookie => cookie.name === 'gundogdu_language'), 'retired HttpOnly cookie must not survive');
  check('The uniquely named client cookie is authoritative; the retired HttpOnly cookie is expired and cannot override it');

  publish(moduleRoot, 'business_context', {...business, localization: disabled});
  await visit(origin + '/odalar/oda/?id=fixture-room&lang=en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
  await expect(page.locator('[data-flag-language]:visible')).toHaveCount(0);
  await expect(page.locator('.desktop-nav')).toContainText('Odalar');
  await expect(page.locator('[data-room-name]').last()).toHaveText(room.name);
  check('Disabling publication removes the selector and all client translations even with the previous cookie');

  assert.deepEqual(report.pageErrors, []);
  assert(!/PHP (?:Warning|Fatal|Parse error)/.test(log));
  assert.deepEqual(staticEnglish, []);
  console.log('gundogdu-language-publication-ok: ' + report.checks.length + ' checks');
} finally {
  await browser?.close();
  for (const child of servers) child.kill('SIGTERM');
  rmSync(temp, {recursive: true, force: true});
}
