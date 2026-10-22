// Only disposable test copies. Never reads or edits a customer's runtime/config.
import { cpSync, mkdirSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
export const backendRoot = resolve(process.env.YARDIMCI_ASISTAN_REPO || new URL('../../YardimciAsistan', import.meta.url).pathname);
export function installLocalApi(target) {
  if (existsSync(target) && readdirSync(target).length) throw new Error('Fixture target must be empty');
  const source = join(backendRoot, 'firm-template/web-module');
  for (const dir of ['api', 'lib']) cpSync(join(source, dir), join(target, dir), {recursive:true});
  for (const dir of ['config','data','media','knowledge']) mkdirSync(join(target, dir), {recursive:true});
  writeFileSync(join(target, '.gundogdu-test-api'), 'Disposable fixture only\n');
  writeFileSync(join(target, 'config/business.json'), JSON.stringify({id:'gundogdu-local-test',display_name:'YEREL TEST İşletmesi',profile_id:'pension_restaurant',allowed_origins:[]}));
  writeFileSync(join(target, 'config/ai.php'), "<?php return ['enabled'=>false,'provider'=>'disabled'];\n");
  cpSync(join(source, 'config/version.json'), join(target, 'config/version.json'));
  return target;
}
export function publish(target, name, payload) {
  if (!existsSync(join(target, '.gundogdu-test-api'))) throw new Error('Not an isolated fixture');
  const code = 'require $argv[1]; $json=stream_get_contents(STDIN); $p=json_decode($json,true,512,JSON_THROW_ON_ERROR); try {ya_storage_activate_source("gundogdu-test",0,"test-activate");} catch (YaStorageConflictException $e) {} $old=ya_storage_get_publication($argv[2],[]); $rev=(int)($old["_publication"]["source_revision"]??0)+1; ya_storage_publish($argv[2],$p,"gundogdu-test",$rev,$argv[2].":".$rev,date(DATE_ATOM),1,hash("sha256",$json));';
  const result = spawnSync('php',['-r',code,join(target,'lib/storage.php'),name],{input:JSON.stringify(payload),encoding:'utf8'});
  if (result.status !== 0) throw new Error(result.stderr || 'Publication failed');
}
