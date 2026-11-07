// Explicit local staging only: no source writes, network, symlinks or API files.
import {cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {inventory} from '../canonical/tools/manifest.mjs';
import {hash, noLinks, tree} from './lib/files.mjs';
import {syncAssets, namespaces} from './sync-public-assets.mjs';
import {releaseTarget, retirementPreview, regular} from '../../YardimciAsistan/scripts/lib/site-release-policy.mjs';
export const routes = ['odalar','odalar/oda','restoran','restoran/masa','qr-menu','hakkimizda','iletisim','galeri','duyurular','yorumlar'];
export function packageFiles(repo) {
  const manifest=JSON.parse(readFileSync(join(repo,'canonical/template-manifest.json')));
  releaseTarget(join(repo,'canonical'));
  if (JSON.stringify(inventory(join(repo,'canonical')))!==JSON.stringify(manifest.common)) throw new Error('Canonical release mismatch');
  syncAssets(repo);
  const files=['index.php','.htaccess',...routes.map(name=>name+'/index.php'),'canonical/template-manifest.json','canonical/locales/tr.json','retired-paths.json'];
  for (const path of Object.keys(manifest.common)) files.push('canonical/'+path);
  for (const path of Object.keys(tree(join(repo,'canonical/site')))) {
    if (['router.php','SOURCES.md','asset-provenance.json','views/.gitkeep'].includes(path) || path.startsWith('tests/') || path.startsWith('preserved-effects/')) continue;
    if (!['config.php','.htaccess','README.md','views/.gitkeep'].includes(path) && !/^views\/(?:[a-z-]+\/)*[a-z-]+\.php$/.test(path)) throw new Error('Unknown site file: '+path);
    files.push('canonical/site/'+path);
  }
  for (const path of Object.keys(tree(join(repo,'canonical/public/assets/site')))) {
    if (!/^(?:theme\.(?:css|mjs)|media-viewer\.mjs|menu-workspace\.js|(?:media|scenes)\/\.gitkeep|(?:brand|fonts|img)\/[A-Za-z0-9_-][A-Za-z0-9_.-]*\.(?:svg|png|jpe?g|webp|avif|ico|woff2?|ttf|txt)|scenes\/(?:effects-manifest\.json|[A-Za-z0-9_-][A-Za-z0-9_.-]*\.scene\.json))$/.test(path)
      || /(?:\.local\.|(?:^|\/)(?:secret|credential))/i.test(path)) throw new Error('Unknown site asset: '+path);
    files.push('canonical/public/assets/site/'+path);
  }
  for (const name of namespaces) for(const path of Object.keys(tree(join(repo,'assets',name)))) files.push('assets/'+name+'/'+path);
  const sorted=[...new Set(files)].sort();
  for (const path of sorted) {regular(join(repo,path==='retired-paths.json'?'scripts/'+path:path)); if (/(?:^|\/)(?:yardimci-asistan|data|config|storage|keys)(?:\/|$)|\.(?:sqlite|db|pem|key|env)$/.test(path)) throw new Error('Private package path: '+path);}
  if (!readFileSync(join(repo,'index.php'),'utf8').includes('gundogdu-site') || !readFileSync(join(repo,'.htaccess'),'utf8').startsWith('# gundogdu-site')) throw new Error('Unknown root identity');
  if (!readFileSync(join(repo,'index.php'),'utf8').includes("require $templateRoot . '/public/index.php'")) throw new Error('Inactive root adapter');
  retirementPreview(repo,'gundogdu-site',sorted);
  return sorted;
}
export function stagePackage(repo) {
  const files=packageFiles(repo), parent=join(repo,'.test-artifacts'); noLinks(parent); mkdirSync(parent,{recursive:true});
  const stage=mkdtempSync(join(parent,'site-package-'));
  const hashes={};
  for (const path of files) {const target=join(stage,path); mkdirSync(resolve(target,'..'),{recursive:true}); const source=join(repo,path==='retired-paths.json'?'scripts/'+path:path); cpSync(source,target); hashes[path]=hash(target); if(hashes[path]!==hash(source)) throw new Error('Package changed during staging');}
  const receipt={format:1,identity:'gundogdu-site',origin:'https://yardimciasistangunduodu.alwaysdata.net',module_url:'https://yardimciasistangunduodu.alwaysdata.net/yardimci-asistan',...releaseTarget(join(repo,'canonical')),retirement_mode:'pre-retired-hash-verified',retired_paths_sha256:hash(join(stage,'retired-paths.json')),files:hashes};
  writeFileSync(join(stage,'gundogdu-release.json'),JSON.stringify(receipt,null,2)+'\n');
  writeFileSync(join(stage,'SHA256SUMS'),Object.entries({...hashes,'gundogdu-release.json':hash(join(stage,'gundogdu-release.json'))}).map(([path,sha])=>sha+'  '+path+'\n').join(''));
  return stage;
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
  const repo=fileURLToPath(new URL('../',import.meta.url));
  if(process.argv.length!==3 || !['--check','--stage'].includes(process.argv[2])) throw new Error('Usage: node scripts/package-site.mjs --check|--stage');
  console.log(process.argv[2]==='--stage'?stagePackage(repo):'site-package-check-ok: '+packageFiles(repo).length+' files');
}
