import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {cpSync,mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createServer} from 'node:net';
import {spawn} from 'node:child_process';
const {chromium}=createRequire(new URL('../../gundogdu_web/.local/browser-tools/package.json',import.meta.url))('playwright');
const root=fileURLToPath(new URL('..',import.meta.url));
const g=root.includes('gundogdu_web'),output=join(root,g?'.test-artifacts/effect-engine':'artifacts/effect-engine');
mkdirSync(output,{recursive:true});const temp=mkdtempSync(join(output,'site-'));
for(const name of ['assets','inc','api','index.php','404.php','router.php']){try{cpSync(join(root,name),join(temp,name),{recursive:true});}catch(e){if(e.code!=='ENOENT')throw e;}}
const body=JSON.stringify({ok:true,enabled:false,available:false,business:{ai_enabled:false,requests_enabled:false,whatsapp_enabled:false,public_surfaces:[]},rooms:[],tables:[],items:[],categories:[],publications:[]});
writeFileSync(join(temp,'effect-router.php'),`<?php if(str_starts_with($_SERVER['REQUEST_URI'],'/yardimci-asistan/api/')){header('Content-Type: application/json');echo '${body}';return true;} return require __DIR__.'/router.php';`);
const port=await new Promise(done=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>done(p));});});
const origin='http://127.0.0.1:'+port;
const server=spawn('php',['-S','127.0.0.1:'+port,'effect-router.php'],{cwd:temp,detached:true,env:{...process.env,PHP_CLI_SERVER_WORKERS:'4',GUNDOGDU_PUBLIC_API_ORIGIN:origin,BLACKSEA_PUBLIC_API_ORIGIN:origin},stdio:['ignore','ignore','pipe']});
let browser,log='';server.stderr.on('data',c=>log+=c);
const report={checks:[],pageErrors:[],screenshots:[]};const check=s=>report.checks.push(s);
try{
 for(let i=0;i<60;i++){try{if((await fetch(origin+'/assets/effects/hero.sample.scene.json')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/usr/bin/brave',headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 await context.route('**/*',r=>r.request().url().startsWith(origin)||r.request().url().startsWith('data:')?r.continue():r.abort());
 const legacyRequests=[];context.on('request',r=>{if(/\/assets\/js\/canvas\//.test(r.url()))legacyRequests.push(r.url());});
 const page=await context.newPage();page.on('pageerror',e=>report.pageErrors.push(e.message));
 const image=g?'.hero-photo':'[data-canvas-hero] img';
 const visit=async q=>{await page.goto(origin+'/'+q,{waitUntil:'networkidle'});await page.locator(image).evaluate(img=>img.decode());await page.waitForFunction(()=>window.heroEffects?.settled);};
 const ready=()=>page.waitForFunction(()=>window.heroEffects?.inspect().frames>2);
 const screen=async name=>{await page.locator('.hero').screenshot({path:join(output,name+'.png')});report.screenshots.push(name+'.png');};
 const active=join(temp,'assets/effects/hero.scene.json');
 if(existsSync(active)){
   // Real user scene is tested before isolating absent/invalid scene cases.
   for(const width of [1440,390]){
     await page.setViewportSize({width,height:1000});
     await visit('');await ready();
     assert.equal(await page.locator('.canvas-overlay').count(),1);
     const expected=JSON.parse(readFileSync(active,'utf8')).effects.filter(e=>e.enabled).length;
     const state=await page.evaluate(()=>({effects:window.heroEffects.inspect().effects,rendered:(()=>{const c=document.querySelector('.canvas-overlay');return c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4===3&&v>0)})()}));
     assert.equal(state.effects.length,expected);
     assert.equal(state.rendered,true,'Installed JSON must paint real effect pixels');
     await screen('installed-'+width);
   }
   rmSync(active);
   check('actual installed JSON paints active effects on desktop and mobile');
 }
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:1000});
  await visit('');assert.equal(await page.locator('.canvas-overlay').count(),0);const src=await page.locator(image).getAttribute('src');await screen('static-'+width);
  await visit('?effect-scene=sample');await ready();assert.equal(await page.locator('.canvas-overlay').count(),1);assert.equal(await page.locator(image).getAttribute('src'),src);
  const state=await page.evaluate(()=>({inspect:window.heroEffects.inspect(),overflow:document.documentElement.scrollWidth>innerWidth+1,pixels:(()=>{const c=document.querySelector('.canvas-overlay');return c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((n,i)=>i%4===3&&n>0);})()}));
  assert.equal(state.overflow,false);assert.ok(state.inspect.pixelCount<=650000+2000);assert.ok(state.pixels,'visible effect pixels');
  if(!g&&width===390){assert.ok((await page.locator(image).evaluate(i=>i.currentSrc)).includes('cide-ai-mobile-clean'));assert.ok(state.inspect.transform.view.x+state.inspect.transform.view.width<=1180.01);}
  assert.equal(await page.locator('.motion-toggle,.wave-debug-panel,.wave-guide').count(),0,'No legacy effect controls remain');
  await screen('sample-'+width);
  await page.locator(image).evaluate(()=>scrollTo(0,document.body.scrollHeight));await page.waitForFunction(()=>!window.heroEffects.inspect().running);await page.evaluate(()=>scrollTo(0,0));await page.waitForFunction(()=>window.heroEffects.inspect().running);
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelectorAll('.canvas-overlay').length===0);
  await page.emulateMedia({reducedMotion:'no-preference'});await ready();assert.equal(await page.locator('.canvas-overlay').count(),1);
  await visit('?effect-scene=off');assert.equal(await page.locator('.canvas-overlay').count(),0);
  check(width+': default static, sample pixels, layout, motion, viewport pause, off');
 }
 const sample=JSON.parse(readFileSync(join(temp,'assets/effects/hero.sample.scene.json'),'utf8'));
 for(const value of ['{broken',JSON.stringify({...sample,photo:{...sample.photo,width:1}}),JSON.stringify({...sample,effects:[{...sample.effects[0],type:'foam'}]})]){writeFileSync(active,value);await visit('');assert.equal(await page.locator('.canvas-overlay').count(),0);}
 check('invalid JSON/dimensions/unregistered foam retain photo');
 writeFileSync(active,JSON.stringify(sample));await visit('');await ready();await visit('?effect-scene=off');assert.equal(await page.locator('.canvas-overlay').count(),0);
 writeFileSync(active,'{broken');await visit('');assert.equal(await page.locator('.canvas-overlay').count(),0);
 check('updated installed JSON is fetched without stale response; off overrides installed scene');
 rmSync(active);
 for(const mode of ['reduce','cores','saveData']){
  const c=await browser.newContext({viewport:{width:390,height:844},reducedMotion:mode==='reduce'?'reduce':'no-preference'});
  await c.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());
  await c.addInitScript(mode=>{if(mode==='cores')Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>2});if(mode==='saveData')Object.defineProperty(navigator,'connection',{get:()=>({saveData:true})});},mode);
  const p=await c.newPage();p.on('pageerror',e=>report.pageErrors.push(e.message));await p.goto(origin+'/?effect-scene=sample',{waitUntil:'networkidle'});assert.equal(await p.locator('.canvas-overlay').count(),0);await c.close();
 }
 check('reduced-motion, two-core and save-data start with photo');
 assert.deepEqual(legacyRequests,[]);assert.deepEqual(report.pageErrors,[]);assert.ok(!/PHP (?:Warning|Fatal|Parse error)/.test(log));report.passed=true;
}catch(e){report.passed=false;report.failure=e.stack;throw e;}
finally{writeFileSync(join(output,'report.json'),JSON.stringify(report,null,2));writeFileSync(join(output,'php.log'),log);await browser?.close();try{process.kill(-server.pid,'SIGTERM');}catch{}rmSync(temp,{recursive:true,force:true});}
console.log((g?'gundogdu':'blacksea')+'-effect-browser-ok: '+report.checks.length+' groups, '+report.screenshots.length+' screenshots');
