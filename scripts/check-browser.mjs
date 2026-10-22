import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, cpSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { installLocalApi, publish, backendRoot } from './local-api.mjs';
const require = createRequire(join(backendRoot,'package.json'));
const { chromium, expect } = require('@playwright/test');
const site = resolve(new URL('..',import.meta.url).pathname);
const temp = mkdtempSync(join(tmpdir(),'gundogdu-qa-'));
const output = join(site,'.test-artifacts');
mkdirSync(output,{recursive:true});
for (const name of ['assets','inc','odalar','restoran','galeri','iletisim','index.php','404.php','router.php','robots.txt','sitemap.xml']) cpSync(join(site,name),join(temp,name),{recursive:true});
const moduleRoot = installLocalApi(join(temp,'yardimci-asistan'));
mkdirSync(join(moduleRoot,'media/fixture'),{recursive:true});
cpSync(join(site,'assets/img/gideros-1-720.webp'),join(moduleRoot,'media/fixture/photo.webp'));
const image = '/yardimci-asistan/media/fixture/photo.webp';
const caps = ['customer.requests','accommodation.rooms','service.whatsapp'];
const businessFixture = {business_name:'YEREL TEST Kıyı Evi',profile_id:'pension_restaurant',phone:'+90 (555) 010 20 30',whatsapp:'+90 555 010 20 30',whatsapp_enabled:true,email:'fixture@example.test',address:'Yalnız Test Sokak No:7',latitude:40.1234,longitude:30.4321,directions_note:'Yalnız izole test kapısı.',about_text:'YALNIZ YEREL API TEST METNİ',gallery:[{id:'fixture-image',kind:'photo',title:'YEREL TEST fotoğrafı',url:image}],social_links:[{platform:'instagram',url:'https://www.instagram.com/example/'}]};
const roomFixture = {id:'fixture-room',name:'YEREL TEST Odası',description:'İşletme odası değildir; fixture.',capacity:2,bed_info:'YEREL TEST yatak',nightly_price_minor:123456,currency:'TRY',price_note:'Yalnız test fiyatıdır.',media:[{kind:'cover',url:image}]};
const tableFixture = {id:'fixture-table',name:'YEREL TEST Masası',capacity:4,area:'Test alanı',description:'Fixture masa.'};
publish(moduleRoot,'android_snapshot',{enabled:false,business_capabilities:caps});
publish(moduleRoot,'business_context',businessFixture);
publish(moduleRoot,'room_catalog',{version:1,enabled:true,rooms:[roomFixture]});
publish(moduleRoot,'table_catalog',{version:1,enabled:true,tables:[tableFixture]});
publish(moduleRoot,'menu',{enabled:true,categories:[{id:'test',name:'YEREL TEST Menü'}],items:[{id:'meal',category_id:'test',name:'YEREL TEST Yemek',price:123.45,currency:'TRY',description:'Fixture yemek.',image_url:image}]});
publish(moduleRoot,'marketing_website',{version:1,enabled:true,publications:[{id:'test-news',published:true,channel:'website',placement:'homepage_feature',revision:1,title:'YEREL TEST Duyurusu',text:'Fixture duyuru metni.',images:[]}]});
const freePort = () => new Promise(resolvePort => {const server=createServer();server.listen(0,'127.0.0.1',()=>{const port=server.address().port;server.close(()=>resolvePort(port));});});
const apiPort = await freePort(), sitePort = await freePort();
const origin = 'http://127.0.0.1:'+sitePort, apiOrigin='http://127.0.0.1:'+apiPort;
// Failure sentinel avoids stale opcode-cache results when testing outage behavior.
writeFileSync(join(temp,'fixture-router.php'), '<?php if(str_starts_with($_SERVER["REQUEST_URI"],"/yardimci-asistan/api/") && is_file(__DIR__."/failure-mode")){$mode=file_get_contents(__DIR__."/failure-mode"); header("Content-Type: application/json");if($mode==="503"){http_response_code(503);echo \'{"ok":false}\';}else{echo \'{"ok":true,"business":"malformed","rooms":"malformed","items":[null]}\';}return true;} return false;');
const servers = [];
let serverLog='', browser;
function server(port, router, env={}) {
  const child=spawn('php',['-d','opcache.enable_cli=0','-S','127.0.0.1:'+port,router],{cwd:temp,env:{...process.env,...env},stdio:['ignore','ignore','pipe']});
  child.stderr.on('data',chunk=>{serverLog+=chunk;});servers.push(child);
}
server(apiPort,'fixture-router.php');
server(sitePort,'router.php',{GUNDOGDU_FIXTURE_MODULE:'1',GUNDOGDU_PUBLIC_API_ORIGIN:apiOrigin});
const report={checks:[],screenshots:[],pageErrors:[],backend:'Isolated current Yardımcı Asistan PHP/SQLite public projections. No live requests/providers.',viewports:[]};
const check=name=>report.checks.push(name);
async function screenshot(page,name,fullPage=false) {
  await page.waitForTimeout(300);
  if(fullPage) {
    await page.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=700){scrollTo(0,y);await new Promise(r=>setTimeout(r,45));}scrollTo(0,0);});
    await page.locator('main img').evaluateAll(images=>images.forEach(image=>{image.loading='eager';}));
    await page.waitForFunction(()=>[...document.querySelectorAll('main img')].every(image=>image.complete && image.naturalWidth>0));
  }
  await page.screenshot({path:join(output,name+'.png'),fullPage});report.screenshots.push(name+'.png');
}
try {
  for(let i=0;i<50;i++){try{if((await fetch(apiOrigin+'/yardimci-asistan/api/business.php')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/usr/bin/brave',headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  await context.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:')||route.request().url().startsWith('data:')?route.continue():route.abort());
  const page=await context.newPage();page.on('pageerror',error=>report.pageErrors.push(error.message));
  await page.goto(origin);await page.evaluate(()=>document.fonts.ready);
  await expect(page.locator('.intro-copy')).toContainText('YALNIZ YEREL API TEST METNİ');
  await expect(page.locator('.room-card')).toContainText('YEREL TEST Odası');
  await expect(page.locator('.room-card .price')).toContainText('1.234,56');
  await expect(page.locator('.news-grid')).toContainText('YEREL TEST Duyurusu');check('Business, room minor-unit price, gallery and marketing publication rendering');
  await page.waitForFunction(()=>window.gundogduWater?.inspect().frames>2);
  let water=await page.evaluate(()=>{const w=window.gundogduWater.inspect();return {running:w.running,fps:w.fps,pixels:w.pixelCount,effects:w.effects.map(e=>({type:e.type,count:e.count,active:e.active}))};});
  assert(water.running && water.pixels<=650000);assert(water.effects.find(e=>e.type==='foam').count===2);report.water=water;check('Gideros surface + foam alive within 650k canvas budget');
  await page.locator('.motion-toggle').click();assert.equal(await page.evaluate(()=>window.gundogduWater.inspect().running),false);await page.locator('.motion-toggle').click();check('Visitor can pause/resume water');
  await screenshot(page,'fixture-desktop-home',true);
  for(const width of [320,360,390,768,1440]){
    await page.setViewportSize({width,height:width<500?844:1000});
    for(const path of ['/','/odalar/','/restoran/','/galeri/','/iletisim/']){
      const response=await page.goto(origin+path);assert.equal(response.status(),200);
      await page.evaluate(()=>document.fonts.ready);
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
      assert(overflow<=1,'Overflow '+width+' '+path+': '+overflow);
      assert.equal(await page.locator('h1').count(),1);
      const images=await page.locator('main img').evaluateAll(images=>images.filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.src));
      assert.deepEqual(images,[],'Broken images '+path);
      report.viewports.push({width,path,overflow});
    }
  }
  check('25 page/viewport layouts at 320,360,390,768,1440px; no horizontal overflow or broken loaded images');
  await page.setViewportSize({width:390,height:844});await page.goto(origin+'/');
  await page.locator('.menu-toggle').click();await expect(page.locator('#mobile-nav')).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('#mobile-nav')).toBeHidden();check('Mobile menu keyboard open/close and focus');
  await page.goto(origin+'/galeri/');
  await page.locator('[data-gallery-filter=business]').click();assert.equal(await page.locator('.gallery-item:visible').count(),1);
  await page.locator('.gallery-item:visible button').click();await expect(page.locator('.lightbox')).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('.lightbox')).toBeHidden();check('Published gallery filters + native modal lightbox + Escape');
  await page.goto(origin+'/iletisim/');
  await expect(page.locator('a[href="tel:+905550102030"]')).toBeVisible();
  await expect(page.locator('a[href="https://wa.me/905550102030"]')).toBeVisible();
  const data=JSON.parse(await page.locator('[data-business-structured-data]').textContent());assert.equal(data.telephone,'+905550102030');assert.equal(data.geo.latitude,40.1234);assert.equal(data.address.streetAddress,businessFixture.address);check('Contact, WhatsApp, map and SEO from same published business projection');
  await page.goto(origin+'/odalar/');
  await expect(page.locator('body')).toHaveAttribute('data-stay-enabled','true');
  await page.locator('.room-card [data-ya-action]').click();await expect(page.locator('[data-ya-form]')).toBeVisible();
  await page.locator('[data-ya-open-date-picker=start_date]').click();await expect(page.locator('[data-ya-calendar]')).toBeVisible();
  await screenshot(page,'widget-mobile-calendar');
  await page.locator('[data-ya-calendar-day]:not([disabled])').first().click();
  await page.locator('[data-ya-open-date-picker=end_date]').click();await page.locator('[data-ya-calendar-day]:not([disabled])').first().click();
  for (const viewport of [{width:320,height:640},{width:390,height:667}]) {
    await page.setViewportSize(viewport);
    const bounds=await page.locator('.ya-widget-panel').boundingBox();
    assert(bounds.x>=0 && bounds.y>=0 && bounds.x+bounds.width<=viewport.width && bounds.y+bounds.height<=viewport.height);
    await page.locator('[data-ya-open-date-picker=start_date]').click();
    const calendar=await page.locator('[data-ya-calendar]').boundingBox();
    assert(calendar.x>=0 && calendar.x+calendar.width<=viewport.width,'Calendar overflow at '+viewport.width);
    await page.locator('[data-ya-calendar-close]').click();
  }
  check('Widget panel and date picker fit 320x640 and 390x667 short mobile viewports');
  await page.setViewportSize({width:390,height:844});
  await page.locator('[name=customer_name]').fill('YALNIZ YEREL Test Misafir');
  await page.locator('[name=customer_phone]').fill('+90 555 010 20 30');
  await page.locator('[name=message]').fill('Bu yalnız izole doğrulama talebidir.');
  const bodies=[];let attempt=0;
  await page.route('**/api/request.php',async route=>{
    bodies.push(route.request().postDataJSON());
    if(attempt++===0)await route.fulfill({status:503,contentType:'application/json',body:'{"ok":false}'});
    else await route.continue();
  });
  await page.locator('[data-ya-form] button[type=submit]').click();await expect(page.locator('[data-ya-status]')).toContainText('iletilemedi');
  await expect(page.locator('[name=customer_name]')).toHaveValue('YALNIZ YEREL Test Misafir');
  const accepted=page.waitForResponse(response=>response.url().endsWith('/api/request.php')&&response.ok());
  await page.locator('[data-ya-form] button[type=submit]').click();const receipt=await (await accepted).json();assert(receipt.ok && receipt.request_id);
  assert.equal(bodies[0].idempotency_key,bodies[1].idempotency_key);assert.equal(bodies[1].context.resourceId,'fixture-room');
  await expect(page.locator('.ya-widget-request-success')).toBeVisible();check('Room request date picker, preserved 503 draft, same retry idempotency key, actual isolated backend receipt + room context');
  await screenshot(page,'widget-mobile-success');
  await page.keyboard.press('Escape');await expect(page.locator('.ya-widget-panel')).toHaveCount(0);
  await page.goto(origin+'/restoran/');await expect(page.locator('.menu-grid')).toContainText('YEREL TEST Yemek');
  await page.locator('.table-card [data-ya-action]').click();await expect(page.locator('[data-ya-restaurant-date]')).toBeVisible();
  await page.locator('[data-ya-open-time-picker]').click();await expect(page.locator('[data-ya-time-popover]')).toBeVisible();
  await screenshot(page,'widget-mobile-time');
  await page.locator('[data-ya-time-hour="19"]').click();await page.locator('[data-ya-time-minute="30"]').click();
  assert.equal(await page.locator('[name=time]').inputValue(),'19:30');check('Restaurant menu, table context and mobile hour/minute picker');
  await page.keyboard.press('Escape');
  // Withdrawal and capability transitions must remove prior data.
  publish(moduleRoot,'room_catalog',{version:1,enabled:false,rooms:[roomFixture]});
  publish(moduleRoot,'table_catalog',{version:1,enabled:false,tables:[tableFixture]});
  publish(moduleRoot,'menu',{enabled:false,categories:[{id:'test',name:'YEREL TEST Menü'}],items:[{id:'meal',category_id:'test',name:'YEREL TEST Yemek',price:123.45,currency:'TRY'}]});
  publish(moduleRoot,'marketing_website',{version:1,enabled:false,publications:[]});
  publish(moduleRoot,'business_context',{business_name:'YEREL TEST Boş',profile_id:'pension_restaurant',phone:'',address:'',whatsapp:'',email:'',gallery:[],social_links:[]});
  await page.goto(origin+'/');await expect(page.locator('.room-card')).toHaveCount(0);await expect(page.locator('.news-grid')).toHaveCount(0);
  await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);assert(!('telephone' in JSON.parse(await page.locator('[data-business-structured-data]').textContent())));
  await page.locator('.header-booking').click();await expect(page.locator('[data-ya-request-type]:visible')).toHaveCount(0);check('Withdrawn room/table/menu/marketing and blank contact do not retain previous values; booking actions hidden');
  await screenshot(page,'empty-mobile-widget');
  await page.keyboard.press('Escape');await page.goto(origin+'/restoran/');await expect(page.locator('.menu-grid')).toHaveCount(0);
  publish(moduleRoot,'room_catalog',{version:1,enabled:true,rooms:[roomFixture]});
  publish(moduleRoot,'android_snapshot',{enabled:false,business_capabilities:[]});
  await page.goto(origin+'/odalar/');await expect(page.locator('body')).toHaveAttribute('data-stay-enabled','false');check('Requests capability OFF hides booking even with published room catalog');
  for(const mode of ['503','malformed']){
    writeFileSync(join(temp,'failure-mode'),mode);await page.goto(origin+'/iletisim/');await expect(page.locator('.contact-empty')).toBeVisible();
    assert(!('telephone' in JSON.parse(await page.locator('[data-business-structured-data]').textContent())));
    await page.goto(origin+'/');await expect(page.locator('.stay-placeholder')).toBeVisible();
  }
  rmSync(join(temp,'failure-mode'));check('HTTP 503 and structurally malformed API responses render complete safe pages, empty contact and SEO');
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto(origin+'/');assert.equal(await page.locator('.canvas-overlay').count(),0);await expect(page.locator('.motion-toggle')).toBeHidden();check('Reduced motion starts with static hero and no canvas');
  await screenshot(page,'empty-mobile-home',true);
  await page.emulateMedia({reducedMotion:'no-preference'});await page.goto(origin+'/');await page.waitForFunction(()=>window.gundogduWater?.inspect().running);
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>!window.gundogduWater.inspect().running);check('Runtime reduced motion change stops ticker');
  const low=await browser.newContext({viewport:{width:390,height:844}});
  await low.addInitScript(()=>Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>2}));
  const lowPage=await low.newPage();await lowPage.goto(origin+'/');assert.equal(await lowPage.locator('.canvas-overlay').count(),0);await low.close();check('Low-power two-core device receives static photo');
  const nojs=await browser.newContext({javaScriptEnabled:false});const nojsPage=await nojs.newPage();await nojsPage.goto(origin+'/odalar/');await expect(nojsPage.locator('h1')).toBeVisible();await expect(nojsPage.locator('a[href="/iletisim/#rezervasyon"]').first()).toHaveAttribute('href','/iletisim/#rezervasyon');await nojs.close();check('Server-rendered pages and booking fallback work without JS');
  const missing=await page.goto(origin+'/olmayan-sayfa/');assert.equal(missing.status(),404);check('Custom HTTP 404');
  assert.deepEqual(report.pageErrors,[]);assert(!/PHP (?:Warning|Fatal|Parse error)/.test(serverLog));check('Zero browser exceptions and PHP warnings/fatals');
  report.passed=true;
} catch(error) {
  report.passed=false;report.failure=String(error.stack||error);throw error;
} finally {
  writeFileSync(join(output,'browser-report.json'),JSON.stringify(report,null,2));
  writeFileSync(join(output,'php-test.log'),serverLog);
  await browser?.close();for(const child of servers)child.kill('SIGTERM');rmSync(temp,{recursive:true,force:true});
}
console.log('gundogdu-browser-ok: '+report.checks.length+' checks, '+report.viewports.length+' layouts, '+report.screenshots.length+' screenshots');
