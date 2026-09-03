import { readdir, readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KIB = 1024;
const DIST_ROOT = fileURLToPath(new URL('../dist/', import.meta.url));
const BUDGETS = {
  maxJavaScriptChunk: 400_000,
  initialJavaScriptGzip: 110 * KIB,
  totalJavaScriptGzip: 200 * KIB,
  initialCssGzip: 24 * KIB,
  favicon: 4 * KIB,
};

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
  }));
  return files.flat();
}

function formatKib(bytes) {
  return `${(bytes / KIB).toFixed(1)} KiB`;
}

function getInitialAssetPaths(html) {
  const tags = html.match(/<(?:script|link)\b[^>]*>/g) ?? [];
  return tags.flatMap((tag) => {
    const assetUrl = tag.match(/\b(?:src|href)="([^"]+)"/)?.[1];
    if (!assetUrl) return [];

    const isEntryScript = tag.startsWith('<script') && assetUrl.endsWith('.js');
    const isModulePreload = /\brel="modulepreload"/.test(tag) && assetUrl.endsWith('.js');
    const isStylesheet = /\brel="stylesheet"/.test(tag) && assetUrl.endsWith('.css');
    return isEntryScript || isModulePreload || isStylesheet
      ? [path.join(DIST_ROOT, assetUrl.replace(/^\/+/, ''))]
      : [];
  });
}

const html = await readFile(path.join(DIST_ROOT, 'index.html'), 'utf8');
const allFiles = await listFiles(path.join(DIST_ROOT, 'assets'));
const javascriptFiles = allFiles.filter((file) => file.endsWith('.js'));
const initialAssets = getInitialAssetPaths(html);
const initialJavaScriptFiles = initialAssets.filter((file) => file.endsWith('.js'));
const initialCssFiles = initialAssets.filter((file) => file.endsWith('.css'));

if (initialJavaScriptFiles.length === 0 || initialCssFiles.length === 0) {
  throw new Error('Unable to locate entry JavaScript and CSS assets in dist/index.html');
}

async function getRawAndGzipSize(file) {
  const content = await readFile(file);
  return { raw: content.byteLength, gzip: gzipSync(content).byteLength };
}

const javascriptSizes = await Promise.all(javascriptFiles.map(async (file) => ({
  file,
  ...await getRawAndGzipSize(file),
})));
const initialJavaScriptSizes = await Promise.all(initialJavaScriptFiles.map(getRawAndGzipSize));
const initialCssSizes = await Promise.all(initialCssFiles.map(getRawAndGzipSize));
const faviconSize = (await stat(path.join(DIST_ROOT, 'favicon.svg'))).size;

const largestJavaScriptChunk = javascriptSizes.reduce((largest, current) => (
  current.raw > largest.raw ? current : largest
));
const initialJavaScriptGzip = initialJavaScriptSizes.reduce((total, size) => total + size.gzip, 0);
const totalJavaScriptGzip = javascriptSizes.reduce((total, size) => total + size.gzip, 0);
const initialCssGzip = initialCssSizes.reduce((total, size) => total + size.gzip, 0);

console.log([
  `Bundle budget: entry JS gzip ${formatKib(initialJavaScriptGzip)}`,
  `all JS gzip ${formatKib(totalJavaScriptGzip)}`,
  `largest chunk ${formatKib(largestJavaScriptChunk.raw)} (${path.basename(largestJavaScriptChunk.file)})`,
  `entry CSS gzip ${formatKib(initialCssGzip)}`,
  `favicon ${formatKib(faviconSize)}`,
].join(' | '));

const violations = [];
if (largestJavaScriptChunk.raw > BUDGETS.maxJavaScriptChunk) {
  violations.push(`largest JavaScript chunk exceeds ${formatKib(BUDGETS.maxJavaScriptChunk)}`);
}
if (initialJavaScriptGzip > BUDGETS.initialJavaScriptGzip) {
  violations.push(`entry JavaScript gzip exceeds ${formatKib(BUDGETS.initialJavaScriptGzip)}`);
}
if (totalJavaScriptGzip > BUDGETS.totalJavaScriptGzip) {
  violations.push(`total JavaScript gzip exceeds ${formatKib(BUDGETS.totalJavaScriptGzip)}`);
}
if (initialCssGzip > BUDGETS.initialCssGzip) {
  violations.push(`entry CSS gzip exceeds ${formatKib(BUDGETS.initialCssGzip)}`);
}
if (faviconSize > BUDGETS.favicon) {
  violations.push(`favicon exceeds ${formatKib(BUDGETS.favicon)}`);
}

if (violations.length > 0) {
  for (const violation of violations) {
    console.error(`Bundle budget failed: ${violation}`);
  }
  process.exitCode = 1;
}
