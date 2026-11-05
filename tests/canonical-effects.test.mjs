// Exercise the actual common adapter without a socket or renderer.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mountEffects} from '../canonical/public/assets/core/effects.mjs';
const original=new Map(['matchMedia','navigator','window','location','document','fetch'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
function environment(body, reduced=false) {
  let requested=0,changed=0;
  const listeners={addEventListener(){},removeEventListener(){}};
  const image={complete:true,naturalWidth:1000,naturalHeight:500,isConnected:true,dataset:{},matches:type=>type==='img',getAttribute:()=>'/assets/site/img/TEST.webp'};
  const root={...listeners,querySelectorAll:()=>[image]};
  for(const [key,value] of Object.entries({
    matchMedia:()=>({...listeners,matches:reduced}),navigator:{hardwareConcurrency:8,deviceMemory:8},window:{...listeners},location:{origin:'https://fixture.test'},document:{baseURI:'https://fixture.test/',createElement:()=>{changed++;throw Error('Unexpected effect canvas');}},
    fetch:async()=>{requested++;return {ok:true,text:async()=>body};},
  }))Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});
  return {image,root,requested:()=>requested,changed:()=>changed};
}
function restore(){for(const [key,descriptor] of original){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}}
const binding={slot:'TEST-hero',source:'/assets/site/img/TEST.webp',url:'/assets/site/scenes/TEST.scene.json'};
for(const [name,body] of [['malformed JSON','{invalid TEST scene'],['inactive scene',JSON.stringify({zones:[],effects:[]})],['active but invalid engine project',JSON.stringify({photo:{width:1000,height:500},zones:[{id:'TEST',visible:true}],effects:[{enabled:true,zoneId:'TEST',type:'INVALID'}]})]]) {
  test(name+' retains static photo',async()=>{
    let dispose;try{const fixture=environment(body);dispose=mountEffects([binding],fixture.root);await new Promise(resolve=>setTimeout(resolve,30));assert.equal(fixture.requested(),1);assert.equal(fixture.image.dataset.effectState,'static');assert.equal(fixture.changed(),0);assert.equal(fixture.image.complete,true);}finally{dispose?.();restore();}
  });
}
test('empty bindings and reduced motion make zero scene requests',async()=>{
  let dispose;try{let fixture=environment('{}');dispose=mountEffects([],fixture.root);await Promise.resolve();assert.equal(fixture.requested(),0);dispose();fixture=environment('{}',true);dispose=mountEffects([binding],fixture.root);await Promise.resolve();assert.equal(fixture.requested(),0);assert.equal(fixture.changed(),0);}finally{dispose?.();restore();}
});
