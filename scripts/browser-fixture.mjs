// Self-contained fixtures: no sibling repository, private database or secrets.
import {cpSync, mkdirSync, writeFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';
export function installLocalApi(target) {
  mkdirSync(join(target, 'api'), {recursive: true});
  mkdirSync(join(target, 'publications'));
  writeFileSync(join(target, '.gundogdu-test-api'), 'Disposable HTTP fixture\n');
  cpSync(new URL('./fixtures/public-api.php', import.meta.url), join(target, 'fixture.php'));
  for (const name of ['business','rooms','tables','menu','marketing','availability','request']) writeFileSync(join(target, 'api', name + '.php'), "<?php require dirname(__DIR__).'/fixture.php';\n");
  return target;
}
export function publish(target, name, payload) {
  if (!existsSync(join(target, '.gundogdu-test-api')) || !/^[a-z_]+$/.test(name)) throw new Error('Not an isolated fixture');
  writeFileSync(join(target, 'publications', name + '.json'), JSON.stringify(payload));
}
