// Bounded local parity checks. TEST projections are synthetic; no live service is used.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer as createHttpServer} from 'node:http';
import net from 'node:net';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {fixtureServer,proxyServer,freshState} from './fixture.mjs';
const require=createRequire(new URL('../../../.local/browser-tools/package.json',import.meta.url));
const {chromium,expect}=require('@playwright/test');
const root=fileURLToPath(new URL('../../',import.meta.url));
const artifacts=fileURLToPath(new URL('../../../../YardimciAsistan/artifacts/site-redesign-plan/gundogdu-ikinci-tur/',import.meta.url));
await mkdir(artifacts,{recursive:true});
const mark=await readFile(root+'public/assets/site/brand/mark.svg');
const canonicalOrigin='https://gundogdu.example.test';
const state=freshState();
let menuData;
const reset=()=>{
  Object.assign(state,freshState());state.accountEnabled=false;state.publicationMarker={enabled:true,server_revision:1,fields:['business_name','description','phone','email','address','gallery','social_links']};
  state.types=['general_info','pension_reservation','restaurant_reservation'];
  for(const record of [...state.rooms,...state.tables])record.media=[{kind:'cover',url:'https://media.example.test/TEST-mark.svg',title:'TEST site işareti; tesis fotoğrafı değildir.'}];
  state.tables[0].description='TEST masa açıklaması; gerçek işletme kaydı değildir.';
  menuData={ok:true,enabled:true,updated_at:'2026-10-26T12:30:00+03:00',categories:[{id:'TEST-category',name:'TEST Birinci kategori'},{id:'TEST-second',name:'TEST İkinci kategori'}],items:[{id:'TEST-item',category_id:'TEST-category',name:'TEST Birinci ürün',price:100,currency:'TRY'},{id:'TEST-item-2',category_id:'TEST-second',name:'TEST İkinci ürün',price:200,currency:'TRY'}]};
};
reset();
const api=await fixtureServer(state);
const wrapper=createHttpServer(async(req,res)=>{
  if(new URL(req.url,'http://test.local').pathname==='/yardimci-asistan/api/account/config.php'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({ok:true,enabled:state.accountEnabled,passwordRegistration:state.accountEnabled,providers:[]}));return;}
  if(new URL(req.url,'http://test.local').pathname==='/yardimci-asistan/api/menu.php'){
    state.calls.push('menu');res.writeHead(state.endpointError==='menu'?503:200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(state.endpointError==='menu'?{ok:false}:{...menuData,enabled:state.enabled&&menuData.enabled}));return;
  }
  try{const upstream=await fetch(api.origin+req.url);res.writeHead(upstream.status,{'Content-Type':upstream.headers.get('content-type')||'application/json','Cache-Control':'no-store'});const text=await upstream.text();if(new URL(req.url,'http://test.local').pathname==='/yardimci-asistan/api/business.php'){const data=JSON.parse(text);data.business_publication=state.publicationMarker;res.end(JSON.stringify(data));}else res.end(text);}catch{res.writeHead(503);res.end('{}');}
});
await new Promise(r=>wrapper.listen(0,'127.0.0.1',r));
const apiOrigin=`http://127.0.0.1:${wrapper.address().port}`;
const port=await new Promise(r=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p));});});
const php=spawn('php',['-d','opcache.enable=0','-S',`127.0.0.1:${port}`,'-t',root+'public',root+'site/router.php'],{env:{...process.env,YA_SITE_API_ORIGIN:apiOrigin,YA_SITE_PUBLIC_ORIGIN:canonicalOrigin},stdio:'ignore'});
let browser,proxy;const results=[];
const fits=async page=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal overflow');
const capture=async(page,name)=>{
  await page.locator('img').evaluateAll(async images=>{images.forEach(img=>{if(img.loading==='lazy')img.loading='eager';});await Promise.all(images.filter(img=>img.src).map(img=>img.decode()));});
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:join(artifacts,name),fullPage:true,animations:'disabled'});
};
try{
  for(let n=0;;n++){try{assert.equal((await fetch(`http://127.0.0.1:${port}`)).status,200);break;}catch(e){if(n>100)throw e;await new Promise(r=>setTimeout(r,30));}}
  proxy=await proxyServer(`http://127.0.0.1:${port}`,apiOrigin);const base=proxy.origin;
  browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/usr/bin/brave',args:['--no-sandbox','--disable-gpu']});
  const scenario=async(name,run,options={})=>{
    reset();const context=await browser.newContext({viewport:{width:390,height:1000},...options});
    await context.route('**/*',route=>route.request().url()==='https://media.example.test/TEST-mark.svg'?route.fulfill({contentType:'image/svg+xml',body:mark}):new URL(route.request().url()).origin===base?route.continue():route.abort());
    const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
    try{await run(page,context);assert.deepEqual(errors,[],'browser runtime errors');results.push(name);console.log('PASS',name);}finally{await context.close();}
  };
  await scenario('published room/table detail, media and canonical reservation context',async page=>{
    for(const [route,id,action,label] of [['rooms','TEST-room','accommodation.reserve','TEST Yayınlı oda'],['restaurant','TEST-table','food.reserve','TEST Yayınlı masa']]){
      await page.goto(base+'/?page='+route);await expect(page.locator(`main a[href*="id=${id}"]`).first()).toBeVisible();
      const response=await page.goto(base+`/?page=${route}&id=${id}`);assert.equal(response.status(),200);await expect(page.locator('main h1')).toHaveText(label);
      await expect(page.locator('main img')).toHaveCount(1);await expect(page.locator('main img').first()).toHaveAttribute('src','https://media.example.test/TEST-mark.svg');
      const reserve=page.locator(`[data-ya-action="${action}"]`);await expect(reserve).toHaveAttribute('data-ya-resource-id',id);await reserve.click();
      await expect(page.locator('#yardimci-asistan-widget input[name="context_resource_id"]')).toHaveValue(id);
      await expect(page.locator('[data-ya-open-date-picker]').first()).toBeVisible();await page.keyboard.press('Escape');
    }
  });
  await scenario('table/room detail permission OFF and withdrawn or unknown IDs',async page=>{
    state.types=['general_info'];
    for(const [route,id] of [['rooms','TEST-room'],['restaurant','TEST-table']]){
      assert.equal((await page.goto(base+`/?page=${route}&id=${id}`)).status(),200);await expect(page.locator('main [data-ya-action]')).toHaveCount(0);
      assert.equal((await page.goto(base+`/?page=${route}&id=missing`)).status(),404);
    }
    for(const [route,id,key] of [['rooms','TEST-room','rooms'],['restaurant','TEST-table','tables']]){
      for(const gate of ['surface','disabled','empty','record-off','error']){
        reset();if(gate==='surface')state.surfaces=[];if(gate==='disabled')state.enabled=false;if(gate==='empty')state[key]=[];if(gate==='record-off')state[key][0].published=false;if(gate==='error')state.endpointError=key;
        assert.equal((await page.goto(base+`/?page=${route}&id=${id}`)).status(),404,route+':'+gate);
      }
    }
  });
  await scenario('legacy links preserve approved identity/category/language and ignore page override',async page=>{
    for(const [path,expected] of [
      ['/odalar/oda/?id=TEST-room&lang=tr&page=account','rooms'],
      ['/odalar/oda/index.php?id=TEST-room&lang=tr','rooms'],
      ['/restoran/masa/?id=TEST-table&lang=tr&page=account','restaurant'],
      ['/restoran/masa/index.php?id=TEST-table&lang=tr','restaurant'],
      ['/qr-menu/?category=TEST-second&lang=tr&page=account','menu'],
      ['/qr-menu/index.php?category=TEST-second&lang=tr','menu'],
      ['/galeri/','gallery'],['/iletisim/','contact'],['/hakkimizda/','about'],
    ]){
      const redirect=await fetch(base+path,{redirect:'manual'});assert.equal(redirect.status,302,path);const target=new URL(redirect.headers.get('location'),base);assert.equal(target.origin,base);assert.equal(target.searchParams.get('page'),expected);
      const input=new URL(path,base);for(const key of ['id','category','lang'])if(input.searchParams.has(key))assert.equal(target.searchParams.get(key),input.searchParams.get(key));
      if(expected==='rooms'||expected==='restaurant'){await page.goto(base+path);await expect(page.locator('main h1')).toContainText(expected==='rooms'?'TEST Yayınlı oda':'TEST Yayınlı masa');}
    }
    state.tables=[];assert.equal((await page.goto(base+'/restoran/masa/?id=TEST-table')).status(),404);
    state.surfaces=[];assert.equal((await page.goto(base+'/qr-menu/?category=TEST-second')).status(),404);
  });
  await scenario('QR category filtering and published timestamp; independent menu/request/order gates',async page=>{
    state.surfaces=['qr_menu'];state.requests=false;await page.goto(base+'/?page=menu&category=TEST-second');
    await expect(page.locator('#menu-category')).toHaveValue('TEST-second');await expect(page.locator('main')).toContainText('TEST İkinci ürün');await expect(page.locator('main')).not.toContainText('TEST Birinci ürün');
    await expect(page.locator('[data-menu-updated]')).toHaveAttribute('datetime',menuData.updated_at);
    await expect(page.locator('main [data-ya-action],main [data-cart-add],#cart')).toHaveCount(0);
    await page.locator('#menu-category').selectOption('TEST-category');
    await expect(page).toHaveURL(/category=TEST-category/);await expect(page.locator('main')).toContainText('TEST Birinci ürün');await expect(page.locator('main')).not.toContainText('TEST İkinci ürün');
    menuData.updated_at='javascript:invalid';await page.reload();await expect(page.locator('[data-menu-updated]')).toHaveCount(0);
    assert.equal((await page.goto(base+'/?page=menu&category=missing')).status(),404);
    menuData.categories[1].published=false;assert.equal((await page.goto(base+'/?page=menu&category=TEST-second')).status(),404);
    state.enabled=false;assert.equal((await page.goto(base+'/?page=menu')).status(),404);
  });
  await scenario('no-JS QR category form and detail navigation',async page=>{
    await page.goto(base+'/?page=menu');await page.locator('#menu-category').selectOption('TEST-second');await page.locator('form:has(#menu-category) button[type="submit"]').click();
    await expect(page).toHaveURL(/category=TEST-second/);await expect(page.locator('main')).toContainText('TEST İkinci ürün');await expect(page.locator('main')).not.toContainText('TEST Birinci ürün');
    await page.goto(base+'/?page=restaurant');await page.locator('main a[href*="id=TEST-table"]').first().click();await expect(page.locator('main h1')).toHaveText('TEST Yayınlı masa');await fits(page);await capture(page,'table-no-js-390.png');
  },{javaScriptEnabled:false});
  await scenario('canonical URL, sitemap and structured data contain only public projections',async page=>{
    state.business={about_text:'TEST yayınlı hakkında',address:'TEST yayımlanmış adres'};await page.goto(base+'/?page=restaurant&id=TEST-table&tracking=ignored');
    const canonical=await page.locator('link[rel=canonical]').getAttribute('href');const parsed=new URL(canonical);assert.equal(parsed.origin,canonicalOrigin);assert.equal(parsed.searchParams.get('page'),'restaurant');assert.equal(parsed.searchParams.get('id'),'TEST-table');assert.equal(parsed.searchParams.has('tracking'),false);
    const json=await page.locator('script[type="application/ld+json"]').allTextContents();assert.ok(json.length);assert.ok(json.every(raw=>{JSON.parse(raw);return true;}));assert.ok(json.join('').includes('TEST Gündoğdu'));assert.ok(!json.join('').includes('gideros-1-'));
    state.publicationMarker={enabled:false,server_revision:0,fields:[]};await page.reload();await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
    state.publicationMarker={enabled:true,server_revision:1,fields:['business_name']};await page.reload();const minimal=(await page.locator('script[type="application/ld+json"]').allTextContents()).join('');assert.ok(minimal.includes('TEST Gündoğdu'));assert.ok(!minimal.includes('TEST yayımlanmış adres'));
    state.publicationMarker.fields.push('address');
    const sitemap=await fetch(base+'/?resource=sitemap');assert.equal(sitemap.status,200);const xml=await sitemap.text();assert.match(xml,/<urlset/);assert.match(xml,/TEST-table/);assert.match(xml,/TEST-room/);assert.ok(!xml.includes('page=account'));assert.ok(!xml.includes('tracking='));assert.match(xml,/https:\/\/gundogdu\.example\.test/);
    state.rooms=[];state.tables=[];state.enabled=false;const closed=await (await fetch(base+'/?resource=sitemap')).text();assert.ok(!closed.includes('TEST-table')&&!closed.includes('TEST-room'));
    await page.goto(base+'/?page=restaurant&id=TEST-table');await expect(page.locator('link[rel=canonical],script[type="application/ld+json"]')).toHaveCount(0);
    state.accountEnabled=true;assert.equal((await page.goto(base+'/?page=account')).status(),200);await expect(page.locator('link[rel=canonical],script[type="application/ld+json"]')).toHaveCount(0);await expect(page.locator('meta[name=robots]')).toHaveAttribute('content',/noindex/);
    state.businessError=true;const outage=await fetch(base+'/?resource=sitemap');assert.equal(outage.status,503);assert.ok(!(await outage.text()).includes('<loc>'));
  });
  for(const width of [320,390,1440])await scenario('round2 responsive '+width+' room/table/menu, widget and keyboard',async page=>{
    await page.setViewportSize({width,height:1000});await page.goto(base+'/');await fits(page);await capture(page,`home-${width}.png`);
    for(const [route,id] of [['rooms','TEST-room'],['restaurant','TEST-table']]){await page.goto(base+`/?page=${route}&id=${id}`);await fits(page);await capture(page,`${route}-detail-${width}.png`);}
    await page.goto(base+'/?page=menu');await fits(page);await page.locator('#menu-category').focus();await expect(page.locator('#menu-category')).toBeFocused();await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await expect(page).toHaveURL(/category=/);
    await page.goto(base+'/?page=menu&category=TEST-second');await capture(page,`menu-${width}.png`);
    await page.locator('[data-ya-open]').click();await expect(page.locator('#ya-widget-title')).toHaveText('Ziyaret yardımcısı');await expect(page.locator('[data-ya-view="info"],[data-ya-view="voice"]')).toHaveCount(0);await page.locator('[data-ya-request-type="general_info"]').click();await expect(page.locator('[data-ya-open-date-picker]')).toHaveCount(0);await fits(page);await capture(page,`widget-general-${width}.png`);await page.keyboard.press('Escape');await expect(page.locator('[data-ya-open]')).toBeFocused();
  });
  await scenario('return-to-tab preserves request draft without a banner or another API fetch',async page=>{
    await page.goto(base+'/');await page.locator('[data-ya-open]').click();await page.locator('[data-ya-request-type=general_info]').click();
    const name=page.locator('#yardimci-asistan-widget input[name=customer_name]');await name.fill('TEST korunacak taslak');await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-publication-freshness]')).toHaveCount(0);const before=state.calls.length;
    await page.evaluate(()=>{const now=Date.now();Date.now=()=>now+61000;window.dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'));});
    await expect(page.locator('[data-publication-freshness]')).toHaveCount(0);await expect(name).toHaveValue('TEST korunacak taslak');assert.equal(state.calls.length,before,'Returning to the tab must not add polling or fetches');
    await page.keyboard.press('Escape');await capture(page,'publication-return-390.png');
  });
  await scenario('published RTL category translation, stale hash fallback and language withdrawal',async page=>{
    const source=await (await fetch(base+'/?resource=translation-source')).json();const key='page.menu';const hero='theme.gundogdu.hero.title';
    state.localization={version:1,source_language:'tr',target_languages:['ar'],languages:[{code:'ar',locale:'ar',direction:'rtl',nativeName:'العربية'}],site_catalog:{id:source.id,entries:source.entries},translations:{site_text:{[source.id+':'+key]:{ar:{text:'TEST القائمة'}},[source.id+':'+hero]:{ar:{text:'TEST استراحة هادئة عند الخليج'}}}}};
    await page.goto(base+'/?page=menu&lang=ar&category=TEST-second');await expect(page.locator('html')).toHaveAttribute('dir','rtl');await expect(page.locator('main h1')).toHaveText('TEST القائمة');await expect(page.locator('#menu-category')).toHaveValue('TEST-second');await fits(page);await capture(page,'menu-rtl-390.png');
    state.localization.site_catalog.entries[key].hash='0'.repeat(64);await page.reload();await expect(page.locator('main h1')).toHaveText('QR Menü');
    state.localization.target_languages=[];await page.reload();await expect(page.locator('html')).toHaveAttribute('lang','tr');
  });
  await writeFile(join(artifacts,'round2-results.json'),JSON.stringify({passed:results.length,results,synthetic:true,canonicalOrigin,artifacts},null,2)+'\n');console.log(JSON.stringify({passed:results.length,artifacts}));
}finally{
  await browser?.close();await new Promise(r=>proxy?proxy.server.close(r):r());await new Promise(r=>wrapper.close(r));await new Promise(r=>api.server.close(r));php.kill('SIGTERM');await new Promise(r=>php.exitCode!==null?r():php.once('exit',r));
}
