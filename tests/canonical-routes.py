"""Actual physical entries and common redirects; no HTTP socket or live API."""
import json
import subprocess
from urllib.parse import urlparse, parse_qs


def probe(path, query='', method='GET'):
    result = subprocess.run(['php', 'tests/fixtures/alias-entry.php', path, query, method],
                            check=True, capture_output=True, text=True)
    return json.loads(result.stdout)


for path, page in [('odalar', 'rooms'), ('odalar/oda', 'rooms'), ('restoran', 'restaurant'),
                   ('restoran/masa', 'restaurant'), ('qr-menu', 'menu'), ('hakkimizda', 'about'),
                   ('iletisim', 'contact'), ('galeri', 'gallery'), ('duyurular', 'announcements'),
                   ('yorumlar', 'reviews')]:
    reply = probe('/' + path + '/', 'lang=en&id=TEST-id&category=TEST-cat&page=home')
    assert reply['status'] == 302 and reply['body'] == '', path
    locations = [header[10:] for header in reply['headers'] if header.startswith('Location: ')]
    assert len(locations) == 1, path
    target = urlparse(locations[0])
    assert target.path == '/' and not target.netloc, path
    params = parse_qs(target.query)
    assert params['page'] == [page] and params['lang'] == ['en'], path
    assert params.get('id') == (['TEST-id'] if '/' in path else None), path
    assert params.get('category') == (['TEST-cat'] if page == 'menu' else None), path
    assert any(file.endswith('/canonical/public/index.php') for file in reply['included'])
    assert not any(file.endswith('/inc/site.php') for file in reply['included'])

qr_token = 'ABCDEFGHIJKLMNOPQRSTUVWX'
qr = probe('/qr-menu/', 'lang=tr&table=' + qr_token + '&category=TEST-cat')
assert qr['status'] == 302
qr_location = [header[10:] for header in qr['headers'] if header.startswith('Location: ')][0]
qr_params = parse_qs(urlparse(qr_location).query)
assert qr_params['page'] == ['menu'] and qr_params['table'] == [qr_token]

for query in ['id[]=bad', 'id=%0Ainjection', 'id=' + 'x' * 2049, 'redirect=https://fixture.test']:
    reply = probe('/odalar/', query)
    assert reply['status'] == 400 and reply['body'] == '' and reply['headers'] == []

reply = probe('/', 'resource=translation-source')
source = json.loads(reply['body'])
assert reply['status'] == 200 and source['id'] == 'gundogdu-site' and source['source_language'] == 'tr'
assert len(source['entries']) <= 2048 and len(reply['body'].encode()) <= 512 * 1024
assert not any(file.endswith(('/canonical/core/bootstrap.php', '/canonical/core/api.php'))
               for file in reply['included'])
reply = probe('/', 'resource=translation-source', 'POST')
assert reply['status'] == 405 and reply['body'] == ''
print('canonical-routes-ok: 10 real wrappers, safe queries, root source GET/POST, no business boot')
