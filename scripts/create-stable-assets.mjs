import { copyFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const assetsDir = path.resolve('dist/assets');
const files = await readdir(assetsDir);
const jsSource = files.find((file) => file.startsWith('app-') && file.endsWith('.js'))
  ?? files.find((file) => file.endsWith('.js'));
const cssSource = files.find((file) => file.endsWith('.css'));

if (!jsSource) throw new Error('Could not find built JavaScript entry asset.');
if (!cssSource) throw new Error('Could not find built CSS asset.');

// The Pages bootstrap always requests these stable, cache-busted aliases.
await Promise.all([
  copyFile(path.join(assetsDir, jsSource), path.join(assetsDir, 'app.js')),
  copyFile(path.join(assetsDir, cssSource), path.join(assetsDir, 'style.css')),
]);

console.log(`Stable assets created from ${jsSource} and ${cssSource}.`);
