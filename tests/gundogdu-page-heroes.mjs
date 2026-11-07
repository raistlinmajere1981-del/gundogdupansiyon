import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join,resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const view=readFileSync(join(root,'canonical/site/views/components/page-hero.php'),'utf8');
const home=readFileSync(join(root,'canonical/site/views/pages/home.php'),'utf8');
const main=readFileSync(join(root,'canonical/site/views/layout.php'),'utf8');
const css=readFileSync(join(root,'canonical/public/assets/site/theme.css'),'utf8');
const credits=readFileSync(join(root,'canonical/site/views/components/page-hero-credits.php'),'utf8');
const names={
  rooms:'gideros-2-1275.webp',
  restaurant:'hero-restaurant.webp',
  menu:'hero-menu.webp',
  about:'hero-about-cide-landscape.webp',
  gallery:'hero-gallery.webp',
  announcements:'hero-announcements.webp',
  reviews:'hero-reviews.webp',
  contact:'hero-contact.webp',
};
test('every interior page owns one unique hard-coded hero photo',()=>{
  assert.ok(main.includes("render_view('components/page-hero'"));
  assert.equal((view.match(/data-gd-page-hero=/g)||[]).length,8);
  const digests=new Set();
  for(const [page,file] of Object.entries(names)){
    assert.ok(view.includes("($page === '"+page+"')"),page);
    assert.ok(view.includes('data-gd-page-hero="'+page+'"'),page);
    assert.ok(view.includes("site/img/"+file),page);
    const p=join(root,'canonical/public/assets/site/img',file);
    const mirror=join(root,'assets/site/img',file);
    assert.ok(statSync(p).size>9000,'invalid media: '+file);
    const digest=data=>createHash('sha256').update(data).digest('hex');
    const source=readFileSync(p);
    assert.equal(digest(source),digest(readFileSync(mirror)),'mirror: '+file);
    assert.ok(!digests.has(digest(source)),'duplicate source: '+file);
    digests.add(digest(source));
  }
  assert.ok(!home.includes("site/img/gideros-2-1275.webp"),'Bay2 no longer duplicated on home');
});
test('photo credits and overlay remain compact and accessible',()=>{
  assert.ok(css.includes('rgba(14,37,34,.64)'),'home overlay too dark');
  assert.ok(main.includes("'?v=12'"),'hero style cache version did not increase');
  assert.ok(view.includes('aria-hidden="true"'),'page hero must not duplicate H1');
  assert.ok(css.includes('object-fit:contain'),'hero photo should display fully rather than crop');
  assert.ok(css.includes('background-image:var(--gd-hero-source)'),'missing blurred photo continuation');
  assert.ok(view.includes('--gd-hero-source:url('),'hero background does not use the same source');
  assert.ok(!view.includes('hero-about.webp'),'old inaccurate road sign must not be referenced');
  assert.ok(credits.includes("author' => 'Erhan3437'"),'new landscape attribution absent');
  assert.ok(credits.includes("foreach ($photos as $photo)"));
  assert.equal((credits.match(/'page' => '/g)||[]).length,7);
  assert.ok(readFileSync(join(root,'canonical/site/views/components/footer.php'),'utf8').includes("render_view('components/page-hero-credits'"));
});
