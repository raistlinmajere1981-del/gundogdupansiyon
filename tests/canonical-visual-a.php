<?php
// Narrow SSR acceptance, no API/network, no writes or full runner.
declare(strict_types=1);
require __DIR__ . '/../canonical/core/bootstrap.php';
function check(bool $ok, string $label): void { if (!$ok) throw new RuntimeException($label); }
$root = __DIR__ . '/../canonical';
$site = ['root'=>$root,'base_path'=>'','module_path'=>'/yardimci-asistan','public_origin'=>'https://example.test','language'=>\YaSite\language_context($root,[])];
function render(string $name, array $view): string { global $site; ob_start(); \YaSite\render_view($name,$view,$site); return ob_get_clean(); }
set_error_handler(static function(int $level,string $message,string $file,int $line): never {throw new ErrorException($message,0,$level,$file,$line);});
$catalog = require $root . '/site/views/components/photo-credit-catalog.php';
$photo = array_key_first(array_filter($catalog, static fn(array $credit): bool => $credit['license'] === 'CC BY 2.0'));
$pano = array_key_first(array_filter($catalog, static fn(array $credit): bool => str_contains($credit['title'], '360°')));
$media = [
 ['id'=>'TEST-cover','kind'=>'cover','title'=>$photo,'url'=>'/yardimci-asistan/media/TEST-cover.jpg','published'=>true],
 ['id'=>'TEST-pano','kind'=>'panorama_360','title'=>$pano,'url'=>'/yardimci-asistan/media/TEST-pano.jpg','published'=>true],
 ['id'=>'TEST-external','kind'=>'photo','title'=>$photo,'url'=>'https://visitor.example.test/photo.jpg','published'=>true],
 ['id'=>'TEST-unknown','kind'=>'photo','title'=>'TEST Visitor','url'=>'https://visitor.example.test/other.jpg','published'=>true],
 ['id'=>'TEST-private','kind'=>'photo','title'=>$photo,'url'=>'/yardimci-asistan/media/PRIVATE.jpg','published'=>false],
 ['id'=>'TEST-invalid','kind'=>'photo','title'=>$photo,'url'=>'javascript:alert(1)','published'=>true],
];
$record=['id'=>'TEST-room','name'=>'TEST Room','media'=>$media];
$gallery=render('components/resource-media',['record'=>$record]);
check(!str_contains($gallery,'PRIVATE.jpg')&&!str_contains($gallery,'javascript:'),'Unpublished and invalid media excluded');
check(str_contains($gallery,'data-panorama="panorama_360"')&&str_contains($gallery,'data-src="/yardimci-asistan/media/TEST-pano.jpg"'),'Panorama hook retained');
check(str_contains($gallery,'alt="'.\YaSite\e($pano).'"'),'Original published title remains in alt');
check(str_contains($gallery,'TEST Visitor'),'Visitor caption retained');
$credits=render('components/published-photo-credits',['publication'=>['rooms'=>[$record],'tables'=>[$record]]]);
check(substr_count($credits,'<li>')===2,'Published known local credits deduplicated; external URLs never licensed');
check(str_contains($credits,'https://creativecommons.org/licenses/by/2.0/')&&str_contains($credits,'https://creativecommons.org/licenses/by/4.0/'),'Original CC BY 2.0/4.0 links retained');
check(str_contains($credits,'commons.wikimedia.org')&&str_contains($credits,'Horálek'),'Actual author and source retained');
$external=render('components/published-photo-credits',['publication'=>['rooms'=>[['media'=>[$media[2],$media[3]]]],'tables'=>[]]]);
check(!str_contains($external,'creativecommons.org'),'External visitor photos carry no inferred license');
$heading=render('components/page-header',['title'=>'Odalar','eyebrow'=>'ODALAR','lede'=>'TEST lede']);
check(!str_contains($heading,'class="eyebrow"')&&str_contains($heading,'<h1>Odalar</h1>'),'Only repeated eyebrow removed');
check(str_contains(render('components/page-header',['title'=>'TEST Main','eyebrow'=>'TEST Meaningful']),'TEST Meaningful'),'Meaningful label retained');
$full=str_repeat('TEST duyuru açıklaması. ',40).'TEST end of full text';
$announcements=[];
for($i=0;$i<4;$i++)$announcements[]=['id'=>'TEST-news-'.$i,'title'=>'TEST News '.$i,'text'=>$full,'published'=>true,'channel'=>'website','images'=>[['url'=>'/yardimci-asistan/media/TEST.jpg','altText'=>'TEST alt','published'=>true],['url'=>'/yardimci-asistan/media/PRIVATE.jpg','published'=>false],['url'=>'javascript:alert(1)','published'=>true]]];
$publication=\YaSite\project_publication(['ok'=>true,'business'=>['display_name'=>'TEST Site','public_surfaces'=>[]]],['marketing'=>['data'=>['ok'=>true,'publications'=>$announcements]]],'/yardimci-asistan','tr');
$view=['page'=>'home','title'=>'Duyurular','publication'=>$publication,'pages'=>['home'=>['key'=>'page.home'],'announcements'=>['key'=>'page.announcements']],'status'=>'ok'];
$news=render('pages/announcements',$view);
check(substr_count($news,'class="announcement-text"')===4&&str_contains($news,'TEST end of full text'),'Long text retained in disclosures');
check(!str_contains($news,'PRIVATE.jpg')&&!str_contains($news,'javascript:'),'Announcement image publication/URL checks retained');
$home=render('pages/home',$view);
check(substr_count($home,'class="announcement-preview-image"')===3,'Home capped at three valid image previews');
check(!str_contains($home,'TEST end of full text'),'Home excerpt remains short');
$footer=render('components/footer',$view);
check(str_contains($footer,'id="photo-credits"')&&!str_contains($footer,'id="photo-credits" open'),'Credits collapsed initially');
check(str_contains($footer,'creativecommons.org/licenses/by-sa/3.0/')&&str_contains($footer,'Gideros_Bay1.jpg'),'Original Gideros attribution retained');
// QR menu data URIs are accepted only for bounded safe raster payloads.
$menuView = [
  'title' => 'Menü',
  'menu_category' => '',
  'menu_categories' => [['id' => 'TEST-cat', 'name' => 'TEST Kahvaltı']],
  'publication' => [
    'menu_updated_at' => '2026-11-05T15:19:00+03:00',
    'categories' => [['id' => 'TEST-cat', 'name' => 'TEST Kahvaltı']],
    'menu' => [
      ['id'=>'TEST-menu-1','name'=>'TEST Menü görseli','category_id'=>'TEST-cat','image_url'=>'data:image/jpeg;base64,'.base64_encode("PHOTO-DATA"),'price'=>25,'currency'=>'TRY','is_featured'=>false,'description'=>'','allergens'=>[],'tags'=>[]],
      ['id'=>'TEST-menu-2','name'=>'TEST Zararlı URL','category_id'=>'TEST-cat','image_url'=>'javascript:alert(1)','price'=>30,'currency'=>'TRY','is_featured'=>false,'description'=>'','allergens'=>[],'tags'=>[]],
      ['id'=>'TEST-menu-3','name'=>'TEST SVG URL','category_id'=>'TEST-cat','image_url'=>'data:image/svg+xml;base64,'.base64_encode('<svg onload="alert(1)"/>'),'price'=>40,'currency'=>'TRY','is_featured'=>false,'description'=>'','allergens'=>[],'tags'=>[]]
    ]
  ]
];
$menuHtml = render('pages/menu', $menuView);
check(substr_count($menuHtml, 'class="menu-image"') === 1, 'Only valid raster photo embedded as menu image');
check(str_contains($menuHtml, 'data:image/jpeg;base64,') && !str_contains($menuHtml, 'javascript:') && !str_contains($menuHtml, 'data:image/svg+xml'), 'Unsafe menu photo schemes rejected');
check(!str_contains($menuHtml, 'class="menu-publication-note"'), 'Manual refresh and updated label absent on menu');
echo "visual-a-ssr-ok: publication/media filters, full text, 3 previews, distinct headings, exact local demo credits, external visitor exclusion\n";
