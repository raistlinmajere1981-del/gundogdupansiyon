import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const require=createRequire(new URL('../.local/browser-tools/package.json',import.meta.url));
const {chromium}=require('@playwright/test');
const output=new URL('../.test-artifacts/',import.meta.url).pathname;
mkdirSync(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/usr/bin/brave',headless:true,args:['--no-sandbox']});
try {
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  await page.goto(process.env.GUNDOGDU_PREVIEW_URL || 'http://127.0.0.1:8077/');
  await page.waitForFunction(()=>document.body.dataset.publicState==='ready');
  await page.evaluate(()=>document.fonts.ready);
  await page.locator('main img').evaluateAll(images=>images.forEach(image=>{image.loading='eager';}));
  await page.waitForFunction(()=>[...document.querySelectorAll('main img')].every(image=>image.complete && image.naturalWidth>0));
  await page.screenshot({path:join(output,'desktop-home.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.waitForFunction(()=>[...document.querySelectorAll('main img')].every(image=>image.complete && image.naturalWidth>0));
  await page.screenshot({path:join(output,'mobile-home.png'),fullPage:true});
  await page.locator('.header-booking').click();await page.waitForTimeout(250);
  await page.screenshot({path:join(output,'mobile-widget.png')});
  const audit=await page.evaluate(()=>({
    loadedFonts:document.fonts.check('500 24px Cormorant')&&document.fonts.check('400 16px Manrope'),
    brokenImages:[...document.querySelectorAll('main img')].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src),
    overflow:document.documentElement.scrollWidth-innerWidth,
    widgetPrimary:getComputedStyle(document.querySelector('.ya-widget-header')).backgroundColor
  }));
  writeFileSync(join(output,'live-read-preview.json'),JSON.stringify(audit,null,2));
  console.log(audit);
} finally { await browser.close(); }
