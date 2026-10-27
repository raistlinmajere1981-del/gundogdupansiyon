// Temporary canonical-adapter prototype only. Does not enable production effects.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {cpSync,mkdirSync,mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import net from 'node:net';
const canonical=fileURLToPath(new URL('../../',import.meta.url));
const workspace=resolve(canonical,'../../');
const output=resolve(process.env.GUNDOGDU_EFFECT_OUTPUT||join(workspace,'YardimciAsistan/artifacts/site-redesign-plan/gundogdu-ikinci-tur-effects'));
const {chromium}=createRequire(new URL('../../../.local/browser-tools/package.json',import.meta.url))('@playwright/test');
const temp=mkdtempSync(join(tmpdir(),'gundogdu-effects-round2-'));
const prototype=join(temp,'canonical');cpSync(canonical,prototype,{recursive:true});mkdirSync(output,{recursive:true});
const hero=join(prototype,'site/views/components/hero.php');
writeFileSync(hero,readFileSync(hero,'utf8').replace('class="hero-photo"','class="hero-photo" data-effect-slot="hero"'));
writeFileSync(join(prototype,'site/config.php'),`<?php return ['api_origin'=>'','api_base_path'=>'/yardimci-asistan','base_path'=>'','effects'=>(($_GET['effect']??'')==='off'?[]:['hero'=>'hero.scene.json'])];\n`);
// The engine's inline z-index belongs between photograph and gradient, below text.
const css=join(prototype,'public/assets/site/theme.css');writeFileSync(css,readFileSync(css,'utf8')+'\n/* Temporary prototype layering only. */\n.gundogdu-hero > .canvas-overlay {z-index:-2!important}\n');
const scene=join(prototype,'public/assets/site/scenes/hero.scene.json');
const originalScene=readFileSync(join(canonical,'site/preserved-effects/hero.scene.json'),'utf8');writeFileSync(scene,originalScene);
const port=await new Promise(r=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p));});});
const origin=`http://127.0.0.1:${port}`;
const php=spawn('php',['-d','opcache.enable=0','-S',`127.0.0.1:${port}`,'-t',join(prototype,'public')],{stdio:'ignore'});
let browser;
const report={passed:false,checks:[],screenshots:[],metrics:[],pageErrors:[],prototypeOnly:true,productionEffects:'off',cadenceObservation:{warmup:'at least five Canvas clear calls',sampleMs:1100,limitation:'clear-call cadence only; not a CPU/GPU power or physical-device benchmark'},visibilityCoverage:{viewport:'real browser scrolling and IntersectionObserver',hidden:'test-controlled document.hidden getter and visibilitychange event',pageLifecycle:'three synthetic persisted pagehide/pageshow cycles; not an OS background-tab or BFCache certification'}};
const check=name=>{report.checks.push(name);console.log('PASS',name);};
const inspect=page=>page.evaluate(async()=>{
 const canvas=document.querySelector('.canvas-overlay'),image=document.querySelector('.hero-photo');
 const imageRect=image.getBoundingClientRect();const rect=canvas?.getBoundingClientRect();
 return {state:image.dataset.effectState,naturalWidth:image.naturalWidth,source:image.currentSrc,canvasCount:document.querySelectorAll('.canvas-overlay').length,frames:window.__effectProbe.frames,
  rect:rect?{x:rect.x,y:rect.y,width:rect.width,height:rect.height}:null,imageRect:{x:imageRect.x,y:imageRect.y,width:imageRect.width,height:imageRect.height},
  pixels:canvas?canvas.width*canvas.height:0,painted:canvas?canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data.some((v,i)=>i%4===3&&v>0):false,
  display:canvas?getComputedStyle(canvas).display:null,overflow:document.documentElement.scrollWidth>innerWidth+1};
});
async function visit(context,query=''){
 const page=await context.newPage();const requests=[];page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>report.pageErrors.push(e.message));
 await page.goto(origin+'/'+query);await page.locator('.hero-photo').evaluate(i=>i.decode());await page.evaluate(()=>document.fonts.ready);return {page,requests};
}
async function context(options={},policy={}){
 const c=await browser.newContext({viewport:{width:390,height:1000},reducedMotion:'no-preference',...options});
 await c.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());
 await c.addInitScript(policy=>{
  if(policy.cores)Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>policy.cores});
  else Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>8});
  Object.defineProperty(navigator,'deviceMemory',{get:()=>policy.memory||8});
  if(policy.saveData)Object.defineProperty(navigator,'connection',{get:()=>({saveData:true})});
  window.__effectProbe={frames:0,marks:[],costs:[]};window.__testHidden=false;window.__slow=false;
  Object.defineProperty(document,'hidden',{get:()=>window.__testHidden});
  const clear=CanvasRenderingContext2D.prototype.clearRect;
  CanvasRenderingContext2D.prototype.clearRect=function(...args){
   if(this.canvas.classList.contains('canvas-overlay')){
    window.__effectProbe.frames++;window.__effectProbe.marks.push(performance.now());
    if(window.__slow){const start=performance.now();while(performance.now()-start<20){}}
   }
   return clear.apply(this,args);
  };
 },policy);return c;
}
try{
 for(let n=0;;n++){try{assert.equal((await fetch(origin+'/')).status,200);break;}catch(e){if(n>100)throw e;await new Promise(r=>setTimeout(r,30));}}
 browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/usr/bin/brave',args:['--no-sandbox','--disable-gpu']});
 for(const width of [320,390,1440]){
  const c=await context({viewport:{width,height:1000},deviceScaleFactor:2});const {page}=await visit(c);
  await page.waitForFunction(()=>document.querySelector('.canvas-overlay')&&window.__effectProbe.frames>=5);
  await page.waitForFunction(()=>{const canvas=document.querySelector('.canvas-overlay');return canvas&&canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data.some((v,i)=>i%4===3&&v>0);});
  const state=await inspect(page);assert.equal(state.canvasCount,1);assert.equal(state.overflow,false);assert.ok(state.pixels<=652000);assert.ok(state.painted);assert.ok(state.rect.x>=-1&&state.rect.x+state.rect.width<=width+1);
  const before=await page.evaluate(()=>window.__effectProbe.frames);await page.waitForTimeout(1100);const after=await page.evaluate(()=>window.__effectProbe.frames);
  const cadence=(after-before)/1.1;assert.ok(cadence<=30,'effect cadence is bounded');
  const png=`effect-${width}.png`;await page.locator('.gundogdu-hero').screenshot({path:join(output,png)});report.screenshots.push(png);
  await page.goto(origin+'/?effect=off');await page.locator('.hero-photo').evaluate(i=>i.decode());assert.equal((await inspect(page)).canvasCount,0);await page.locator('.gundogdu-hero').screenshot({path:join(output,`static-${width}.png`)});report.screenshots.push(`static-${width}.png`);
  report.metrics.push({width,pixelCount:state.pixels,observedCadence:Number(cadence.toFixed(2)),source:state.source.split('/').pop(),canvasRect:state.rect});check(`${width}px: painted preserved scene, same panorama, <=650k pixel budget, bounded cadence, static OFF`);await c.close();
 }
 for(const policy of [{name:'reduced-motion',options:{reducedMotion:'reduce'}},{name:'two-core',cores:2},{name:'two-GB',memory:2},{name:'save-data',saveData:true}]){
  const c=await context(policy.options||{},policy);const {page,requests}=await visit(c);await page.waitForTimeout(300);assert.equal((await inspect(page)).canvasCount,0);assert.equal(requests.filter(url=>url.includes('/assets/vendor/effect-engine/')).length,0);assert.equal(requests.filter(url=>url.endsWith('.scene.json')).length,0);check(`${policy.name}: static photo, no scene or engine network request`);await c.close();
 }
 {
  const c=await context({}, {cores:4,memory:4});const {page}=await visit(c);await page.waitForFunction(()=>window.__effectProbe.frames>3);
  const state=await inspect(page);const before=state.frames;await page.waitForTimeout(1100);const frames=(await inspect(page)).frames-before;assert.ok(frames<=19);report.metrics.push({policy:'4-core/4GB',observedCadence:Number((frames/1.1).toFixed(2))});check('4-core/4GB: low-power cadence <=18 observed fps');await c.close();
 }
 {
  const c=await context();const {page}=await visit(c);await page.waitForFunction(()=>window.__effectProbe.frames>3);
  await page.evaluate(()=>{window.__testHidden=true;document.dispatchEvent(new Event('visibilitychange'));});const stopped=await page.evaluate(()=>window.__effectProbe.frames);await page.waitForTimeout(180);assert.equal(await page.evaluate(()=>window.__effectProbe.frames),stopped);assert.equal((await inspect(page)).display,'none');
  await page.evaluate(()=>{window.__testHidden=false;document.dispatchEvent(new Event('visibilitychange'));});await page.waitForFunction(n=>window.__effectProbe.frames>n,stopped);
  await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));await page.waitForFunction(()=>getComputedStyle(document.querySelector('.canvas-overlay')).display==='none');const outside=await page.evaluate(()=>window.__effectProbe.frames);await page.waitForTimeout(180);assert.equal(await page.evaluate(()=>window.__effectProbe.frames),outside);await page.evaluate(()=>scrollTo(0,0));await page.waitForFunction(()=>getComputedStyle(document.querySelector('.canvas-overlay')).display==='block');
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelectorAll('.canvas-overlay').length===0);
  await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForFunction(()=>document.querySelectorAll('.canvas-overlay').length===1);
  for(let n=0;n<3;n++){
   await page.evaluate(()=>dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));assert.equal((await inspect(page)).canvasCount,0);
   assert.deepEqual(await page.evaluate(async()=>{const {ticker}=await import('/assets/vendor/effect-engine/src/runtime/ticker.mjs');return [ticker.activeCount,ticker.scheduled];}),[0,false]);
   await page.evaluate(()=>dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));await page.waitForFunction(()=>document.querySelectorAll('.canvas-overlay').length===1);await page.waitForFunction(()=>getComputedStyle(document.querySelector('.canvas-overlay')).display==='block');
  }
  check('visibility event, real viewport exit/return, dynamic reduced-motion and three pagehide/pageshow cycles: pause/cleanup/restart without duplicate canvas or ticker');await c.close();
 }
 for(const value of ['{broken',JSON.stringify({...JSON.parse(originalScene),photo:{...JSON.parse(originalScene).photo,width:1000}}),JSON.stringify({...JSON.parse(originalScene),effects:[]})]){
  writeFileSync(scene,value);const c=await context();const {page,requests}=await visit(c);await page.waitForTimeout(250);assert.equal((await inspect(page)).canvasCount,0);assert.equal(requests.filter(url=>url.includes('/assets/vendor/effect-engine/')).length,0);await c.close();
 }writeFileSync(scene,originalScene);check('invalid JSON, mismatched photo ratio and no enabled layers retain static panorama without engine import');
 {
  const c=await context();const {page}=await visit(c);await page.waitForFunction(()=>window.__effectProbe.frames>3);await page.evaluate(()=>window.__slow=true);await page.waitForFunction(()=>document.querySelector('.hero-photo').dataset.water==='static-performance',null,{timeout:12000});assert.equal((await inspect(page)).canvasCount,0);assert.deepEqual(await page.evaluate(async()=>{const {ticker}=await import('/assets/vendor/effect-engine/src/runtime/ticker.mjs');return [ticker.activeCount,ticker.scheduled];}),[0,false]);assert.equal(await page.locator('.hero-photo').evaluate(i=>i.complete&&i.naturalWidth>0),true);check('synthetic sustained 20ms Canvas draw: engine degrades then static-performance fallback; canvas/ticker released');await c.close();
 }
 assert.deepEqual(report.pageErrors,[]);report.passed=true;
}finally{writeFileSync(join(output,'results.json'),JSON.stringify(report,null,2)+'\n');await browser?.close();php.kill('SIGTERM');await new Promise(r=>php.exitCode!==null?r():php.once('exit',r));rmSync(temp,{recursive:true,force:true});}
console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,screenshots:report.screenshots.length,output,metrics:report.metrics},null,2));
