import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Embed the production build so the app also runs directly from a local HTML file.
const root = fileURLToPath(new URL('../dist/', import.meta.url));
let html = await readFile(path.join(root, 'index.html'), 'utf8');
const script = html.match(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/);
const style = html.match(
  /<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/,
);
if (!script || !style)
  throw new Error('Expected the Vite production script and stylesheet.');

function assetPath(url) {
  const resolved = path.resolve(root, url.replace(/^\//, ''));
  if (!resolved.startsWith(root))
    throw new Error('Asset escapes the build directory.');
  return resolved;
}

const [javascript, css, favicon] = await Promise.all([
  readFile(assetPath(script[1]), 'utf8'),
  readFile(assetPath(style[1]), 'utf8'),
  readFile(path.join(root, 'favicon.svg')),
]);
html = html
  .replace(
    script[0],
    () =>
      `<script type="module">${javascript.replace(/<\/script/gi, '<\\/script')}</script>`,
  )
  .replace(style[0], () => `<style>${css}</style>`)
  .replace(
    'href="/favicon.svg"',
    `href="data:image/svg+xml;base64,${favicon.toString('base64')}"`,
  );
const output = path.join(root, 'offer-diary.html');
await writeFile(output, html);
console.log(`Offline application saved: ${output}`);
