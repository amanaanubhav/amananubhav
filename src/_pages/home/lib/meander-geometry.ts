/* ─────────────────────────────────────────────
   BUILD MEANDERING SVG PATH
   Small amplitude so it stays in a narrow
   center band and never touches text.
   ───────────────────────────────────────────── */
export interface MeanderNode {
  x: number;
  y: number;
}

export function buildMeanderPath(nodeCount: number): { d: string; nodes: MeanderNode[] } {
  const cx = 50;
  const amp = 12;
  const margin = 8;
  const range = 100 - 2 * margin;

  const nodeY: number[] = [];
  for (let i = 0; i < nodeCount; i++) {
    nodeY.push(margin + (i / (nodeCount - 1)) * range);
  }

  let d = `M ${cx},0`;
  nodeY.forEach((y, i) => {
    const x = cx + (i % 2 === 0 ? -amp : amp);
    const prevY = i === 0 ? 0 : (nodeY[i - 1] ?? 0);
    const prevX = i === 0 ? cx : cx + ((i - 1) % 2 === 0 ? -amp : amp);
    d += ` C ${prevX},${(prevY + y) / 2} ${x},${(prevY + y) / 2} ${x},${y}`;
  });
  const lastY = nodeY[nodeCount - 1] ?? 0;
  const lastX = cx + ((nodeCount - 1) % 2 === 0 ? -amp : amp);
  d += ` C ${lastX},${(lastY + 100) / 2} ${cx},${(lastY + 100) / 2} ${cx},100`;

  const nodes = nodeY.map((y, i) => ({
    x: cx + (i % 2 === 0 ? -amp : amp),
    y,
  }));

  return { d, nodes };
}

/* ─────────────────────────────────────────────
   STAR FIELD – random star data. Client only:
   call after mount to avoid hydration mismatch.
   ───────────────────────────────────────────── */
export interface Star {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
}

export function generateStars(count: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      delay: Math.random() * 6,
      duration: Math.random() * 4 + 3,
      opacity: Math.random() * 0.6 + 0.2,
    });
  }
  return stars;
}

/* ─────────────────────────────────────────────
   HEXAGON POINTS
   Precomputed literals of the legacy formula
   (r + r*cos(a), r + r*sin(a), a = PI/3*i - PI/2)
   so server and client render identical strings.
   ───────────────────────────────────────────── */
const HEXAGON_POINTS: Readonly<Record<number, string>> = {
  24: '12,0 22.392304845413264,6 22.392304845413264,18 12,24 1.6076951545867377,18.000000000000004 1.6076951545867324,6.000000000000007',
  20: '10,0 18.660254037844386,5 18.66025403784439,14.999999999999998 10,20 1.3397459621556145,15.000000000000004 1.3397459621556091,5.000000000000006',
};

export function hexagonPoints(size: number): string {
  const precomputed = HEXAGON_POINTS[size];
  if (precomputed !== undefined) return precomputed;
  const r = size / 2;
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    return `${r + r * Math.cos(angle)},${r + r * Math.sin(angle)}`;
  }).join(' ');
}
