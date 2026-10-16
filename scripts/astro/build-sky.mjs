// npm run gen:sky  (DESIGN-SPEC §C.5 data pipeline, §F G-20)
//
// Reads d3-celestial's stars.6.json and constellations.lines.json (BSD-3-Clause, Olaf Frohn; positions
// derived from the Hipparcos catalogue, J2000) and writes:
//   public/data/sky/stars.bin           Float32 little-endian, 4 per star: RA rad [0, 2π), Dec rad, V mag, B-V;
//                                       magnitude ≤ 5.5, sorted brightest first (so a prefix is the N brightest)
//   public/data/sky/constellations.bin  Float32 little-endian, 4 per segment: RA1, Dec1, RA2, Dec2 (radians)
//   public/data/sky/sky.json            counts, layout, source and attribution
// Flags: --out=<dir> (default public/data/sky).
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

import { ROOT, parseArgs } from '../terrain/shared.mjs';

const MAG_LIMIT = 5.5;
const MAX_STARS_BYTES = 50_000;
/** B-V for the rare star the catalogue leaves blank: a sun-like 0.6 (white to the eye, untinted). */
const DEFAULT_BV = 0.6;
const DEG = Math.PI / 180;
const TAU = Math.PI * 2;

const SKY_ATTRIBUTION =
  'Stars and constellation lines from d3-celestial (Olaf Frohn, BSD-3-Clause), derived from the Hipparcos catalogue';

const args = parseArgs(process.argv.slice(2));
const outDir = args.out ? resolve(String(args.out)) : join(ROOT, 'public', 'data', 'sky');
const dataDir = join(ROOT, 'node_modules', 'd3-celestial', 'data');
const pkg = JSON.parse(readFileSync(join(ROOT, 'node_modules', 'd3-celestial', 'package.json'), 'utf8'));
const starsJson = JSON.parse(readFileSync(join(dataDir, 'stars.6.json'), 'utf8'));
const linesJson = JSON.parse(readFileSync(join(dataDir, 'constellations.lines.json'), 'utf8'));

/** d3-celestial stores RA as a GeoJSON longitude in degrees, -180..180. */
const raRad = (lonDeg) => {
  const r = (((lonDeg % 360) + 360) % 360) * DEG;
  return r >= TAU ? r - TAU : r;
};

const stars = starsJson.features
  .map((f) => {
    const bv = Number.parseFloat(f.properties.bv);
    return {
      ra: raRad(f.geometry.coordinates[0]),
      dec: f.geometry.coordinates[1] * DEG,
      mag: Number(f.properties.mag),
      bv: Number.isFinite(bv) ? bv : DEFAULT_BV,
    };
  })
  .filter((s) => Number.isFinite(s.mag) && s.mag <= MAG_LIMIT)
  .sort((a, b) => a.mag - b.mag || a.ra - b.ra);

const starBuf = Buffer.alloc(stars.length * 16);
stars.forEach((s, i) => {
  starBuf.writeFloatLE(s.ra, i * 16);
  starBuf.writeFloatLE(s.dec, i * 16 + 4);
  starBuf.writeFloatLE(s.mag, i * 16 + 8);
  starBuf.writeFloatLE(s.bv, i * 16 + 12);
});
if (starBuf.length > MAX_STARS_BYTES) throw new Error(`stars.bin is ${starBuf.length} B, over ${MAX_STARS_BYTES} B`);

// Segments, de-duplicated (several figures share edges), in catalogue order.
const seen = new Set();
const segments = [];
for (const feature of linesJson.features) {
  for (const line of feature.geometry.coordinates) {
    for (let i = 0; i + 1 < line.length; i += 1) {
      const a = [raRad(line[i][0]), line[i][1] * DEG];
      const b = [raRad(line[i + 1][0]), line[i + 1][1] * DEG];
      const key = [a, b].map((p) => p.map((v) => v.toFixed(5)).join(',')).sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      segments.push([...a, ...b]);
    }
  }
}
const segBuf = Buffer.alloc(segments.length * 16);
segments.forEach((seg, i) => seg.forEach((v, k) => segBuf.writeFloatLE(v, i * 16 + k * 4)));

const meta = {
  stars: stars.length,
  segments: segments.length,
  constellations: linesJson.features.length,
  magLimit: MAG_LIMIT,
  epoch: 'J2000',
  starLayout: ['raRad', 'decRad', 'mag', 'bv'],
  segmentLayout: ['raRad1', 'decRad1', 'raRad2', 'decRad2'],
  order: 'brightest first',
  encoding: 'float32 little-endian',
  source: `d3-celestial ${pkg.version} (stars.6.json, constellations.lines.json)`,
  license: 'BSD-3-Clause',
  attribution: SKY_ATTRIBUTION,
};

mkdirSync(outDir, { recursive: true });
const files = {
  'stars.bin': starBuf,
  'constellations.bin': segBuf,
  'sky.json': `${JSON.stringify(meta, null, 2).replace(/\[\s+([^\]]*?)\s+\]/g, (_, inner) => `[${inner.split(/,\s+/).join(', ')}]`)}\n`,
};
for (const [name, content] of Object.entries(files)) writeFileSync(join(outDir, name), content);

console.log(`sky: ${stars.length} stars (mag ≤ ${MAG_LIMIT}), ${segments.length} constellation segments`);
for (const name of Object.keys(files)) {
  const path = join(outDir, name);
  console.log(`  ${relative(ROOT, path)} (${statSync(path).size} B)`);
}
