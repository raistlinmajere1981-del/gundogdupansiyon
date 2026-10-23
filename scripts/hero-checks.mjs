import assert from 'node:assert/strict';
export async function checkHero(page,{origin,visit,screenshot,check,activeInstalled}) {
  await page.emulateMedia({reducedMotion:'no-preference'});
  await visit(origin+'/');
  await page.waitForFunction(()=>window.heroEffects?.settled);
  assert.equal(await page.locator('.motion-toggle,.wave-guide,.wave-debug-panel').count(),0);
  if(activeInstalled){
    await page.waitForFunction(()=>window.heroEffects?.inspect().frames>1);
    assert.equal(await page.locator('.canvas-overlay').count(),1);
  } else {
    assert.equal(await page.locator('.canvas-overlay').count(),0);
  }
  await visit(origin+'/?effect-scene=sample');
  await page.waitForFunction(()=>window.heroEffects?.inspect().frames>2);
  assert.equal(await page.locator('.canvas-overlay').count(),1);
  await screenshot(page,'fixture-desktop-home',true);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>document.querySelectorAll('.canvas-overlay').length===0);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.waitForFunction(()=>window.heroEffects?.inspect().frames>2);
  assert.equal(await page.locator('.canvas-overlay').count(),1);
  await visit(origin+'/?effect-scene=off');
  await page.waitForFunction(()=>window.heroEffects?.settled);
  assert.equal(await page.locator('.canvas-overlay').count(),0);
  check('Studio scene: installed JSON, no obsolete controls, sample preview, reduced motion and off mode');
}
