import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createServer} from 'node:net';
import {spawn} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const site = resolve(new URL('..', import.meta.url).pathname);
const freePort = () => new Promise(resolvePort => {
  const server = createServer();
  server.listen(0, '127.0.0.1', () => { const port = server.address().port; server.close(() => resolvePort(port)); });
});
const port = await freePort();
const child = spawn('php', ['-d', 'opcache.enable_cli=0', '-S', '127.0.0.1:' + port, '-t', site], {stdio: ['ignore', 'ignore', 'pipe']});
let log = '';
child.stderr.on('data', chunk => { log += chunk; });
const origin = 'http://127.0.0.1:' + port;
const catalog = () => fetch(origin + '/?resource=translation-source', {headers: {Accept: 'application/json'}});
const sha256 = value => createHash('sha256').update(value).digest('hex');
try {
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(origin + '/robots.txt')).ok) break; } catch {}
    await new Promise(resolveWait => setTimeout(resolveWait, 100));
  }
  const response = await catalog();
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') || '', /^application\/json\b/i);
  const value = await response.json();
  assert.equal(value.version, 1);
  assert.equal(value.id, 'gundogdu-site');
  assert.equal(value.source_language, 'tr');
  assert.match(value.revision, /^[a-f0-9]{64}$/);
  assert(value.entries && typeof value.entries === 'object' && !Array.isArray(value.entries));
  const entries = Object.entries(value.entries);
  assert(entries.length >= 634 && entries.length <= 2048, 'catalog must cover the current Turkish UI source');
  for (const [key, entry] of entries) {
    assert.match(key, /^[a-zA-Z0-9_.-]{1,120}$/);
    assert(entry && typeof entry.text === 'string' && entry.text.trim());
    assert(!/[<>\u0000-\u0008]/u.test(entry.text));
    assert.equal(entry.hash, sha256(entry.text), 'entry hash must be sha256(text)');
  }
  const revision = sha256(entries.sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    .map(([key, entry]) => `${key}:${entry.hash}\n`).join(''));
  assert.equal(value.revision, revision, 'revision must hash sorted key:hash lines');
  const source = JSON.parse(readFileSync(resolve(site, 'assets/i18n/tr.json'), 'utf8'));
  assert.equal(source.id, value.id);
  assert.deepEqual(Object.keys(source.entries).sort(), Object.keys(value.entries).sort());
  const rejected = await fetch(origin + '/?resource=translation-source', {method: 'POST'});
  assert.equal(rejected.status, 405);
  assert.equal(rejected.headers.get('allow'), 'GET');
  assert.match(rejected.headers.get('content-type') || '', /^application\/json\b/i);
  assert(!/PHP (?:Warning|Fatal|Parse error)/.test(log));
  console.log('gundogdu-source-catalog-ok: ' + entries.length + ' entries, revision ' + value.revision.slice(0, 12));
} finally {
  child.kill('SIGTERM');
}
