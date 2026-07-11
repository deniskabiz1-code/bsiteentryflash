import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const buildId = process.argv[2] || process.env.GITHUB_SHA || String(Date.now());
const shortId = buildId.slice(0, 8);

const indexPath = path.join(distDir, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

html = html.replace(
  /(href|src)="([^"]*\/assets\/[^"?]+)"/g,
  (_, attr, url) => `${attr}="${url}?v=${shortId}"`
);

const inject = [
  '<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />',
  `<meta name="build" content="${buildId}" />`,
  '<script>',
  `window.__PF_BUILD__='${buildId}';`,
  'try {',
  `  var prev = localStorage.getItem('pf_build');`,
  `  localStorage.setItem('pf_build', '${buildId}');`,
  `  if (prev && prev !== '${buildId}') location.reload();`,
  '} catch (e) {}',
  '</script>',
].join('');

html = html.replace('</head>', `${inject}</head>`);

fs.writeFileSync(indexPath, html);
fs.copyFileSync(indexPath, path.join(distDir, '404.html'));
fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
console.log(`Injected build ${shortId} into index.html`);