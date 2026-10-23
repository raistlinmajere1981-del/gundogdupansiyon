import assert from 'node:assert/strict';
import {readFileSync,cpSync,mkdirSync,mkdtempSync,rmSync,writeFileSync,readdirSync,existsSync,statSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {importProject} from '../assets/effect-engine/src/model/project.mjs';
import {compileScene,ENGINE_VERSION} from '../assets/effect-engine/src/runtime/index.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));
const studio=resolve(process.env.EFFECT_STUDIO_ROOT||join(root,'../EfektAtolyesi'));
function files(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(join(dir,e.name)).map(p=>e.name+'/'+p):[e.name]).sort();}
assert.equal(ENGINE_VERSION,'1.1.0');
for(const part of ['runtime','registry','model']){
  const a=join(studio,'src',part),b=join(root,'assets/effect-engine/src',part);
  assert.deepEqual(files(a),files(b));for(const p of files(a))assert.deepEqual(readFileSync(join(a,p)),readFileSync(join(b,p)),p);
}
const sample=importProject(readFileSync(join(root,'assets/effects/hero.sample.scene.json'),'utf8'));
assert.ok(compileScene(sample).effects.length>=2);
assert.ok(!sample.effects.some(e=>e.type==='foam'));
const temp=mkdtempSync(join(tmpdir(),'effect-install-'));
try{
  for(const dir of ['scripts','assets/effect-engine']){mkdirSync(join(temp,dir),{recursive:true});}
  for(const f of ['install-effect-scene.sh','install-effect-scene.mjs','sync-effect-engine.sh'])cpSync(join(root,'scripts',f),join(temp,'scripts',f));
  cpSync(join(root,'assets/effect-engine'),join(temp,'assets/effect-engine'),{recursive:true});
  const target=join(temp,'assets/effects/hero.scene.json'),input=join(temp,'export with spaces.json');
  const run=(check=false)=>spawnSync('bash',[join(temp,'scripts/install-effect-scene.sh'),'export with spaces.json',...(check?['--check-only']:[])],{cwd:temp,encoding:'utf8'});
  writeFileSync(input,JSON.stringify(sample));assert.equal(run(true).status,0);assert.equal(existsSync(target),false);
  assert.equal(run().status,0);assert.equal(statSync(target).mode&0o777,0o644);const installed=readFileSync(target,'utf8');assert.deepEqual(importProject(installed),sample);
  const invalid=[s=>s.photo.width++,s=>s.photo.height++,s=>s.version=999,s=>s.effects[0].type='foam',s=>s.effects[0].params.count=-1,s=>s.zones[0].points=[[0,0],[100,100],[0,100],[100,0]],s=>s.zones[0].points[0]=[-1,0],s=>s.effects[0].zoneId='missing'];
  for(const mutate of invalid){const s=structuredClone(sample);mutate(s);writeFileSync(input,JSON.stringify(s));for(const check of [true,false]){assert.notEqual(run(check).status,0);assert.equal(readFileSync(target,'utf8'),installed);}}
  writeFileSync(input,'{broken');assert.notEqual(run().status,0);assert.equal(readFileSync(target,'utf8'),installed);
  const next=structuredClone(sample);next.name+=' edited';writeFileSync(input,JSON.stringify(next));assert.equal(run(true).status,0);assert.equal(readFileSync(target,'utf8'),installed);
  const absolute=spawnSync('bash',[join(temp,'scripts/install-effect-scene.sh'),input],{cwd:'/',encoding:'utf8'});assert.equal(absolute.status,0,absolute.stderr);assert.equal(importProject(readFileSync(target,'utf8')).name,next.name);
  assert.deepEqual(readdirSync(join(temp,'assets/effects')),['hero.scene.json']);
  const beforeSync=readFileSync(target,'utf8');
  const sync=spawnSync('bash',[join(temp,'scripts/sync-effect-engine.sh')],{env:{...process.env,EFFECT_STUDIO_ROOT:studio},encoding:'utf8'});
  assert.equal(sync.status,0,sync.stderr);assert.equal(readFileSync(target,'utf8'),beforeSync);
  assert.equal(readFileSync(join(temp,'assets/effect-engine/VERSION'),'utf8'),'1.1.0\n');
  for(const part of ['runtime','registry','model'])for(const f of files(join(studio,'src',part)))assert.deepEqual(readFileSync(join(studio,'src',part,f)),readFileSync(join(temp,'assets/effect-engine/src',part,f)));
}finally{rmSync(temp,{recursive:true,force:true});}
console.log('effect-engine-ok: byte-identical 1.1.0 vendor, compile, schema, dimensions, check-only and atomic replacement');
