/**
 * Generates PWA icons using sharp (already installed as a Next.js dependency).
 * Creates a black (#111110) square with white "R" text for both 192x192 and 512x512.
 */
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'icons');

async function generateIcon(size) {
  const radius = Math.round(size * 0.18);
  const fontSize = Math.round(size * 0.52);
  const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="#111110"/>
  <text
    x="${size / 2}"
    y="${size / 2}"
    font-family="serif"
    font-size="${fontSize}"
    font-weight="bold"
    fill="#FFFFFF"
    text-anchor="middle"
    dominant-baseline="central"
  >R</text>
</svg>`;

  const outPath = join(outDir, `icon-${size}.png`);
  await sharp(Buffer.from(svgStr))
    .png()
    .toFile(outPath);
  console.log(`Generated ${outPath}`);
}

await generateIcon(192);
await generateIcon(512);
