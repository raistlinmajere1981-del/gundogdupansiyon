<?php
// Disposable browser contract fixture; never deployed or connected to a real backend.
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
$root = __DIR__;
$name = basename(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '.php');
file_put_contents($root . '/http-log.jsonl', json_encode(['method'=>$_SERVER['REQUEST_METHOD'],'name'=>$name]) . "\n", FILE_APPEND);
$read = static fn(string $name): array => json_decode(@file_get_contents($root . '/publications/' . $name . '.json') ?: '{}', true) ?: [];
$business = $read('business_context');
$caps = $read('android_snapshot')['business_capabilities'] ?? [];
$surfaces = $business['public_surfaces'] ?? ['accommodation','food_service','rooms','restaurant','menu','qr_menu','directions'];
if ($name === 'business') {
    $business = array_merge(['display_name'=>$business['business_name'] ?? 'YEREL TEST','profile_id'=>'pension_restaurant',
        'public_surfaces'=>$surfaces,'requests_enabled'=>in_array('customer.requests',$caps,true),'ai_enabled'=>false,'whatsapp_enabled'=>false], $business);
    echo json_encode(['ok'=>true,'business'=>$business]);
} elseif (in_array($name,['rooms','tables'],true)) {
    $payload=$read($name === 'rooms' ? 'room_catalog' : 'table_catalog');
    echo json_encode(['ok'=>true,'enabled'=>($payload['enabled'] ?? false) === true,$name=>$payload[$name] ?? []]);
} elseif ($name === 'menu') {
    $payload=$read('menu'); echo json_encode(['ok'=>true,'enabled'=>($payload['enabled'] ?? false) === true,'categories'=>$payload['categories'] ?? [],'items'=>$payload['items'] ?? []]);
} elseif ($name === 'marketing') {
    $payload=$read('marketing_website'); echo json_encode(['ok'=>true,'enabled'=>($payload['enabled'] ?? false) === true,'publications'=>$payload['publications'] ?? []]);
} elseif ($name === 'availability') {
    echo json_encode(['ok'=>true,'available'=>true,'conflicts'=>[],'message'=>'Yalnız yerel test.']);
} elseif ($name === 'request' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $request=json_decode(file_get_contents('php://input'),true);
    $receipts=json_decode(@file_get_contents($root.'/receipts.json') ?: '{}',true) ?: [];
    $key=$request['idempotency_key'] ?? '';
    if (!$key) { http_response_code(422); echo '{"ok":false}'; return; }
    $receipts[$key] ??= ['ok'=>true,'request_id'=>'fixture-'.(count($receipts)+1)];
    file_put_contents($root.'/receipts.json',json_encode($receipts)); echo json_encode($receipts[$key]);
} else { http_response_code(503); echo '{"ok":false}'; }
