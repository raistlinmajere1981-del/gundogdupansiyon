// Synthetic TEST projections. No live API, credentials or customer records.
import http from 'node:http';
export const freshState = () => ({
  surfaces:['rooms','restaurant','qr_menu'], enabled:true, requests:true, types:['general_info'],
  rooms:[{id:'TEST-room',name:'TEST Yayınlı oda',description:'Yalnız yerel doğrulama kaydı; gerçek işletme odası değildir.',capacity:2,media:[]}],
  tables:[{id:'TEST-table',name:'TEST Yayınlı masa',capacity:4,media:[]}],
  menu:[{id:'TEST-item',category_id:'TEST-category',name:'TEST Menü kalemi',price:100,currency:'TRY'}],
  businessError:false, endpointError:'', business:{}, localization:null, announcements:[],reviews:[],calls:[],
});
export async function fixtureServer(state) {
  const server=http.createServer((req,res)=>{
    const path=new URL(req.url,'http://fixture.test').pathname.replace('/yardimci-asistan/api/','').replace(/\.php$/,'');
    state.calls.push(path);let status=200,data={ok:true};
    if(path==='business') {status=state.businessError?503:200;data={ok:!state.businessError,business_publication:{enabled:true,fields:['business_name','description','phone','email','address','gallery','social_links']},business:{display_name:'TEST Gündoğdu',profile_id:'pension_restaurant',public_surfaces:state.surfaces,ai_enabled:false,requests_enabled:state.requests,request_types:state.requests?state.types:[],whatsapp_enabled:false,phone:'',email:'',address:'',...state.business},...(state.localization?{localization:state.localization}:{})};}
    else if(path==='rooms')data={ok:true,enabled:state.enabled,rooms:state.rooms};
    else if(path==='tables')data={ok:true,enabled:state.enabled,tables:state.tables};
    else if(path==='menu')data={ok:true,enabled:state.enabled,categories:[{id:'TEST-category',name:'TEST Kategori'}],items:state.menu};
    else if(path==='account/config')data={ok:true,enabled:false};
    else if(path==='marketing')data={ok:true,publications:state.announcements};
    else if(path==='google-reviews')data={available:true,reviews:state.reviews};
    else {status=404;data={ok:false};}
    if(state.endpointError===path){status=503;data={ok:false};}
    res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  return {server,origin:`http://127.0.0.1:${server.address().port}`};
}
export async function proxyServer(phpOrigin,apiOrigin){
  const server=http.createServer((req,res)=>{
    const destination=req.url.startsWith('/yardimci-asistan/api/')?apiOrigin:phpOrigin;
    const upstream=http.request(destination+req.url,{method:req.method,headers:{...req.headers,host:new URL(destination).host}},reply=>{res.writeHead(reply.statusCode,reply.headers);reply.pipe(res);});
    upstream.on('error',()=>{res.writeHead(502);res.end('TEST fixture unavailable');});req.pipe(upstream);
  });await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  return {server,origin:`http://127.0.0.1:${server.address().port}`};
}
