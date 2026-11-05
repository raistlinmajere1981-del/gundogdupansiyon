// Site-only full-photo acceptance: verify both desktop and phone render the
// complete natural image inside the hero with a matching soft backdrop.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import net from 'node:net';
import {mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fixtureServer,proxyServer,freshState} from './fixtures/canonical-api.mjs';
const require=createRequire(new URL('../.local/browser-tools/package.json',import.meta.url));
const {chromium,expect}=require('@playwright/test');
const assets=new URL('../.test-artifacts/full-heroes/',import.meta.url);
await mkdir(assets,{recursive:true});
const photo={
 rooms:'gideros-2-1275.webp',
 restaurant:'hero-restaurant.webp',
 menu:'hero-menu.webp',
 about:'hero-about-cide-landscape.webp',
 gallery:'hero-gallery.webp',
 announcements:'hero-announcements.webp',
 contact:'hero-contact.webp'
};
let api,php,proxy,browser;
const timer=setTimeout(()=>{console.error('Hero acceptance timed out');php?.kill('SIGTERM');process.exit(2)},100000);
try{
 const state=freshState();
 state.business={about_text:'Yerel örnek işletme açıklaması',address:'Cide Kastamonu test adresi',
  gallery:[{id:'test-gallery',title:'Örnek galeri',url:'/yardimci-asistan/media/TEST-gallery.jpg',published:true}]};
 state.announcements=[{id:'TEST-news',title:'Örnek duyuru',text:'Örnek içerik',channel:'website',published:true}];
 api=await fixtureServer(state);
 const port=await new Promise((resolve,reject)=>{
  const server=net.createServer();server.once('error',reject);server.listen(0,'127.0.0.1',()=>{
   const address=server.address();server.close(()=>resolve(address.port));
  });
 });
 php=spawn('php',['-d','opcache.enable=0','-S','127.0.0.1:'+port,'-t','.','router.php'],{env:{...process.env,YA_SITE_API_ORIGIN:api.origin},stdio:'ignore'});
 for(let i=0;i<70;i++){
  try{if((await fetch('http://127.0.0.1:'+port+'/')).status===200)break}catch{}
  await new Promise(ok=>setTimeout(ok,65));
 }
 proxy=await proxyServer('http://127.0.0.1:'+port,api.origin);
 browser=await chromium.launch({headless:true,executablePath:'/usr/bin/brave',args:['--no-sandbox','--disable-gpu']});
 for(const width of [1440,390]){
  const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  await ctx.route('**/*',route=>{
   if(new URL(route.request().url()).origin!==proxy.origin)return route.abort();
   return route.continue();
  });
  const page=await ctx.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  for(const [name,file] of Object.entries(photo)){
    await page.goto(proxy.origin+'/?page='+name+'&lang=tr',{waitUntil:'domcontentloaded'});
    const hero=page.locator('[data-gd-page-hero="'+name+'"]');
    await expect(hero).toBeVisible();
    const img=hero.locator('img');
    await expect(img).toHaveAttribute('src','/assets/site/img/'+file);
    await img.evaluate(el=>el.decode());
    const dimensions=await hero.evaluate(el=>{
      const img=el.querySelector('img'),a=el.getBoundingClientRect(),b=img.getBoundingClientRect();
      const c=getComputedStyle(img),d=getComputedStyle(el,'::before');
      return {fullWidth:a.width,fullHeight:a.height,imgWidth:b.width,imgHeight:b.height,naturalWidth:img.naturalWidth,
       naturalHeight:img.naturalHeight,objectFit:c.objectFit,backgroundImage:d.backgroundImage,
       visible:img.complete&&img.naturalWidth>0,overflow:document.documentElement.scrollWidth-innerWidth};
    });
    assert.equal(dimensions.objectFit,'contain',name);
    assert.ok(dimensions.backgroundImage.includes(file),name+' missing backdrop');
    assert.ok(dimensions.visible,name+' broken');
    assert.ok(dimensions.imgWidth<=dimensions.fullWidth+2&&dimensions.imgHeight<=dimensions.fullHeight+2,name+' crops photo');
    // The img element can have a responsive box unlike its image content.
    // object-fit: contain preserves the natural ratio within that box.
    const scale=Math.min(dimensions.imgWidth/dimensions.naturalWidth,dimensions.imgHeight/dimensions.naturalHeight);
    assert.ok(dimensions.naturalWidth*scale<=dimensions.imgWidth+1&&dimensions.naturalHeight*scale<=dimensions.imgHeight+1,name+' media content outside frame');
    assert.ok(dimensions.overflow<=1,name+' horizontal overflow');
    console.log('HERO_PASSED',width,name,JSON.stringify(dimensions));
    if(name==='about')await page.screenshot({path:new URL('about-'+width+'.png',assets).pathname});
  }
  assert.deepEqual(errors,[]);
  await ctx.close();
 }
 console.log('GUNDOGDU_FULL_HERO_VISUAL_PASS');
}finally{
 clearTimeout(timer);
 await browser?.close();for(const resource of [proxy,api])if(resource){resource.server.closeAllConnections();await new Promise(resolve=>resource.server.close(resolve));}
 if(php){php.kill('SIGTERM');await new Promise(ok=>{if(php.exitCode!==null||php.signalCode!==null)resolve();else php.once('exit',ok);});}
}
