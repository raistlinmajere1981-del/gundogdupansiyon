import {importProject} from '../effect-engine/src/model/project.mjs';
import {compileScene,createOverlay} from '../effect-engine/src/runtime/index.mjs';
const image=document.querySelector('.hero-photo');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const selection=new URLSearchParams(location.search).get('effect-scene');
const sceneURL=new URL(selection==='sample'?'../effects/hero.sample.scene.json':'../effects/hero.scene.json',import.meta.url);
let overlay=null,compiled=null,failed=false;
function safe(){return !reduced.matches&&!navigator.connection?.saveData&&!(navigator.hardwareConcurrency>0&&navigator.hardwareConcurrency<=2)&&!(navigator.deviceMemory>0&&navigator.deviceMemory<=2);}
function present(){
  const available=overlay&&!overlay.inspect().disposed&&safe();
  if(image) image.dataset.water=available?'animated':'static';
}
function sync(){
  if(!safe()){overlay?.destroy();overlay=null;}
  else if(compiled&&!failed&&image?.complete&&image.naturalWidth&&!overlay){
    try {overlay=createOverlay(image,compiled,{enabled:true});overlay.canvas.style.zIndex='3';}
    catch {overlay?.destroy();overlay=null;failed=true;}
  }
  overlay?.setEnabled(true);present();
}
if(image){
  image.dataset.water='static';
  image.addEventListener('load',sync);
  image.addEventListener('water-static-fallback',()=>{failed=true;queueMicrotask(()=>{overlay=null;present();});});
  reduced.addEventListener('change',sync);navigator.connection?.addEventListener?.('change',sync);
  window.heroEffects={inspect:()=>overlay?.inspect()||{running:false,disposed:true},settled:false,scene:selection==='sample'?'sample':'installed'};
  if(selection!=='off'){
    try {
      const response=await fetch(sceneURL,{cache:'no-store'});
      if(response.ok){
        const project=importProject(await response.text());
        if(project.photo.width!==1818||project.photo.height!==1228) throw new Error('Photo dimensions do not match site');
        compiled=compileScene(project);
        compiled.performance.staticFallbackCost=18;
        sync();
      }
    } catch {failed=true;sync();}
  }
  window.heroEffects.settled=true;
  present();
}
