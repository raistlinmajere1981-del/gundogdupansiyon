<?php
declare(strict_types=1);

// Site-owned configuration. Public HTTP service only; never a sync secret or DB path.
return [
    'public_origin' => getenv('YA_SITE_PUBLIC_ORIGIN') ?: 'https://yardimciasistangunduodu.alwaysdata.net',
    'api_origin' => getenv('YA_SITE_API_ORIGIN') ?: 'https://yardimciasistangunduodu.alwaysdata.net',
    'api_base_path' => '/yardimci-asistan',
    // Same-host published API transport for restrictive/one-worker PHP hosting.
    // Calls only the canonical read-only public endpoints via PHP CLI.
    'local_api_root' => getenv('YA_SITE_API_ORIGIN') ? null : '/home/yardimciasistangunduodu/www/yardimci-asistan',
    'php_cli_binary' => '/usr/bin/php',
    'base_path' => '',
    'favicon' => '/assets/site/brand/favicon.svg',
    // Restrict/reorder existing pages; this cannot grant publication visibility.
    'page_order' => ['home', 'rooms', 'restaurant', 'menu', 'about', 'gallery', 'announcements', 'reviews', 'contact'],
    'hidden_pages' => [],
    // slot => filename under public/assets/site/scenes/. Empty means zero engine requests.
    'effects' => [],
];
