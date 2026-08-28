import { copyFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const assetsDir = path.resolve('dist/assets');
const files = await readdir(assetsDir);
const jsSource = files.find((file) => file.startsWith('app-') && file.endsWith('.js'))
  ?? files.find((file) => file.endsWith('.js'));
const cssSource = files.find((file) => file.endsWith('.css'));

if (!jsSource) throw new Error('Could not find built JavaScript entry asset.');
if (!cssSource) throw new Error('Could not find built CSS asset.');

// Keep stable aliases so a browser with older cached HTML can still resolve its bundle,
// while the current HTML points to content-hashed filenames and therefore cannot reuse stale JS/CSS.
const compatibilityJs = [
  'app.js',
  'index-Nx9jfuwX.js',
  'index-CETiqWCh.js',
  'index-iJ6mm8Yt.js',
  'index-D75HfHi4.js',
  'index-Cd1A84mq.js',
  'index--fZUKCkF.js',
  'index-CKdeO6Dj.js',
];

const compatibilityCss = [
  'style.css',
  'index-BSppxZMy.css',
  'index-DfsQZLkw.css',
  'index-cu0FI-cg.css',
  'index-B3nn20Zt.css',
  'index-B0BxfB-i.css',
  'index-DxEJ-KV5.css',
];

await Promise.all([
  ...compatibilityJs
    .filter((name) => name !== jsSource)
    .map((name) => copyFile(path.join(assetsDir, jsSource), path.join(assetsDir, name))),
  ...compatibilityCss
    .filter((name) => name !== cssSource)
    .map((name) => copyFile(path.join(assetsDir, cssSource), path.join(assetsDir, name))),
]);

console.log(`Compatibility assets created from ${jsSource} and ${cssSource}.`);
