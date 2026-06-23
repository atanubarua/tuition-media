import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const svg = readFileSync(join(root, 'public', 'favicon.svg'));

const png = (size) => sharp(svg, { density: 384 }).resize(size, size).png().toBuffer();

// Apple touch icon (180x180)
await sharp(await png(180)).toFile(join(root, 'public', 'apple-touch-icon.png'));

// Multi-size .ico (16/32/48)
const icoBuffers = await Promise.all([16, 32, 48].map(png));
writeFileSync(join(root, 'public', 'favicon.ico'), await pngToIco(icoBuffers));

console.log('Generated apple-touch-icon.png and favicon.ico');
