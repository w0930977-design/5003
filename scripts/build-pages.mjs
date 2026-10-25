import { mkdir, copyFile, writeFile } from 'node:fs/promises';

const destination = new URL('../docs/', import.meta.url);
await mkdir(destination, { recursive: true });
await copyFile(
  new URL('../dist/offer-diary.html', import.meta.url),
  new URL('index.html', destination),
);
await writeFile(new URL('.nojekyll', destination), '');
console.log(
  'GitHub Pages site prepared in docs/. Publish main /docs through repository Pages settings.',
);
