<?php
// CLI transport probe: observe common redirect headers before canonical exits.
declare(strict_types=1);
namespace YaSite {
    function header(string $header, bool $replace=true, int $status=0): void {
        $GLOBALS['probe_headers'][]=$header;
        if($status) \http_response_code($status);
    }
}
namespace {
    putenv('YA_SITE_API_ORIGIN=offline-test');
    $_SERVER['REQUEST_URI']=$argv[1] ?? '/';$_SERVER['REQUEST_METHOD']=$argv[3] ?? 'GET';
    parse_str($argv[2] ?? '',$_GET);
    $path=parse_url($_SERVER['REQUEST_URI'],PHP_URL_PATH);
    $root=dirname(__DIR__,2);$route=trim($path,'/');
    $entry=$route!=='' && is_file($root.'/'.$route.'/index.php') ? $root.'/'.$route.'/index.php' : $root.'/index.php';
    ob_start();
    register_shutdown_function(static function():void {
        $body=ob_get_clean();echo json_encode(['status'=>http_response_code() ?: 200,'headers'=>$GLOBALS['probe_headers'] ?? [],'body'=>$body,'included'=>get_included_files()],JSON_THROW_ON_ERROR);
    });
    require $entry;
}
