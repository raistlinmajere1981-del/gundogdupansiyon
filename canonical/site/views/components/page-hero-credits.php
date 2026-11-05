<?php declare(strict_types=1); namespace YaSite;
if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) { http_response_code(404); exit; }
$photos = [
  ['page' => 'restaurant', 'title' => 'Cide gideros.jpg', 'author' => 'Crebain', 'license' => '3.0', 'date' => '2006', 'source' => 'https://commons.wikimedia.org/wiki/File:Cide_gideros.jpg'],
  ['page' => 'menu', 'title' => 'Cide Limanı 2014-04-18 18-47.jpg', 'author' => 'Cide67', 'license' => '3.0', 'date' => '2014', 'source' => 'https://commons.wikimedia.org/wiki/File:Cide_Liman%C4%B1_2014-04-18_18-47.jpg'],
  ['page' => 'about', 'title' => 'Küre Dağları Milli Parkı · Çukurçal Köyü, Cide', 'author' => 'Erhan3437', 'license' => '4.0', 'date' => '2019', 'source' => 'https://commons.wikimedia.org/wiki/File:K%C3%BCre_Da%C4%9Flar%C4%B1_Milli_Park%C4%B1_%C3%87ukur%C3%A7al_K%C3%B6y%C3%BC_Cide_Kastamonu.jpg'],
  ['page' => 'gallery', 'title' => 'Cide Ovası 10 09 1984 Küstenebene von Cide.jpg', 'author' => 'Volker Höhfeld', 'license' => '4.0', 'date' => '1984', 'source' => 'https://commons.wikimedia.org/wiki/File:Cide_Ovas%C4%B1_10_09_1984_K%C3%BCstenebene_von_Cide.jpg'],
  ['page' => 'announcements', 'title' => 'Cide sahili.jpg', 'author' => 'Crebain', 'license' => '3.0', 'date' => '2006', 'source' => 'https://commons.wikimedia.org/wiki/File:Cide_sahili.jpg'],
  ['page' => 'reviews', 'title' => 'Çayüstü köyü.jpg', 'author' => 'styletech', 'license' => '3.0', 'date' => '2009', 'source' => 'https://commons.wikimedia.org/wiki/File:%C3%87ay%C3%BCst%C3%BC_k%C3%B6y%C3%BC.jpg'],
  ['page' => 'contact', 'title' => 'Eski cide evleri.jpg', 'author' => 'Crebain', 'license' => '3.0', 'date' => '2006', 'source' => 'https://commons.wikimedia.org/wiki/File:Eski_cide_evleri.jpg'],
]; ?>
<section class="gd-page-hero-credits">
  <ul>
  <?php foreach ($photos as $photo): ?>
    <li><strong><?= e(t($site, 'page.' . $photo['page'])) ?></strong> · <?= e($photo['title']) ?> (<?= e($photo['date']) ?>) · <?= e($photo['author']) ?> · <a href="<?= e($photo['source']) ?>" target="_blank" rel="noopener noreferrer">Wikimedia Commons</a> · <a href="https://creativecommons.org/licenses/by-sa/<?= e($photo['license']) ?>/" target="_blank" rel="noopener noreferrer">CC BY-SA <?= e($photo['license']) ?></a></li>
  <?php endforeach; ?>
  </ul>
</section>
