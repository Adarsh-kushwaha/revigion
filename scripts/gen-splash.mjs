/**
 * Generates apple-touch-startup-image PNGs for iOS PWA launch.
 * Uses sharp (already a transitive Next.js dep) to render an SVG per device size.
 *
 * Output: public/splash/<slug>-{portrait,landscape}.png
 * The console at the end prints a ready-to-paste startupImage array for app/layout.tsx.
 */
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdir } from 'fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'splash');

const BG = '#FFEF9D';
const FG = '#111110';
const NAME = 'Revigion';
const TAGLINE = 'Spaced-repetition revision tracker';

// CSS logical dimensions + device-pixel-ratio. Physical PNG = css * dpr.
const devices = [
  { slug: 'iphone-16-pro-max',           cssW: 440,  cssH: 956,  dpr: 3 },
  { slug: 'iphone-16-pro',               cssW: 402,  cssH: 874,  dpr: 3 },
  { slug: 'iphone-16-plus-15-pro-max',   cssW: 430,  cssH: 932,  dpr: 3 },
  { slug: 'iphone-16-15-15pro',          cssW: 393,  cssH: 852,  dpr: 3 },
  { slug: 'iphone-14-plus-14-pro-max',   cssW: 428,  cssH: 926,  dpr: 3 },
  { slug: 'iphone-14-13-12',             cssW: 390,  cssH: 844,  dpr: 3 },
  { slug: 'iphone-11-pro-max-xs-max',    cssW: 414,  cssH: 896,  dpr: 3 },
  { slug: 'iphone-11-pro-xs-x',          cssW: 375,  cssH: 812,  dpr: 3 },
  { slug: 'iphone-11-xr',                cssW: 414,  cssH: 896,  dpr: 2 },
  { slug: 'iphone-8-plus',               cssW: 414,  cssH: 736,  dpr: 3 },
  { slug: 'iphone-8-se',                 cssW: 375,  cssH: 667,  dpr: 2 },
  { slug: 'ipad-pro-12-9',               cssW: 1024, cssH: 1366, dpr: 2 },
  { slug: 'ipad-pro-11',                 cssW: 834,  cssH: 1194, dpr: 2 },
  { slug: 'ipad-air-10-9',               cssW: 820,  cssH: 1180, dpr: 2 },
  { slug: 'ipad-10-2',                   cssW: 810,  cssH: 1080, dpr: 2 },
  { slug: 'ipad-mini',                   cssW: 744,  cssH: 1133, dpr: 2 },
];

function buildSvg(w, h) {
  const min = Math.min(w, h);
  const logoSize = Math.round(min * 0.18);
  const logoRadius = Math.round(logoSize * 0.21);
  const logoLetter = Math.round(logoSize * 0.68);
  const nameSize = Math.round(min * 0.055);
  const taglineSize = Math.round(min * 0.026);
  const gap = Math.round(min * 0.04);

  const cx = w / 2;
  const cy = h / 2;
  const logoX = cx - logoSize / 2;
  const logoY = cy - logoSize - gap - nameSize / 2;
  const nameY = cy + gap;
  const taglineY = nameY + nameSize * 0.9 + gap * 0.7;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${BG}"/>
  <rect x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" rx="${logoRadius}" ry="${logoRadius}" fill="${FG}"/>
  <text x="${cx}" y="${logoY + logoSize / 2}" font-family="ui-monospace, Menlo, monospace" font-weight="700" font-size="${logoLetter}" fill="${BG}" text-anchor="middle" dominant-baseline="central">R</text>
  <text x="${cx}" y="${nameY}" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="${nameSize}" fill="${FG}" text-anchor="middle" dominant-baseline="central" letter-spacing="-0.02em">${NAME}</text>
  <text x="${cx}" y="${taglineY}" font-family="system-ui, -apple-system, sans-serif" font-weight="400" font-size="${taglineSize}" fill="#3a3a35" text-anchor="middle" dominant-baseline="central">${TAGLINE}</text>
</svg>`;
}

async function emit(w, h, file) {
  const svg = buildSvg(w, h);
  await sharp(Buffer.from(svg)).resize(w, h).png().toFile(file);
  console.log(`  ${file}  (${w}x${h})`);
}

await mkdir(outDir, { recursive: true });

const startupImage = [];
for (const d of devices) {
  const pxW = d.cssW * d.dpr;
  const pxH = d.cssH * d.dpr;

  const portraitPath = join(outDir, `${d.slug}-portrait.png`);
  const landscapePath = join(outDir, `${d.slug}-landscape.png`);

  await emit(pxW, pxH, portraitPath);
  await emit(pxH, pxW, landscapePath);

  startupImage.push({
    url: `/splash/${d.slug}-portrait.png`,
    media: `(device-width: ${d.cssW}px) and (device-height: ${d.cssH}px) and (-webkit-device-pixel-ratio: ${d.dpr}) and (orientation: portrait)`,
  });
  startupImage.push({
    url: `/splash/${d.slug}-landscape.png`,
    media: `(device-width: ${d.cssW}px) and (device-height: ${d.cssH}px) and (-webkit-device-pixel-ratio: ${d.dpr}) and (orientation: landscape)`,
  });
}

console.log('\nPaste into app/layout.tsx metadata.appleWebApp.startupImage:');
console.log(JSON.stringify(startupImage, null, 2));
