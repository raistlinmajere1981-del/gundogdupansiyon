// Host browser gate: actual root and isolated synthetic API, no live traffic.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import net from 'node:net';
import {mkdir,readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fixtureServer,proxyServer,freshState} from './fixtures/canonical-api.mjs';
const require=createRequire(new URL('../.local/browser-tools/package.json',import.meta.url));
const {chromium,expect}=require('@playwright/test');
const state=freshState();let api,proxy,php,browser;
const media=await readFile(new URL('../assets/site/img/gideros-1-1818.webp',import.meta.url));
const artifacts=new URL('../.test-artifacts/canonical-root/',import.meta.url);await mkdir(artifacts,{recursive:true});
function reset(){Object.assign(state,freshState());state.types=['general_info','pension_reservation','restaurant_reservation'];for(const record of [...state.rooms,...state.tables])record.media=[{id:'TEST-180',kind:'panorama_180',url:'/yardimci-asistan/media/TEST-180.jpg',published:true},{id:'TEST-360',kind:'panorama_360',url:'/yardimci-asistan/media/TEST-360.jpg',published:true},{id:'TEST-private',kind:'panorama_360',url:'/yardimci-asistan/media/PRIVATE.jpg',published:false}];}
try {
  api=await fixtureServer(state); // One listen attempt. EPERM is a host gate, never retried.
  const port=await new Promise((resolve,reject)=>{const server=net.createServer();server.once('error',reject);server.listen(0,'127.0.0.1',()=>{const port=server.address().port;server.close(()=>resolve(port));});});
  php=spawn('php',['-d','opcache.enable=0','-S',`127.0.0.1:${port}`,'-t','.', 'router.php'],{env:{...process.env,YA_SITE_API_ORIGIN:api.origin,YA_SITE_PUBLIC_ORIGIN:'https://gundogdu.example.test'},stdio:'ignore'});
  let ready=false;for(let i=0;i<40;i++){try{if((await fetch(`http://127.0.0.1:${port}/`)).status===200){ready=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,50));}assert.ok(ready,'PHP preview unavailable');
  proxy=await proxyServer(`http://127.0.0.1:${port}`,api.origin);const base=proxy.origin;
  browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/usr/bin/brave',args:['--no-sandbox','--disable-gpu']});
  for(const width of [390,1440]) {
    reset();const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'no-preference'}),calls=[],errors=[],submissions=[];
    await context.route('**/*',async route=>{
      const request=route.request(),url=new URL(request.url());calls.push(url.pathname);
      if(url.origin!==base)return route.abort();
      if(url.pathname==='/yardimci-asistan/api/request.php'){assert.equal(request.method(),'POST');submissions.push(request.postDataJSON());return route.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,request_id:'TEST-request'})});}
      if(url.pathname.startsWith('/yardimci-asistan/media/TEST-'))return route.fulfill({contentType:'image/webp',body:media});
      if(url.pathname==='/assets/site/scenes/TEST-invalid.json')return route.fulfill({contentType:'application/json',body:'{invalid TEST scene'});
      return route.continue();
    });
    const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
    await context.addCookies([{name:'ya_site_language',value:'en',url:base}]);
    const before=state.calls.length,source=await(await context.request.get(base+'/?resource=translation-source')).json();
    assert.equal(source.id,'gundogdu-site');assert.ok(Object.keys(source.entries).length<=2048);assert.ok(Buffer.byteLength(JSON.stringify(source))<=512*1024);assert.equal(state.calls.length,before);
    assert.equal((await context.request.post(base+'/?resource=translation-source')).status(),405);
    await page.goto(base+'/?lang=en');await expect(page.locator('html')).toHaveAttribute('lang','tr');await expect(page.locator('.language-picker')).toHaveCount(0);
    await expect(page.locator('.hero-photo')).toBeVisible();assert.equal(await page.locator('script[src="/assets/core/widget.js"]').count(),1);
    for(const [path,target] of [['/odalar/','rooms'],['/odalar/oda/?id=TEST-room','rooms'],['/restoran/','restaurant'],['/restoran/masa/?id=TEST-table','restaurant'],['/qr-menu/','menu'],['/hakkimizda/','about'],['/iletisim/','contact'],['/galeri/','gallery'],['/duyurular/','announcements'],['/yorumlar/','reviews']]) {
      const reply=await context.request.get(base+path,{maxRedirects:0});assert.equal(reply.status(),302,path);const to=new URL(reply.headers().location,base);assert.equal(to.pathname,'/');assert.equal(to.searchParams.get('page'),target);
    }
    const safe=await context.request.get(base+'/odalar/oda/?id=TEST-room&lang=en&page=menu',{maxRedirects:0});const params=new URL(safe.headers().location,base).searchParams;assert.equal(params.get('page'),'rooms');assert.equal(params.get('id'),'TEST-room');assert.equal(params.get('lang'),'en');
    for(const query of ['id[]=bad','id=%0Ainjection','redirect=https://example.test'])assert.equal((await context.request.get(base+'/odalar/?'+query)).status(),400);
    for(const [route,key] of [['rooms','rooms'],['restaurant','tables'],['menu','menu']]) {
      reset();assert.equal((await page.goto(base+'/?page='+route)).status(),200);state.surfaces=[];assert.equal((await page.goto(base+'/?page='+route)).status(),404);
      reset();state.enabled=false;assert.equal((await page.goto(base+'/?page='+route)).status(),404);
      reset();state[key]=[];assert.equal((await page.goto(base+'/?page='+route)).status(),404);
    }
    reset();state.businessError=true;await page.goto(base+'/');await expect(page.locator('#yardimci-asistan-widget')).toHaveCount(0);reset();
    const key='theme.gundogdu.hero.title';state.localization={version:1,source_language:'tr',target_languages:['en'],languages:[{code:'en',locale:'en-GB',nativeName:'English'},{code:'de',locale:'de-DE',nativeName:'Deutsch'}],site_catalog:{id:source.id,entries:source.entries},translations:{site_text:{[source.id+':'+key]:{en:{text:'TEST Published English'}}}}};
    await page.goto(base+'/?lang=en');await expect(page.locator('html')).toHaveAttribute('lang','en');await expect(page.locator('h1')).toHaveText('TEST Published English');assert.deepEqual(await page.locator('.gd-language-options a').evaluateAll(nodes=>nodes.map(node=>new URL(node.href).searchParams.get('lang'))),['tr','en']);
    await expect(page.locator('.gd-language-switcher summary img')).toHaveAttribute('src','/assets/site/brand/flag-en.svg');
    await page.locator('.gd-language-switcher summary').click();
    await expect(page.locator('.gd-language-options')).toBeVisible();
    await page.locator('.gd-language-options a[hreflang=tr]').click();
    await expect(page.locator('html')).toHaveAttribute('lang','tr');
    await expect(page.locator('.gd-language-switcher summary img')).toHaveAttribute('src','/assets/site/brand/flag-tr.svg');
    await page.goto(base+'/?page=rooms&id=TEST-room&lang=en');
    await page.locator('.gd-language-switcher summary').click();
    await page.locator('.gd-language-options a[hreflang=tr]').click();
    await expect(page.locator('html')).toHaveAttribute('lang','tr');
    assert.equal(new URL(page.url()).searchParams.get('id'),'TEST-room');
    assert.equal(new URL(page.url()).searchParams.get('page'),'rooms');
    await expect(page.locator('.language-picker button[type=submit]')).toHaveCount(0);
    reset();
    for(const [route,id] of [['rooms','TEST-room'],['restaurant','TEST-table']]) {
      await page.goto(base+`/?page=${route}&id=${id}`);
      for(const kind of ['panorama_180','panorama_360']) {const host=page.locator(`[data-panorama=${kind}]`);await expect(host).toHaveCount(1);await expect(host.locator('img')).toHaveAttribute('src',new RegExp('TEST-'+(kind.endsWith('180')?'180':'360')));const canvas=host.locator('canvas');if(await canvas.count()){await canvas.focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowLeft');}else await expect(host.locator('img')).toBeVisible();}
      await expect(page.locator('[data-src*="PRIVATE"]')).toHaveCount(0);
    }
    await page.goto(base+'/');const launcher=page.locator('[data-ya-open]');await launcher.click();await expect(page.locator('[data-ya-view="info"],[data-ya-view="voice"]')).toHaveCount(0);await page.locator('[data-ya-request-type="general_info"]').click();
    const widget=page.locator('#yardimci-asistan-widget');await expect(widget.locator('input[type=date],[data-ya-open-date-picker]')).toHaveCount(0);
    await widget.locator('[name=customer_name]').fill('TEST Visitor');await widget.locator('[name=customer_phone]').fill('+905550000000');await widget.locator('[name=message]').fill('TEST local request');await widget.locator('button[type=submit]').click();await expect.poll(()=>submissions.length).toBe(1);assert.equal(submissions[0].request_type,'general_info');assert.ok(submissions[0].idempotency_key);
    await page.keyboard.press('Escape');await expect(launcher).toBeFocused();state.requests=false;await page.goto(base+'/');await expect(page.locator('[data-ya-open]')).toBeHidden();state.business={ai_enabled:true};await page.goto(base+'/');await page.locator('[data-ya-open]').click();await expect(page.locator('[data-ya-view="info"]')).toBeVisible();reset();
    await page.goto(base+'/');await expect.poll(()=>page.locator('.hero-photo').evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
    await page.evaluate(async()=>{const {mountEffects}=await import('/assets/core/effects.mjs');window.TESTdisposeEffects=mountEffects([{slot:'TEST',source:'/assets/site/img/gideros-1-1818.webp',url:'/assets/site/scenes/TEST-invalid.json'}]);});
    await expect(page.locator('.hero-photo')).toHaveAttribute('data-effect-state','static');await expect(page.locator('.gundogdu-hero canvas')).toHaveCount(0);await page.evaluate(()=>window.TESTdisposeEffects());assert.ok(!calls.some(path=>/vendor\/effect-engine\/src|assets\/(?:js|assistant|effects)|chat\.php/.test(path)));
    for(const path of ['/canonical/site/config.php','/inc/site.php','/assets/js/site.js','/assets/assistant/widget.js'])assert.equal((await context.request.get(base+path)).status(),404,path);
    for(const path of ['/assets/core/site.mjs','/assets/core/panorama.mjs','/assets/site/theme.css','/assets/site/brand/mark.svg','/assets/vendor/effect-engine/provenance.json'])assert.equal((await context.request.get(base+path)).status(),200,path);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:new URL(`root-${width}.png`,artifacts).pathname,fullPage:true});assert.deepEqual(errors,[]);
    await context.close();console.log(`PASS actual root / 10 aliases / gates / published locale / panorama / widget / invalid effects / ${width}px`);
  }
} catch(error) {
  if(error.code==='EPERM'){console.error('HOST_BROWSER_REQUIRED: sandbox denied HTTP listen (EPERM); no retry.');process.exitCode=2;}else throw error;
} finally {
  await browser?.close();for(const resource of [proxy,api])if(resource){resource.server.closeAllConnections();await new Promise(resolve=>resource.server.close(resolve));}php?.kill('SIGTERM');
}
