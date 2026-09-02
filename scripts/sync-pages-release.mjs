import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const sourceDirectory = path.resolve('dist/assets');
const targetDirectory = path.resolve('assets');

await mkdir(targetDirectory, { recursive: true });
await Promise.all([
  copyFile(path.join(sourceDirectory, 'app.js'), path.join(targetDirectory, 'app.js')),
  copyFile(path.join(sourceDirectory, 'style.css'), path.join(targetDirectory, 'style.css')),
]);

console.log('GitHub Pages release aliases synchronized to the repository root.');
