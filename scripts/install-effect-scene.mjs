import {readFile,stat,mkdir,open,rename,unlink} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {importProject,exportProject,MAX_FILE_BYTES} from '../assets/effect-engine/src/model/project.mjs';
import {compileScene} from '../assets/effect-engine/src/runtime/index.mjs';
const args=process.argv.slice(2);
try {
  if(args.length<1||args.length>2||args[0].startsWith('--')||(args[1]&&args[1]!=='--check-only')) throw new Error('Usage: bash scripts/install-effect-scene.sh filename [--check-only]');
  const input=resolve(args[0]);
  if((await stat(input)).size>MAX_FILE_BYTES) throw new Error('Scene exceeds 25 MB');
  const project=importProject(await readFile(input,'utf8'));
  if(project.photo.width!==1818||project.photo.height!==1228) throw new Error('Expected photo dimensions 1818x1228');
  compileScene(project);
  if(args[1]==='--check-only') {console.log('effect-scene-valid: 1818x1228; no changes');}
  else {
    const target=fileURLToPath(new URL('../assets/effects/hero.scene.json',import.meta.url));
    await mkdir(dirname(target),{recursive:true});
    const temp=target+'.'+randomUUID()+'.tmp';
    try {
      const handle=await open(temp,'wx',0o644);
      try {await handle.chmod(0o644);await handle.writeFile(exportProject(project));await handle.sync();} finally {await handle.close();}
      await rename(temp,target);
    } finally {await unlink(temp).catch(e=>{if(e.code!=='ENOENT')throw e;});}
    console.log('effect-scene-installed: assets/effects/hero.scene.json');
  }
} catch(error) {console.error(error.message);process.exitCode=1;}
