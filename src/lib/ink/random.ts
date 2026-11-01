/** mulberry32: a tiny seeded generator, so a seed always paints the same stroke on every device. */
export function rng(seed: number): () => number {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/** Smooth 1D noise: a few sines with random phases, so pressure and wobble drift like a hand. */
export function smooth(R: () => number, n = 4, f0 = 2): (t: number) => number {
  const terms = Array.from({ length: n }, (_, k) => [f0 * (k + 1) * (.7 + R() * .6), R() * 6.28, 1 / (k + 1)]);
  const norm = terms.reduce((a, t) => a + t[2], 0);
  return t => terms.reduce((a, [f, ph, amp]) => a + Math.sin(t * f + ph) * amp, 0) / norm;
}
