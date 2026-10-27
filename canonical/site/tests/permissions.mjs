// Real isolated PHP/SQLite API, using the canonical fixture publication protocol.
// Source module is a test dependency only, never included by the site runtime.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {cpSync,mkdirSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,relative,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import net from 'node:net';
const source=resolve(process.env.YA_SOURCE_ROOT||fileURLToPath(new URL('../../../../YardimciAsistan/',import.meta.url)));
const {activateFixtureSource,publicationEnvelope}=await import(pathToFileURL(join(source,'scripts/test-helpers/publication-protocol.mjs')));
const temp=mkdtempSync(join(tmpdir(),'gundogdu-permissions-'));
const site=join(temp,'site'),hosting=join(site,'public/yardimci-asistan');
let php;
try {
  cpSync(fileURLToPath(new URL('../../',import.meta.url)),site,{recursive:true});
  const module=join(source,'firm-template/web-module');
  cpSync(module,hosting,{recursive:true,filter:p=>! /^(?:data|media)(?:\/|$)/.test(relative(module,p))&&!p.includes('.local.')});
  mkdirSync(join(hosting,'data'),{recursive:true});
  const secret='isolated-gundogdu-test-secret',client='gundogdu-test';
  writeFileSync(join(hosting,'config/business.json'),JSON.stringify({id:'TEST-gundogdu',profile_id:'pension_restaurant',phone:'+905550100099',sync_secret:secret,allowed_origins:[]}));
  const port=await new Promise(r=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p));});});
  const origin=`http://127.0.0.1:${port}`,api=origin+'/yardimci-asistan';
  writeFileSync(join(site,'site/config.php'),`<?php return json_decode(<<<'JSON'\n${JSON.stringify({api_origin:origin,public_origin:'https://gundogdu.example.test',api_base_path:'/yardimci-asistan',local_api_root:hosting,php_cli_binary:'/usr/bin/php',effects:[]})}\nJSON,true);\n`);
  php=spawn('php',['-d','opcache.enable=0','-S',`127.0.0.1:${port}`,'-t',join(site,'public')],{stdio:'ignore'});
  const request=(endpoint,body)=>fetch(api+'/api/'+endpoint+'.php',body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  for(let n=0;;n++){try{assert.equal((await request('version')).status,200);break;}catch(e){if(n>100)throw e;await new Promise(r=>setTimeout(r,25));}}
  assert.equal((await (await request('business')).json()).business_publication.enabled,false,'Bootstrap identity is not a business publication');
  const payload={customer_name:'TEST Visitor',customer_phone:'+905550100001',guest_count:1,message:'Isolated TEST request'};
  assert.equal((await request('request',{...payload,request_type:'general_info',idempotency_key:'missing'})).status,403);
  await activateFixtureSource(api,secret,client);
  const publish=async body=>{const res=await fetch(api+'/api/sync.php',{method:'POST',headers:{'Content-Type':'application/json','X-YA-Sync-Secret':secret},body:JSON.stringify(publicationEnvelope(body,client))});assert.equal(res.status,200,await res.text());};
  const caps=['core.customers','customer.requests','accommodation.rooms','food_service.tables'];
  await publish({action:'publish_android_snapshot',snapshot:{business_capabilities:caps}});
  await publish({action:'publish_business_context',business_context:{business_name:'TEST Gündoğdu',profile_id:'pension_restaurant'}});
  await publish({action:'publish_room_catalog',room_catalog:{enabled:true,rooms:[{id:'TEST-room',name:'TEST Oda',capacity:2}]}});
  await publish({action:'publish_table_catalog',table_catalog:{enabled:true,tables:[{id:'TEST-table',name:'TEST Masa',capacity:4}]}});
  const page=async query=>{const res=await fetch(origin+'/?'+query);return {status:res.status,html:await res.text()};};
  assert.equal((await page('page=rooms&id=unknown')).status,404);assert.equal((await page('page=restaurant&id=unknown')).status,404);
  const published=(await (await request('business')).json());assert.equal(published.business_publication.enabled,true);assert.ok(published.business_publication.fields.includes('business_name'));
  const before=published.business;
  assert.ok(before.request_types.includes('general_info'));assert.ok(!before.request_types.includes('pension_reservation'));assert.ok(!before.request_types.includes('restaurant_reservation'));
  const general=await request('request',{...payload,request_type:'general_info',idempotency_key:'gundogdu-test-general-no-date'});assert.equal(general.status,201,await general.text());
  for(const type of ['pension_reservation','restaurant_reservation'])assert.equal((await request('request',{...payload,request_type:type,idempotency_key:'closed-'+type})).status,403);
  assert.ok(!(await page('page=rooms&id=TEST-room')).html.includes('data-ya-action="accommodation.reserve"'));
  assert.ok(!(await page('page=restaurant&id=TEST-table')).html.includes('data-ya-action="food.reserve"'));
  await publish({action:'publish_android_snapshot',snapshot:{business_capabilities:[...caps,'accommodation.reservations','food_service.reservations']}});
  const open=(await (await request('business')).json()).business;
  assert.ok(open.request_types.includes('pension_reservation')&&open.request_types.includes('restaurant_reservation'));
  assert.ok((await page('page=rooms&id=TEST-room')).html.includes('data-ya-action="accommodation.reserve"'));
  assert.ok((await page('page=restaurant&id=TEST-table')).html.includes('data-ya-action="food.reserve"'));
  // Date requirements remain API-owned even when the optional permission is ON.
  for(const type of ['pension_reservation','restaurant_reservation'])assert.equal((await request('request',{...payload,request_type:type,idempotency_key:'missing-date-'+type})).status,422);
  const tomorrow=new Date(Date.now()+86400000).toISOString().slice(0,10),next=new Date(Date.now()+172800000).toISOString().slice(0,10);
  for(const type of ['pension_reservation','restaurant_reservation']){
    const res=await request('request',{...payload,request_type:type,start_date:tomorrow,end_date:next,time:'18:00',idempotency_key:'valid-'+type});
    assert.equal(res.status,201,await res.text());
  }
  await publish({action:'publish_room_catalog',room_catalog:{enabled:false,rooms:[{id:'TEST-room',name:'TEST withdrawn'}]}});
  await publish({action:'publish_table_catalog',table_catalog:{enabled:false,tables:[{id:'TEST-table',name:'TEST withdrawn'}]}});
  assert.equal((await page('page=rooms&id=TEST-room')).status,404);assert.equal((await page('page=restaurant')).status,404);assert.equal((await page('page=restaurant&id=TEST-table')).status,404);
  await publish({action:'publish_android_snapshot',snapshot:{business_capabilities:[]}});
  for(const type of ['general_info','pension_reservation','restaurant_reservation'])assert.equal((await request('request',{...payload,request_type:type,idempotency_key:'withdrawn-'+type})).status,403);
  await publish({action:'publish_business_context',business_context:{business_name:'',phone:null,profile_id:'pension_restaurant'}});
  const cleared=(await (await request('business')).json());assert.equal(cleared.business_publication.enabled,true);assert.ok(!cleared.business_publication.fields.includes('business_name'),'An empty published name must not authorize fallback identity SEO');assert.equal(cleared.business.phone,'','The existing publisher normalizes null phone into an explicit clear');
  await publish({action:'publish_business_context',business_context:{business_name:'TEST Gündoğdu',phone:null,profile_id:'pension_restaurant'}});
  const seo=(await page('page=home')).html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];assert.ok(seo,'Published identity must produce structured data');assert.ok(seo.includes('TEST Gündoğdu'));assert.ok(!seo.includes('+905550100099'),'An explicitly cleared phone must never use bootstrap contact in SEO');assert.ok(!seo.includes('"telephone"'));
  console.log('gundogdu-permissions-ok: missing/optional/withdrawn capabilities; real general request 201 without date; room/table OFF 403, ON no-date 422, valid-date 201; gated room/table detail CTAs, unknown and withdrawn detail routes 404; cleared identity excluded from SEO; null phone normalized empty without bootstrap contact in JSONLD');
}finally{
  if(php){php.kill('SIGTERM');await new Promise(r=>php.exitCode!==null?r():php.once('exit',r));}
  rmSync(temp,{recursive:true,force:true});
}
