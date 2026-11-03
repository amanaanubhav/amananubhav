/*
 * The contour rings that spread from a raised summit: five irregular closed contours around 0,0 in a -1.4..1.4 box
 * (radius 0.2 per ring, wobbled by three seeded harmonics), the outer one last so CSS can draw it as the index line.
 * Seeded (Park-Miller), so a session draws the same sequence of rings.
 */

const RING_COUNT = 5;
const RING_STEP = 0.2;
const POINTS = 48;

export function createRings(seed = 7): () => string {
  let state = seed;
  const random = () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
  return () => {
    const p1 = random() * Math.PI * 2;
    const p2 = random() * Math.PI * 2;
    const p3 = random() * Math.PI * 2;
    let out = '';
    for (let k = 1; k <= RING_COUNT; k++) {
      const r0 = RING_STEP * k;
      let d = '';
      for (let i = 0; i <= POINTS; i++) {
        const a = (i / POINTS) * Math.PI * 2;
        const r = r0 * (1 + 0.1 * Math.sin(3 * a + p1) + 0.05 * Math.sin(5 * a + p2) + 0.03 * Math.sin(7 * a + p3 + k * 0.4));
        d += `${i ? 'L' : 'M'}${(Math.cos(a) * r).toFixed(3)} ${(Math.sin(a) * r).toFixed(3)}`;
      }
      out += `<path d="${d}Z"/>`;
    }
    return out;
  };
}
