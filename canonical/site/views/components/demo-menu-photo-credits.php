<?php declare(strict_types=1); namespace YaSite;
if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) { http_response_code(404); exit; }
// Demo-specific, credited Commons menu photos; product publication remains app-owned.
// Credits are in the collapsed footer even when the corresponding products have not yet been republished.
$menuPhotoCredits = [
  ['name' => 'Serpme Kahvaltı', 'author' => 'Glassmug29', 'source' => 'https://commons.wikimedia.org/wiki/File:Turkish_Breakfast_Spread.jpg', 'license' => 'CC BY-SA 4.0', 'licenseUrl' => 'https://creativecommons.org/licenses/by-sa/4.0/'],
  ['name' => 'Kaşarlı Menemen', 'author' => 'FakirNL', 'source' => 'https://commons.wikimedia.org/wiki/File:Menemen_with_bread.jpg', 'license' => 'CC BY-SA 4.0', 'licenseUrl' => 'https://creativecommons.org/licenses/by-sa/4.0/'],
  ['name' => 'Çoban Salata', 'author' => 'E4024', 'source' => 'https://commons.wikimedia.org/wiki/File:Choban_salata.jpg', 'license' => 'CC BY-SA 3.0', 'licenseUrl' => 'https://creativecommons.org/licenses/by-sa/3.0/'],
  ['name' => 'Zeytinyağlı Yaprak Sarma', 'author' => 'Garrett Ziegler', 'source' => 'https://commons.wikimedia.org/wiki/File:Vi%C5%9Fneli_Yaprak_Sarma.jpg', 'license' => 'CC BY-SA 4.0', 'licenseUrl' => 'https://creativecommons.org/licenses/by-sa/4.0/'],
  ['name' => 'Izgara Levrek', 'author' => 'E4024', 'source' => 'https://commons.wikimedia.org/wiki/File:Sea_bass_as_food.jpg', 'license' => 'CC BY-SA 4.0', 'licenseUrl' => 'https://creativecommons.org/licenses/by-sa/4.0/'],
  ['name' => 'Tavuk Şiş', 'author' => 'E4024', 'source' => 'https://commons.wikimedia.org/wiki/File:Tavuk_shish.jpg', 'license' => 'CC BY-SA 4.0', 'licenseUrl' => 'https://creativecommons.org/licenses/by-sa/4.0/'],
  ['name' => 'Fırın Mantı', 'author' => 'E4024', 'source' => 'https://commons.wikimedia.org/wiki/File:Manti_manti.jpg', 'license' => 'CC BY-SA 4.0', 'licenseUrl' => 'https://creativecommons.org/licenses/by-sa/4.0/'],
  ['name' => 'Fırın Sütlaç', 'author' => 'E4024', 'source' => 'https://commons.wikimedia.org/wiki/File:F%C4%B1r%C4%B1n_s%C3%BCtla%C3%A7.jpg', 'license' => 'CC BY-SA 4.0', 'licenseUrl' => 'https://creativecommons.org/licenses/by-sa/4.0/'],
  ['name' => 'Ev Yapımı Kek', 'author' => 'PxHere', 'source' => 'https://commons.wikimedia.org/wiki/File:Cake_plum_cake_streusel_cake_bake_homemade_tradition_plums_coffee-549588.jpg', 'license' => 'CC0', 'licenseUrl' => 'https://creativecommons.org/publicdomain/zero/1.0/'],
  ['name' => 'Ayran', 'author' => 'Hamdigumus', 'source' => 'https://commons.wikimedia.org/wiki/File:Naneli_ayran_-_Dara.jpg', 'license' => 'CC0', 'licenseUrl' => 'https://creativecommons.org/publicdomain/zero/1.0/'],
  ['name' => 'Ev Limonatası', 'author' => 'Sam Howzit', 'source' => 'https://commons.wikimedia.org/wiki/File:Lemonade.jpg', 'license' => 'CC BY 2.0', 'licenseUrl' => 'https://creativecommons.org/licenses/by/2.0/'],
  ['name' => 'Türk Kahvesi', 'author' => 'Noumenon', 'source' => 'https://commons.wikimedia.org/wiki/File:TurkishCoffee.jpg', 'license' => 'Public domain', 'licenseUrl' => 'https://creativecommons.org/publicdomain/mark/1.0/'],
  ['name' => 'Kaşarlı Tost', 'author' => 'Quickspicerecipes', 'source' => 'https://commons.wikimedia.org/wiki/File:Grilled_Cheese_Sandwich.jpg', 'license' => 'CC BY-SA 4.0', 'licenseUrl' => 'https://creativecommons.org/licenses/by-sa/4.0/'],
  ['name' => 'Mevsim Meyvesi', 'author' => 'Barkathnisa Ashaqilahi', 'source' => 'https://commons.wikimedia.org/wiki/File:Fruit_Salad_Bowl.jpg', 'license' => 'CC0', 'licenseUrl' => 'https://creativecommons.org/publicdomain/zero/1.0/'],
];
?>
<section class="demo-menu-photo-credits" aria-label="<?= e(t($site, 'page.menu')) ?>">
<h3><?= e(t($site, 'page.menu')) ?> · <?= e(t($site, 'theme.gundogdu.photo.credits')) ?></h3>
<ul>
<?php foreach ($menuPhotoCredits as $item): ?>
  <li><a href="<?= e($item['source']) ?>" target="_blank" rel="noopener noreferrer"><?= e($item['name']) ?></a> · <?= e($item['author']) ?> · <a href="<?= e($item['licenseUrl']) ?>" target="_blank" rel="noopener noreferrer"><?= e($item['license']) ?></a></li>
<?php endforeach; ?>
</ul>
</section>
