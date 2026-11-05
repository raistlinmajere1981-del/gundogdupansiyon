<?php declare(strict_types=1); namespace YaSite;
if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) { http_response_code(404); exit; }
$eyebrow = text($view['eyebrow'] ?? '');
$lede = text($view['lede'] ?? '');
$heading = text($view['title'] ?? '');
$fold = static fn (string $value): string => function_exists('mb_strtolower') ? mb_strtolower($value, 'UTF-8') : strtolower($value);
if ($fold($eyebrow) === $fold($heading)) $eyebrow = '';
?>
<header class="page-header">
  <?php if ($eyebrow !== ''): ?><p class="eyebrow"><?= e($eyebrow) ?></p><?php endif; ?>
  <h1><?= e($view['title'] ?? '') ?></h1>
  <?php if ($lede !== ''): ?><p class="lede"><?= e($lede) ?></p><?php endif; ?>
</header>
