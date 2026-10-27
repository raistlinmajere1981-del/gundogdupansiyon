import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import net from 'node:net';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {fixtureServer,proxyServer,freshState} from './fixture.mjs';
const require=createRequire(new URL('../../../.local/browser-tools/package.json',import.meta.url));
const {chromium,expect}=require('@playwright/test');
const root=fileURLToPath(new URL('../../',import.meta.url));
const artifacts=fileURLToPath(new URL('../../../.test-artifacts/canonical/',import.meta.url));
await mkdir(artifacts,{recursive:true});
const mark=await readFile(root+'public/assets/site/brand/mark.svg');
const state=freshState(),api=await fixtureServer(state),results=[];
const port=await new Promise(r=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p));});});
const php=spawn('php',['-d','opcache.enable=0','-S',`127.0.0.1:${port}`,'-t',root+'public'],{env:{...process.env,YA_SITE_API_ORIGIN:api.origin},stdio:'ignore'});
let proxy,browser;
const reset=()=>Object.assign(state,freshState());
const fits=async page=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal overflow');
const capture=async(page,name)=>{
  await page.locator('img').evaluateAll(async images=>{
    images.forEach(img=>{if(img.loading==='lazy')img.loading='eager';});
    await Promise.all(images.filter(img=>img.currentSrc||img.src).map(img=>img.decode()));
  });
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({animations:'disabled',path:artifacts+name,fullPage:true});
};
try {
  for(let n=0;;n++){try{assert.equal((await fetch(`http://127.0.0.1:${port}`)).status,200);break;}catch(e){if(n>80)throw e;await new Promise(r=>setTimeout(r,40));}}
  proxy=await proxyServer(`http://127.0.0.1:${port}`,api.origin);const base=proxy.origin;
  browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/usr/bin/brave',args:['--no-sandbox','--disable-gpu']});
  const scenario=async(name,run,options={})=>{
    reset();const context=await browser.newContext({viewport:{width:390,height:900},...options});
    await context.route('**/*',route=>route.request().url()==='https://media.example.test/TEST-mark.svg'?route.fulfill({contentType:'image/svg+xml',body:mark}):new URL(route.request().url()).origin===base?route.continue():route.abort());
    const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
    try{await run(page);assert.deepEqual(errors,[],'browser script errors');results.push(name);console.log('PASS',name);}finally{await context.close();}
  };
  await scenario('publication gates: surface, disabled, empty, endpoint failure and business outage',async page=>{
    for(const [route,key,selector] of [['rooms','rooms','#rooms-preview'],['restaurant','tables','.restaurant-preview'],['menu','menu','.restaurant-preview']]){
      for(const mode of ['surface-off','enabled-off','zero','error','business-error']){
        reset();state.surfaces=route==='rooms'?['rooms']:route==='restaurant'?['restaurant']:['qr_menu'];
        if(mode==='surface-off')state.surfaces=[];if(mode==='enabled-off')state.enabled=false;if(mode==='zero')state[key]=[];if(mode==='error')state.endpointError=key;if(mode==='business-error')state.businessError=true;
        assert.equal((await page.goto(base+'/?page='+route)).status(),404,route+':'+mode);
        await expect(page.locator(`a[href*="page=${route}"]`)).toHaveCount(0);
        await page.goto(base+'/');await expect(page.locator(selector)).toHaveCount(0);
      }
    }
    reset();state.businessError=true;await page.goto(base+'/');await expect(page.locator('.empty-state')).toBeVisible();await expect(page.locator('#yardimci-asistan-widget')).toHaveCount(0);
    reset();await page.goto(base+'/?page=rooms&id=TEST-room');assert.equal((await page.goto(base+'/?page=rooms&id=unknown')).status(),404);state.rooms=[];assert.equal((await page.goto(base+'/?page=rooms&id=TEST-room')).status(),404);
  });
  await scenario('menu stays available with tables off',async page=>{
    state.surfaces=['qr_menu'];await page.goto(base+'/');await expect(page.locator('.hero-actions a[href*="page=menu"]')).toBeVisible();await expect(page.locator('a[href*="page=restaurant"]')).toHaveCount(0);assert.equal((await page.goto(base+'/?page=menu')).status(),200);await expect(page.locator('main')).toContainText('TEST Menü kalemi');
  });
  await scenario('AI OFF general request has no reservation date; keyboard close restores focus',async page=>{
    state.surfaces=[];await page.goto(base+'/');const launcher=page.locator('[data-ya-open]');await launcher.click();
    await expect(page.locator('#ya-widget-title')).toHaveText('Ziyaret yardımcısı');
    await expect(page.locator('[data-ya-view="info"],[data-ya-view="voice"]')).toHaveCount(0);
    await capture(page,'widget-home-390.png');
    await page.locator('[data-ya-request-type="general_info"]').click();await expect(page.locator('input[name="customer_name"]')).toBeVisible();
    await expect(page.locator('[data-ya-open-date-picker],#yardimci-asistan-widget input[type="date"]')).toHaveCount(0);
    await fits(page);await capture(page,'widget-general-390.png');
    await page.keyboard.press('Escape');await expect(launcher).toBeFocused();
  });
  await scenario('room and table requests require separate canonical request types',async page=>{
    await page.goto(base+'/?page=rooms&id=TEST-room');await expect(page.locator('[data-ya-action="accommodation.reserve"]')).toHaveCount(0);
    await page.goto(base+'/?page=restaurant');await expect(page.locator('[data-ya-action="food.reserve"]')).toHaveCount(0);
    state.types=['general_info','pension_reservation','restaurant_reservation'];await page.goto(base+'/');await page.locator('[data-ya-open]').click();
    const actions=page.locator('.ya-widget-actions button');await expect(actions).toHaveCount(3);assert.deepEqual(await actions.evaluateAll(nodes=>nodes.map(node=>node.dataset.yaRequestType)),state.types.toSorted((a,b)=>['pension_reservation','restaurant_reservation','general_info'].indexOf(a)-['pension_reservation','restaurant_reservation','general_info'].indexOf(b)));
    await page.locator('[data-ya-request-type="pension_reservation"]').click();await expect(page.locator('[data-ya-open-date-picker]').first()).toBeVisible();await capture(page,'widget-room-390.png');
    await page.goto(base+'/?page=restaurant');await page.locator('[data-ya-action="food.reserve"]').click();await expect(page.locator('[data-ya-open-date-picker]').first()).toBeVisible();
    state.requests=false;await page.goto(base+'/');await expect(page.locator('[data-theme-widget-trigger]')).toHaveCount(0);await expect(page.locator('[data-ya-open]')).toBeHidden();
  });
  await scenario('WhatsApp and AI independent gates; all actions OFF hides launcher',async page=>{
    state.requests=false;await page.goto(base+'/');await expect(page.locator('[data-ya-open]')).toBeHidden();
    state.business={whatsapp_enabled:true,whatsapp:'+90 555 000 00 00'};await page.goto(base+'/');await page.locator('[data-ya-open]').click();await expect(page.locator('[data-ya-view="whatsapp"]')).toBeVisible();await expect(page.locator('[data-ya-view="info"]')).toHaveCount(0);
    state.business={whatsapp_enabled:true,whatsapp:'invalid'};await page.goto(base+'/');await expect(page.locator('[data-ya-open]')).toBeHidden();
    state.business={ai_enabled:true};await page.goto(base+'/');await page.locator('[data-ya-open]').click();await expect(page.locator('[data-ya-view="info"]')).toBeVisible();
  });
  for(const width of [320,390,1440])await scenario('responsive '+width+' and keyboard navigation; zero effect runtime',async page=>{
    await page.setViewportSize({width,height:1000});const resources=[];page.on('request',r=>resources.push(r.url()));await page.goto(base+'/');
    await expect(page.locator('h1')).toHaveText('Gideros’ta, hayat yavaşlar.');await fits(page);
    await expect.poll(()=>page.locator('.hero-photo').evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
    await page.evaluate(()=>document.fonts.ready);assert.equal(await page.locator('canvas').count(),0);assert.equal(resources.filter(url=>/effects\.mjs|effect-engine|\.scene\.json/.test(url)).length,0);
    if(width<761){const toggle=page.locator('[data-menu-toggle]');await toggle.focus();await page.keyboard.press('Enter');await expect(toggle).toHaveAttribute('aria-expanded','true');await page.keyboard.press('Escape');await expect(toggle).toHaveAttribute('aria-expanded','false');await expect(toggle).toBeFocused();}
    await page.goto(base+'/');await page.keyboard.press('Tab');await expect(page.locator('.skip-link')).toBeFocused();await page.keyboard.press('Enter');await expect(page.locator('#content')).toBeFocused();await page.goto(base+'/');await page.evaluate(()=>document.fonts.ready);
    await capture(page,`home-${width}.png`);
    if(width<761){await page.locator('[data-ya-open]').click();await page.locator('[data-ya-request-type=general_info]').click();await expect(page.locator('input[name=customer_name]')).toBeVisible();await fits(page);const box=await page.locator('.ya-widget-panel').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width+1);await capture(page,`widget-general-${width}.png`);await page.keyboard.press('Escape');}
    await page.goto(base+'/?page=rooms');await fits(page);await page.goto(base+'/?page=menu');await fits(page);
  });
  await scenario('no-JS SSR and keyboard photo credits',async page=>{
    await page.goto(base+'/');await expect(page.locator('#main-navigation')).toBeVisible();await expect(page.locator('#rooms-preview')).toContainText('TEST Yayınlı oda');await expect(page.locator('[data-theme-widget-trigger]:visible')).toHaveCount(0);
    const summary=page.locator('#photo-credits summary');await summary.focus();await page.keyboard.press('Enter');await expect(page.locator('#photo-credits')).toHaveAttribute('open','');await expect(page.locator('#photo-credits')).toContainText('CC BY-SA 3.0');await fits(page);await capture(page,'home-no-js-390.png');
  },{javaScriptEnabled:false});
  await scenario('long public text and long RTL translation, stale hash and withdrawn language',async page=>{
    const source=await (await fetch(base+'/?resource=translation-source')).json(),key='theme.gundogdu.hero.title';
    state.business={display_name:'TEST '+('UzunİşletmeAdı'.repeat(12)),about_text:'TEST '+('UzunYayınMetni'.repeat(35))};
    const translated='TEST '+('استراحة عند الخليج '.repeat(8));
    state.localization={version:1,source_language:'tr',target_languages:['ar'],languages:[{code:'ar',locale:'ar',direction:'rtl',nativeName:'العربية'}],site_catalog:{id:source.id,entries:source.entries},translations:{site_text:{[source.id+':'+key]:{ar:{text:translated}}}}};
    await page.goto(base+'/?lang=ar');await expect(page.locator('html')).toHaveAttribute('dir','rtl');await expect(page.locator('h1')).toHaveText(translated);await fits(page);await capture(page,'home-rtl-long-390.png');
    state.localization.site_catalog.entries[key].hash='0'.repeat(64);await page.reload();await expect(page.locator('h1')).toHaveText('Gideros’ta, hayat yavaşlar.');
    state.localization.target_languages=[];await page.reload();await expect(page.locator('html')).toHaveAttribute('lang','tr');await fits(page);
  });
  for(const width of [390,1440])await scenario('published optional blocks '+width+' and no archive photos as business media',async page=>{
    state.business={about_text:'TEST Yayınlı işletme açıklaması.',address:'TEST Adres',google_reviews_enabled:true,gallery:[{id:'TEST-media',title:'TEST yayın görseli: özgün site işareti',url:'https://media.example.test/TEST-mark.svg'}]};
    state.announcements=[{id:'TEST-news',published:true,channel:'website',title:'TEST Duyuru',text:'TEST Yayın metni'}];state.reviews=[{published:true,author:'TEST Yazar',text:'TEST Yorum'}];
    await page.setViewportSize({width,height:1000});await page.goto(base+'/');for(const selector of ['.about-preview','#gallery-preview','#announcements-preview','#reviews-preview','.visit-plan'])await expect(page.locator(selector)).toBeVisible();
    await fits(page);await capture(page,`home-full-${width}.png`);await page.goto(base+'/?page=gallery');await expect(page.locator('main img')).toHaveCount(1);assert.equal(await page.locator('main img').getAttribute('src'),'https://media.example.test/TEST-mark.svg');
    reset();assert.equal((await page.goto(base+'/?page=gallery')).status(),404);await page.goto(base+'/');await expect(page.locator('#gallery-preview,.about-preview,#announcements-preview,#reviews-preview')).toHaveCount(0);
  });
  await scenario('empty publication editorial-only and escaped public data',async page=>{
    state.surfaces=[];state.requests=false;await page.goto(base+'/');await expect(page.locator('.empty-state')).toBeVisible();await expect(page.locator('.region-section')).toBeVisible();await expect(page.locator('.hero-actions a,.hero-actions button')).toHaveCount(0);await page.setViewportSize({width:1440,height:1000});await capture(page,'home-empty-1440.png');
    state.business={about_text:'<img src=x onerror="window.TESTInjection=true">',gallery:[{id:'TEST-bad',title:'TEST',url:'javascript:alert(1)'}]};await page.goto(base+'/');await expect(page.locator('.about-preview')).toContainText('<img src=x');await expect(page.locator('img[src=x],a[href^="javascript:"]')).toHaveCount(0);assert.equal(await page.evaluate(()=>window.TESTInjection),undefined);
  });
  await writeFile(artifacts+'results.json',JSON.stringify({passed:results.length,results,artifacts},null,2)+'\n');console.log(JSON.stringify({passed:results.length,results,artifacts},null,2));
} finally {await browser?.close();await new Promise(r=>proxy?proxy.server.close(r):r());await new Promise(r=>api.server.close(r));php.kill('SIGTERM');}
