// Focused local visual acceptance only. Synthetic public API; all remote traffic blocked.
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import net from 'node:net';
import {mkdir,readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fixtureServer,proxyServer,freshState} from './fixtures/canonical-api.mjs';
const require=createRequire(new URL('../.local/browser-tools/package.json',import.meta.url));
const {chromium,expect}=require('@playwright/test');
const state=freshState();
const catalog=JSON.parse(spawnSync('php',['-r',"echo json_encode(require 'canonical/site/views/components/photo-credit-catalog.php');"],{encoding:'utf8'}).stdout);
const photoTitle=Object.keys(catalog).find(title=>catalog[title].license==='CC BY 2.0');
const panoramaTitle=Object.keys(catalog).find(title=>catalog[title].title.includes('360°'));
state.types=['general_info','pension_reservation','restaurant_reservation'];
state.business={gallery:[{id:'TEST-gallery',title:'TEST İşletme fotoğrafı',url:'/yardimci-asistan/media/TEST-gallery.jpg',published:true}],ai_enabled:true,whatsapp_enabled:true,whatsapp:'+905550000000',address:'TEST yerel adres', social_links:[
  {platform:'instagram',url:'https://www.instagram.com/test_yayim',published:true},
  {platform:'facebook',url:'https://www.facebook.com/private',published:false},
  {platform:'tiktok',url:'javascript:alert(1)',published:true}
]};
state.surfaces.push('directions');
state.menu=Array.from({length:4},(_,i)=>({id:'TEST-food-'+i,category_id:'TEST-category',name:'TEST Yemek '+i,description:'TEST yayınlı ürün açıklaması',image_url:i===3?'':'/yardimci-asistan/media/TEST-food.jpg',price:125+i,currency:'TRY',is_featured:i===0}));
state.rooms[0].media=[
  {id:'TEST-cover',kind:'cover',url:'/yardimci-asistan/media/TEST-cover.jpg',title:photoTitle,published:true},
  {id:'TEST-pano',kind:'panorama_360',url:'/yardimci-asistan/media/TEST-pano.jpg',title:panoramaTitle,published:true},
  {id:'TEST-pano-half',kind:'panorama_180',url:'/yardimci-asistan/media/TEST-pano-half.jpg',title:'TEST 180 derece',published:true},
  {id:'TEST-visitor',kind:'photo',url:'/yardimci-asistan/media/TEST-visitor.jpg',title:'TEST Ziyaretçi fotoğrafı',published:true},
  {id:'TEST-private',kind:'photo',url:'/yardimci-asistan/media/PRIVATE.jpg',title:photoTitle,published:false},
];
const fullText='TEST duyuru açıklaması. '.repeat(45)+'TEST tam metin sonu';
state.announcements=Array.from({length:4},(_,i)=>({id:'TEST-news-'+i,title:'TEST Duyuru '+i,text:fullText,channel:'website',published:true,images:[{url:'/yardimci-asistan/media/TEST-news.jpg',altText:'TEST Duyuru görseli',published:true},{url:'/yardimci-asistan/media/PRIVATE.jpg',published:false}]}));
state.announcements.push({id:'PRIVATE',title:'PRIVATE duyuru',text:'PRIVATE',channel:'website',published:false});
const artifacts=new URL('../.test-artifacts/visual-a/',import.meta.url);await mkdir(artifacts,{recursive:true});
const media=await readFile(new URL('../assets/site/img/gideros-1-720.webp',import.meta.url));
let api,proxy,php,browser;
const timer=setTimeout(()=>{console.error('Focused visual timeout (85s)');php?.kill('SIGTERM');process.exit(2);},85000);
try {
  api=await fixtureServer(state);
  const port=await new Promise((resolve,reject)=>{const s=net.createServer();s.once('error',reject);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
  php=spawn('php',['-d','opcache.enable=0','-S',`127.0.0.1:${port}`,'-t','.', 'router.php'],{env:{...process.env,YA_SITE_API_ORIGIN:api.origin},stdio:'ignore'});
  for(let i=0;i<40;i++){try{if((await fetch(`http://127.0.0.1:${port}/`)).status===200)break;}catch{}await new Promise(r=>setTimeout(r,50));}
  proxy=await proxyServer(`http://127.0.0.1:${port}`,api.origin);const base=proxy.origin;
  browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/usr/bin/brave',args:['--no-sandbox','--disable-gpu']});
  for(const width of [1440,390]) {
    const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
    await context.route('**/*',route=>{const url=new URL(route.request().url());if(url.origin!==base)return route.abort();if(url.pathname.startsWith('/yardimci-asistan/media/TEST-'))return route.fulfill({contentType:'image/webp',body:media});return route.continue();});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'/?page=menu');
    await expect(page.locator('.gd-header-top .site-name')).toBeVisible();
    await expect(page.locator('.gd-header-top .gd-social--header')).toBeVisible();
    const topBounds=await page.locator('.gd-header-top').boundingBox();
    const bottomBounds=await page.locator('.gd-header-bottom').boundingBox();
    assert.ok(topBounds && bottomBounds && bottomBounds.y>=topBounds.y+topBounds.height-2,JSON.stringify({topBounds,bottomBounds}));
    const desktopMenu=page.locator('#main-navigation');
    if(width>760) {
      await expect(desktopMenu).toBeVisible();
      const logo=await page.locator('.gd-header-top .site-name').boundingBox();
      const socials=await page.locator('.gd-header-top .gd-social--header').boundingBox();
      assert.ok(logo && socials && socials.x>logo.x+logo.width,JSON.stringify({logo,socials}));
    } else {
      await expect(desktopMenu).toBeHidden();
      await page.locator('[data-menu-toggle]').click();
      await expect(desktopMenu).toBeVisible();
      await page.locator('[data-menu-toggle]').click();
      await expect(desktopMenu).toBeHidden();
    }
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
    await expect(page.locator('.menu-publication-note')).toBeHidden();await expect(page.locator('.page-header .eyebrow')).toHaveCount(0);
    await expect(page.locator('.menu-image')).toHaveCount(3);await expect(page.locator('.menu-featured')).toHaveCount(1);
    assert.equal(await page.locator('.menu-list > li > [data-format-currency]').first().getAttribute('data-format-currency'),'125');
    assert.ok(await page.locator('.menu-image').first().evaluate(img=>img.getBoundingClientRect().width>250));
    await page.screenshot({path:new URL(`menu-${width}.png`,artifacts).pathname,fullPage:true});
    await page.goto(base+'/?page=announcements');
    await expect(page.locator('.announcement-card')).toHaveCount(4);await expect(page.locator('img[src*=PRIVATE]')).toHaveCount(0);
    assert.ok(await page.locator('.announcement-media img').first().evaluate(img=>img.getBoundingClientRect().width<=220));
    await page.locator('.announcement-text summary').first().click();await expect(page.locator('.announcement-text p').first()).toContainText('TEST tam metin sonu');
    await page.screenshot({path:new URL(`announcements-${width}.png`,artifacts).pathname,fullPage:true});
    await page.goto(base+'/?page=rooms&id=TEST-room');
    await expect(page.locator('[data-panorama=panorama_360]')).toHaveCount(1);await expect(page.locator('img[src*=PRIVATE]')).toHaveCount(0);
    await expect(page.locator('.room-media-item figcaption')).toContainText(['Cerro Tololo','TEST Ziyaretçi']);
    // Cover and panoramas open inside this page, without fullscreen or a new tab.
    const mediaDialog=page.locator('.gd-media-dialog');
    await page.locator('.resource-detail-cover .gd-media-button').click();
    await expect(mediaDialog).toBeVisible();
    await expect(mediaDialog.locator('.gd-media-stage > img')).toBeVisible();
    assert.ok(page.url().includes('page=rooms'));
    await mediaDialog.locator('.gd-media-close').click();
    await expect(mediaDialog).toBeHidden();
    await expect(page.locator('.resource-detail-cover a[href]')).toHaveCount(0);
    await expect(page.locator('.room-media-item a[target=_blank]')).toHaveCount(0);
    await expect(page.locator('.room-media-item figcaption a')).toHaveCount(0);
    const panorama=page.locator('.room-media-item [data-panorama]').first();
    await expect(panorama.locator('[data-panorama-expand]')).toBeHidden();
    await panorama.locator('canvas:visible, img:visible').first().click();
    await expect(mediaDialog).toBeVisible();
    await expect(mediaDialog.locator('[data-panorama]')).toHaveCount(1);
    await expect(mediaDialog.locator('[data-panorama] canvas:visible, [data-panorama] img:visible').first()).toBeVisible();
    const bounds=await mediaDialog.locator('[data-panorama]').evaluate(el=>({h:el.getBoundingClientRect().height,w:el.getBoundingClientRect().width}));
    assert.ok(bounds.h>=200 && bounds.h<=560 && bounds.w<=1041,JSON.stringify(bounds));
    await page.keyboard.press('Escape');
    await expect(mediaDialog).toBeHidden();
    await expect(page.locator('.room-media-item [data-panorama]')).toHaveCount(2);
    const half=page.locator('[data-panorama="panorama_180"]');
    await expect(half.locator('[data-panorama-expand]')).toHaveCount(0);
    await half.locator('canvas:visible, img:visible').first().click();
    await expect(mediaDialog).toBeVisible();
    await expect(mediaDialog.locator('[data-panorama="panorama_180"]')).toHaveCount(1);
    await mediaDialog.locator('.gd-media-close').click();
    await expect(half).toBeVisible();
    await expect(page.locator('#photo-credits')).not.toHaveAttribute('open','');
    await page.locator('#photo-credits summary').click();
    await expect(page.locator('.published-photo-credits li')).toHaveCount(2);
    await expect(page.locator('.published-photo-credits a[href="https://creativecommons.org/licenses/by/2.0/"]')).toHaveCount(1);
    await expect(page.locator('.published-photo-credits a[href="https://creativecommons.org/licenses/by/4.0/"]')).toHaveCount(1);
    await expect(page.locator('.published-photo-credits')).not.toContainText('TEST Ziyaretçi');
    await page.goto(base+'/?page=gallery');
    await page.locator('.gallery figure img').first().click();
    await expect(page.locator('.gd-media-dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.gd-media-dialog')).toBeHidden();
    await page.goto(base+'/?page=menu');
    await page.locator('.menu-list .menu-image').first().click();
    await expect(page.locator('.gd-media-dialog')).toBeVisible();
    await expect(page.locator('.gd-media-stage > img')).toBeVisible();
    await page.keyboard.press('Escape');await expect(page.locator('.gd-media-dialog')).toBeHidden();
    await page.goto(base+'/?page=announcements');
    await page.locator('.announcement-media img').first().click();
    await expect(page.locator('.gd-media-dialog')).toBeVisible();
    await page.locator('.gd-media-close').click();
    await page.goto(base+'/?page=contact');
    await expect(page.locator('.gd-social--header a')).toHaveCount(1);
    await expect(page.locator('.gd-social--header svg')).toHaveCount(1);
    await expect(page.locator('.gd-social--contact a')).toHaveCount(1);
    const actions=page.locator('.gd-contact-button');
    await expect(actions).toHaveCount(1);
    await actions.first().hover();
    await page.waitForTimeout(240);
    const colors=await actions.first().evaluate(el=>({fg:getComputedStyle(el).color,bg:getComputedStyle(el).backgroundColor}));
    assert.ok(colors.fg.includes('255, 254, 250'),JSON.stringify(colors));
    assert.ok(colors.bg.includes('22, 61, 53'),JSON.stringify(colors));
    await page.screenshot({path:new URL('contact-'+width+'.png',artifacts).pathname,fullPage:true});

    await expect(page.locator('.gd-social--footer a')).toHaveCount(1);
    await expect(page.locator('.gd-social--footer a').first()).toHaveAttribute('href','https://www.instagram.com/test_yayim');
    await expect(page.locator('.gd-social--footer')).not.toContainText('Facebook');
    await expect(page.locator('.gd-social--footer')).not.toContainText('TikTok');
    await page.goto(base+'/');await expect(page.locator('#announcements-preview article')).toHaveCount(3);
    assert.ok(await page.locator('#announcements-preview article p').first().evaluate(p=>p.textContent.length<=150));
    await page.locator('[data-ya-open]').click();const widget=page.locator('#yardimci-asistan-widget');
    await expect(widget.locator('.ya-widget-title-copy small')).toBeHidden();await expect(widget.locator('.ya-widget-kicker')).toBeHidden();
    await expect(widget.locator('.ya-widget-nexa-welcome')).toBeVisible();await expect(widget.locator('#ya-widget-title')).toBeVisible();
    const metrics=await widget.locator('.ya-widget-content').evaluate(el=>({scroll:el.scrollHeight,height:el.clientHeight,columns:getComputedStyle(el.querySelector('.ya-widget-actions')).gridTemplateColumns}));
    assert.equal(metrics.columns.split(' ').length,2);assert.ok(metrics.scroll<=metrics.height+1,JSON.stringify({width,...metrics}));
    await page.screenshot({path:new URL(`widget-${width}.png`,artifacts).pathname});
    await widget.locator('[data-ya-request-type=general_info]').click();await expect(widget.locator('input[name=customer_name]')).toBeVisible();
    await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>getComputedStyle(document.activeElement).outlineStyle),'solid');
    await page.keyboard.press('Escape');await expect(page.locator('[data-ya-open]')).toBeFocused();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);
    await context.close();console.log(`PASS visual A: menu, published announcements/full text, credits, Nexa/grid/no home scroll, keyboard, ${width}x900`);
  }
} catch(error) {
  if(error.code==='EPERM'){console.error('HOST_BROWSER_REQUIRED: sandbox denied local HTTP listen (EPERM); no retry.');process.exitCode=2;}else throw error;
} finally {
  clearTimeout(timer);await browser?.close();for(const resource of [proxy,api])if(resource){resource.server.closeAllConnections();await new Promise(resolve=>resource.server.close(resolve));}php?.kill('SIGTERM');
}
