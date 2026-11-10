#!/usr/bin/env bash
set -euo pipefail
site_root="$(cd -- "$(dirname -- "$0")/.." && pwd)"
studio_root="${EFFECT_STUDIO_ROOT:-$site_root/../../ChannelFoundry/packages/effect-engine}"
node --input-type=module - "$studio_root" <<'NODE'
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const {ENGINE_VERSION}=await import(pathToFileURL(resolve(process.argv[2],'src/runtime/index.mjs')));
if(ENGINE_VERSION!=='1.1.0') throw new Error('Expected Studio engine 1.1.0');
NODE
for part in runtime registry model; do test -d "$studio_root/src/$part"; done
mkdir -p "$site_root/assets/effect-engine"
stage="$(mktemp -d "$site_root/assets/effect-engine/.sync.XXXXXX")"
trap 'rm -rf -- "$stage"' EXIT
for part in runtime registry model; do cp -R "$studio_root/src/$part" "$stage/$part"; done
rm -rf -- "$site_root/assets/effect-engine/src"
mv -- "$stage" "$site_root/assets/effect-engine/src"
printf '1.1.0\n' > "$site_root/assets/effect-engine/VERSION"
find "$site_root/assets/effect-engine" -type d -exec chmod 755 {} +
find "$site_root/assets/effect-engine" -type f -exec chmod 644 {} +
echo 'effect-engine-sync-ok: 1.1.0'
