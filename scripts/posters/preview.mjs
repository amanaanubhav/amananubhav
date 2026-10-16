// QA previews (--preview=<dir>): standalone SVGs of the generated data with fixed preview colours, so a
// sheet can be eyeballed or rasterised without the app. Never written into src/ or public/.
const PAPER = '#0e2231';
const INK = '#e8e2d4';
const SIGNAL = '#ff9a5c';
const WATER = '#7fb6d9';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

function labelSvg(l, size) {
  const anchor = l.anchor ?? 'start';
  const italic = l.kind === 'water' || l.kind === 'area' || l.kind === 'note';
  const fill = l.kind === 'water' ? WATER : INK;
  const alt = typeof l.altitudeM === 'number' ? ` ${l.approx ? '~' : ''}${l.altitudeM.toLocaleString('en')} m` : '';
  const mark = l.kind === 'pass' || l.kind === 'peak' ? '△ ' : l.kind === 'village' || l.kind === 'town' ? '• ' : '';
  return `<text x="${l.x}" y="${l.y}" font-size="${size}" font-family="Georgia, serif" ${italic ? 'font-style="italic"' : ''} fill="${fill}" text-anchor="${anchor}" dominant-baseline="middle">${esc(mark + l.text + alt)}</text>`;
}

export function previewSheetSvg(data) {
  const [w, h] = data.viewBox;
  const size = Math.max(w, h) / 70;
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">`,
    `<rect width="${w}" height="${h}" fill="${PAPER}"/>`,
    `<path d="${data.minor.join(' ')}" fill="none" stroke="${INK}" stroke-opacity="0.16" stroke-width="1"/>`,
    `<path d="${data.index.join(' ')}" fill="none" stroke="${INK}" stroke-opacity="0.38" stroke-width="1.2"/>`,
    ...(data.water ?? []).map((d) => `<path d="${d}" fill="none" stroke="${WATER}" stroke-width="1.25"/>`),
    ...data.routes.map(
      (r) =>
        `<path d="${r.d}" fill="none" stroke="${SIGNAL}" stroke-width="${r.kind === 'side-trip' || r.kind === 'planned' ? 1.5 : 2.5}" ${r.kind === 'planned' ? 'stroke-dasharray="6 5"' : ''} stroke-linecap="round"/>`,
    ),
    ...data.labels.map((l) => labelSvg(l, size)),
    // The tent at ContourSheet's mark scale (max(1, longest side / 560)), so overlaps show up here.
    data.tent
      ? `<path transform="translate(${data.tent.x} ${data.tent.y}) scale(${Math.max(1, Math.max(w, h) / 560).toFixed(2)})" d="M-11 7L0-9 11 7z" fill="${SIGNAL}"/>`
      : '',
    data.scaleBar
      ? `<path d="M${data.scaleBar.x} ${data.scaleBar.y - 6}V${data.scaleBar.y}h${data.scaleBar.lengthPx}v-6" fill="none" stroke="${INK}"/>`
      : '',
    data.sheetTitle ? `<text x="12" y="${h - 12}" font-size="${size}" font-style="italic" fill="${INK}" font-family="Georgia, serif">${esc(data.sheetTitle)}</text>` : '',
    '</svg>',
  ];
  return parts.join('\n');
}

export function previewStarSvg(data) {
  const [w, h] = data.viewBox;
  const size = Math.max(w, h) / 60;
  const tint = (t) => (t < -0.2 ? '#cfe0ff' : t > 0.2 ? '#ffd9b8' : INK);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * (w < 400 ? 3 : 1)}" height="${h * (w < 400 ? 3 : 1)}">`,
    `<rect width="${w}" height="${h}" fill="${PAPER}"/>`,
    `<path d="${(data.graticule ?? []).join(' ')}" fill="none" stroke="${INK}" stroke-opacity="0.15"/>`,
    data.horizon ? `<path d="${data.horizon}" fill="none" stroke="${INK}" stroke-opacity="0.6"/>` : '',
    `<path d="${(data.lines ?? []).join(' ')}" fill="none" stroke="${INK}" stroke-opacity="0.25" stroke-width="${w < 400 ? 0.3 : 0.75}"/>`,
    ...data.stars.map(([x, y, r, t]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${tint(t)}"/>`),
    ...data.labels.map((l) => labelSvg(l, size)),
    '</svg>',
  ].join('\n');
}
