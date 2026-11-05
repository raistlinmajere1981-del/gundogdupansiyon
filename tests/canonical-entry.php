<?php
// Narrow no-socket test. All publication records below are synthetic.
declare(strict_types=1);
function check(bool $condition, string $message): void { if (!$condition) throw new RuntimeException($message); }
putenv('YA_SITE_API_ORIGIN=offline-test');
$_SERVER['REQUEST_URI'] = '/'; $_SERVER['REQUEST_METHOD'] = 'GET';
$_GET = ['lang'=>'en']; $_COOKIE = ['ya_site_language'=>'ar','gundogdu_site_language'=>'en'];
ob_start(); require __DIR__ . '/../index.php'; $html = ob_get_clean();
check(str_contains($html, '<html lang="tr"'), 'Language OFF ignores query and stale cookies');
check(!str_contains($html, 'class="language-picker"'), 'No language selector while OFF');
check(str_contains($html, '/assets/core/site.mjs') && str_contains($html, '/assets/site/theme.css'), 'Canonical assets active');
check(str_contains($html, '/assets/site/brand/mark.svg') && str_contains($html, '/assets/site/img/gideros-1-1818.webp'), 'Gideros photos and brand retained');
check(str_contains($html, 'id="site-context"'), 'Common layout rendered');
check(in_array(realpath(__DIR__.'/../canonical/public/index.php'), get_included_files(), true), 'Real root included canonical');
check(!in_array(realpath(__DIR__.'/../inc/site.php'), get_included_files(), true), 'Independent layout inactive');
check(!preg_match('~/assets/(?:js|assistant|effects|effect-engine|i18n)/~', $html), 'No independent runtime or old effects');
$root = __DIR__.'/../canonical'; $config = require $root.'/site/config.php';
$source = \YaSite\source_catalog($root);
check($source['id']==='gundogdu-site' && $source['source_language']==='tr', 'Desktop source identity');
check(count($source['entries'])<=2048 && strlen(json_encode($source,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR))<=512*1024, 'Source limits');
$old=json_decode(file_get_contents(__DIR__.'/../assets/i18n/tr.json'),true,512,JSON_THROW_ON_ERROR);
foreach($old['entries'] as $key=>$entry) check($source['entries'][$key]===$entry,'Original source key preserved: '.$key);
$business=['ok'=>true,'business_publication'=>['enabled'=>true,'fields'=>['business_name','phone','address','gallery']], 'business'=>[
    'display_name'=>'TEST Gündoğdu','public_surfaces'=>['rooms','restaurant','qr_menu'],'about_text'=>'TEST About',
    'phone'=>'+905550000000','gallery'=>[['url'=>'https://media.example.test/TEST.jpg','title'=>'TEST gallery']],
    'google_reviews_enabled'=>true,'ai_enabled'=>false,'requests_enabled'=>true,'request_types'=>['general_info','pension_reservation','restaurant_reservation'],
]];
$media=[['id'=>'TEST-180','kind'=>'panorama_180','url'=>'/yardimci-asistan/media/TEST-180.jpg','published'=>true],['id'=>'TEST-360','kind'=>'panorama_360','url'=>'/yardimci-asistan/media/TEST-360.jpg','published'=>true],['kind'=>'panorama_360','url'=>'/yardimci-asistan/media/PRIVATE.jpg','published'=>false]];
$sources=[];
foreach([
    'rooms'=>['ok'=>true,'enabled'=>true,'rooms'=>[['id'=>'TEST-room','name'=>'TEST Room','capacity'=>2,'media'=>$media]]],
    'tables'=>['ok'=>true,'enabled'=>true,'tables'=>[['id'=>'TEST-table','name'=>'TEST Table','capacity'=>4,'media'=>$media]]],
    'menu'=>['ok'=>true,'enabled'=>true,'categories'=>[['id'=>'TEST-category','name'=>'TEST category']],'items'=>[['id'=>'TEST-item','category_id'=>'TEST-category','name'=>'TEST item']]],
    'marketing'=>['ok'=>true,'publications'=>[['id'=>'TEST-news','title'=>'TEST News','published'=>true,'channel'=>'website']]],
    'google-reviews'=>['available'=>true,'reviews'=>[['text'=>'TEST review','author'=>'TEST author']]],
] as $key=>$data) $sources[$key]=['status'=>'ok','data'=>$data];
$publication=\YaSite\project_publication($business,$sources,'/yardimci-asistan','tr');
$pages=\YaSite\available_pages($publication,$config,$root);
foreach(['home','about','rooms','restaurant','menu','contact','gallery','announcements','reviews'] as $page) check(isset($pages[$page]),'Published gate ON: '.$page);
$language=\YaSite\language_context($root,$business);
$site=['root'=>$root,'base_path'=>'','module_path'=>'/yardimci-asistan','public_origin'=>'https://gundogdu.example.test','language'=>$language,'favicon'=>'/assets/site/brand/favicon.svg'];
set_error_handler(static function(int $level,string $message,string $file,int $line): never {throw new ErrorException($message,0,$level,$file,$line);});
foreach($pages as $page=>$definition) {
    $render=['publication'=>$publication,'pages'=>$pages,'page'=>$page,'title'=>'TEST title','room'=>$page==='rooms'?$publication['rooms'][0]:null,'table'=>$page==='restaurant'?$publication['tables'][0]:null,'menu_category'=>'','menu_categories'=>$publication['categories'],'effects'=>[],'canonical'=>'','status'=>'ok','demo_widget_visible'=>false];
    ob_start(); \YaSite\render_view('layout',$render,$site); $rendered=ob_get_clean();
    check(substr_count($rendered,'src="/assets/core/widget.js"')===1,'Single common widget: '.$page);
    check(str_contains($rendered,'data-ai-enabled="false"') && str_contains($rendered,'data-requests-enabled="true"'),'AI OFF / requests ON independently: '.$page);
    if(in_array($page,['rooms','restaurant'],true)) {
        check(str_contains($rendered,'data-panorama="panorama_180"') && str_contains($rendered,'data-panorama="panorama_360"'),'Both published panorama types: '.$page);
        check(str_contains($rendered,'/assets/core/panorama.mjs') && !str_contains($rendered,'PRIVATE.jpg'),'Common panorama owner and unpublished media filtered');
    }
    preg_match_all('~(?:src|href)="(/assets/[^"?]+)"~',$rendered,$assets);
    foreach($assets[1] as $asset) check(is_file(__DIR__.'/..'.$asset),'Root asset exists: '.$asset);
}
restore_error_handler();
foreach([[true,false],[false,true],[false,false]] as [$ai,$requests]) {
    $alternate=$business;$alternate['business']['ai_enabled']=$ai;$alternate['business']['requests_enabled']=$requests;
    $alternate['business']['phone']='';$alternate['business']['gallery']=[];
    $projected=\YaSite\project_publication($alternate,$sources,'/yardimci-asistan','tr');
    $render['publication']=$projected;$render['page']='home';$render['room']=null;$render['table']=null;
    ob_start();\YaSite\render_view('layout',$render,$site);$gated=ob_get_clean();
    check(substr_count($gated,'src="/assets/core/widget.js"')===($ai||$requests?1:0),'Widget independently gated');
    if($ai||$requests) check(str_contains($gated,'data-ai-enabled="'.($ai?'true':'false').'"') && str_contains($gated,'data-requests-enabled="'.($requests?'true':'false').'"'),'Independent widget attributes');
}
$business['business']['public_surfaces']=[];
$closed=\YaSite\available_pages(\YaSite\project_publication($business,$sources,'/yardimci-asistan','tr'),$config,$root);
foreach(['rooms','restaurant','menu'] as $page) check(!isset($closed[$page]),'Surface OFF: '.$page);
$business['business']['public_surfaces']=['rooms','restaurant','qr_menu'];
foreach(['rooms','tables','menu'] as $key) $sources[$key]['data']['enabled']=false;
$closed=\YaSite\available_pages(\YaSite\project_publication($business,$sources,'/yardimci-asistan','tr'),$config,$root);
foreach(['rooms','restaurant','menu'] as $page) check(!isset($closed[$page]),'Endpoint enabled OFF: '.$page);
$empty=\YaSite\available_pages(\YaSite\project_publication([],[],'/yardimci-asistan','tr'),$config,$root);
check(array_keys($empty)===['home'],'Unavailable publication only home');
$business['localization']=['version'=>1,'source_language'=>'tr','target_languages'=>['en'],'languages'=>[['code'=>'en','locale'=>'en-GB','nativeName'=>'English'],['code'=>'de','locale'=>'de-DE','nativeName'=>'Deutsch']], 'site_catalog'=>['id'=>$source['id'],'entries'=>$source['entries']], 'translations'=>['site_text'=>[$source['id'].':page.home'=>['en'=>['text'=>'TEST Home']]]]];
$_GET=['lang'=>'en'];$translated=\YaSite\language_context($root,$business);
check($translated['code']==='en' && $translated['messages']['page.home']==='TEST Home','Published locale ON with matching source hash');
check(array_keys($translated['catalogs'])===['tr','en'],'Only published target languages');
$_GET=['lang'=>'de'];check(\YaSite\language_context($root,$business)['code']==='tr','Unpublished target rejected');
$business['localization']['site_catalog']['entries']['page.home']['hash']='stale';$_GET=['lang'=>'en'];
check(\YaSite\language_context($root,$business)['messages']['page.home']===$source['entries']['page.home']['text'],'Stale translation hash falls back');
echo 'canonical-entry-php-ok: actual root, 9 page renders, gates, source '.count($source['entries']).' entries, published locale, widget, 180/360 SSR'.PHP_EOL;
