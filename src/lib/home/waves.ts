/**
 * The sea under each flight: an original wave in the spirit of Japanese woodblock seas, painted with the site's
 * brush engine. Each great wave is a set of nested stripes that wrap around a hollow barrel and run down the
 * back slope into the sea, with a foam cap whose fingers curl the way the wave is breaking. Swells cross the
 * open water, spray rises toward the plane's path, and a small Fuji stands at the Japan end of the route.
 *
 * Painted once per layout onto two canvases (wash and ink). Scrolling only moves a mask that reveals the wave
 * behind the plane and deepens the wash, the same cheap trick as the spine ink.
 */
import { buildBrush, type BrushPt } from "../ink/builders";
import type { Seg } from "../ink/paint";
import { rng, smooth } from "../ink/random";

export type WaveSpec = {
  width: number; height: number;
  /** Route endpoints on the band's baseline. */
  x0: number; x1: number; yb: number;
  /** Which way the waves curl: 1 → right, -1 → left. */
  dir: 1 | -1;
  /** Where along the route Fuji stands (0–1), or null for none. */
  fuji: number | null;
  seed: number;
};
export type WaveSegs = { wash: Seg[]; ink: Seg[]; foamEdge: Seg[]; foam: Seg[] };

type P = [number, number];

/** Back-slope profile: 1 at the crest (flat), 0 at the foot (flat), an S between. */
const slope = (s: number) => Math.pow(.5 * (1 + Math.cos(Math.PI * Math.min(1, Math.max(0, s)))), 1.7);

export function buildWave(o: WaveSpec): WaveSegs {
  const R = rng(o.seed), gauss = () => (R() + R() + R() - 1.5) / 1.5;
  const wash: Seg[] = [], ink: Seg[] = [], foamEdge: Seg[] = [], foam: Seg[] = [];
  const span = o.x1 - o.x0, xa = o.x0 + span * .07, xb = o.x1 - span * .07, sea = o.yb - 3, dir = o.dir;
  const Hc = Math.min(o.height * .5, span * .26);
  const swellAmp = Math.min(9, o.height * .035), swellLen = Math.max(46, span / 11), phase = R() * 6.28;
  const wob = smooth(R, 3, 2);
  const envelope = (x: number) => Math.pow(Math.max(0, Math.sin(Math.PI * (x - xa) / (xb - xa))), .6);
  const dot = (list: Seg[], x: number, y: number, r: number, a = 1) => list.push({ dot: [x, y, r, a] });
  /** A foam dot: an ink rim under a paper-white fill. Overlapping dots merge into one outlined shape. */
  const bubble = (x: number, y: number, r: number) => { dot(foamEdge, x, y, r + .85); dot(foam, x, y, r); };
  const stroke = (pts: P[], width: number, seed: number, taper = true, nb = 6, dry = .82) => {
    const n = pts.length;
    const bp: BrushPt[] = pts.map(([x, y], i) => ({ x, y, p: taper ? Math.min(1, .25 + i / n * 6) * (1 - Math.pow(i / n, 3) * .7) : 1 }));
    ink.push(...buildBrush(bp, width, seed, dry, nb));
  };
  const jitter = (pts: P[], s: number) => pts.map(([x, y]) => [x + gauss() * s, y + gauss() * s]);

  // ---- the great waves: a big one, and a smaller one ahead of it when the band is wide enough
  type Wave = { xc: number; H: number; L: number; back: number; front: number; seed: number };
  /** The back slope runs up to 1.9 × the height behind the crest, but never past the start of the route. */
  const geo = (xc: number, H: number, seed: number): Wave => {
    const L = Math.min(H * 1.9, Math.abs(xc - (dir > 0 ? xa : xb)));
    return { xc, H, L, back: xc - dir * L, front: xc + dir * H * .75, seed };
  };
  // on narrow bands the big wave moves inward, so its back slope keeps room to rise
  const bigX = dir > 0 ? Math.max(xa + (xb - xa) * .26, xa + Hc * 1.55) : Math.min(xa + (xb - xa) * .74, xb - Hc * 1.55);
  const big = geo(bigX, Hc, o.seed);
  const waves: Wave[] = [big];
  const small = geo(xa + (xb - xa) * (dir > 0 ? .58 : .42), Hc * .5, o.seed + 500);
  const fujiHalf = o.fuji === null ? 0 : Hc * .55, fujiX = o.fuji === null ? 0 : xa + (xb - xa) * o.fuji;
  if ((small.back - big.front) * dir > Hc * .1 && (o.fuji === null || (fujiX - small.front) * dir > fujiHalf + Hc * .1)) waves.push(small);

  /** The open sea flattens near each wave, so swells never run into a wave's foot or under its barrel. */
  const damp = (x: number) => {
    let d = 1;
    for (const w of waves) {
      const lo = Math.min(w.back, w.front), hi = Math.max(w.back, w.front), pad = w.H * .35;
      const dist = x < lo ? lo - x : x > hi ? x - hi : 0;
      d = Math.min(d, Math.min(1, dist / pad));
    }
    return d * d * (3 - 2 * d);
  };
  const swell = (x: number) => swellAmp * (.5 + .5 * Math.sin(2 * Math.PI * x / swellLen + phase)) * (1 + wob(x / span * 3) * .3);
  const surface = (x: number) => sea - swell(x) * envelope(x) * damp(x);

  // ---- Fuji, small and pale on the horizon at the Japan end (painted first, so the sea overlaps its base)
  if (o.fuji !== null) {
    const xf = fujiX, fw = Hc * .95, fh = Hc * .46, base = sea - swellAmp * .5;
    const flank = (t: number, side: -1 | 1): P => [xf + side * (fw * .07 + (fw * .43) * t), base - fh + fh * Math.pow(t, .8)];
    const left = Array.from({ length: 24 }, (_, i) => flank(1 - i / 23, -1)), right = Array.from({ length: 24 }, (_, i) => flank(i / 23, 1));
    const body = [...left, ...right];
    for (let l = 0; l < 5; l++) wash.push({ path: jitter(body, .6), a: .1 });
    const cap: P[] = [];
    for (let i = 0; i <= 10; i++) cap.push(flank(i / 10 * .34, -1));
    cap.reverse();
    for (let i = 0; i <= 8; i++) { const x = xf - fw * .2 + fw * .4 * i / 8; cap.push([x, base - fh * .62 - (i % 2 ? fh * .1 : 0) - R() * 2]); }
    for (let i = 0; i <= 10; i++) cap.push(flank(i / 10 * .34, 1));
    foam.push({ path: cap, a: 1 });
    stroke(left, 1.6, o.seed + 3, false, 4); stroke(right, 1.6, o.seed + 4, false, 4);
  }

  // ---- the open sea: a wash from the swell line down, and the swell's surface line
  const xs: number[] = []; for (let x = xa; x <= xb; x += 3) xs.push(x); xs.push(xb);
  const seaPoly: P[] = [...xs.map(x => [x, surface(x)] as P), [xb, sea + 5], [xa, sea + 5]];
  for (let l = 0; l < 8; l++) wash.push({ path: jitter(seaPoly, 1), a: .1 });
  {
    let run: P[] = [];
    const flush = () => { if (run.length > 6) stroke(run, 1.7, o.seed + 6 + run.length, true, 6, .9); run = []; };
    for (const x of xs) { if (damp(x) > .02) run.push([x, surface(x)]); else flush(); }
    flush();
  }
  for (let k = 0; k < 2; k++) { // a second, broken swell line just under the surface
    let run: P[] = [];
    const flush = () => { if (run.length > 8) stroke(run, 1, o.seed + 30 + k + run.length, true, 3, .6); run = []; };
    for (const x of xs) {
      const crestish = Math.sin(2 * Math.PI * x / swellLen + phase + .9 + k * 1.3) > .1;
      if (damp(x) > .6 && envelope(x) > .3 && crestish) run.push([x, surface(x) + 3.5 + k * 2.5]); else flush();
    }
    flush();
  }
  for (const x of xs) { // little foam caps on the swell tops
    if (damp(x) < .8 || envelope(x) < .4) continue;
    const ph = (2 * Math.PI * x / swellLen + phase) % (2 * Math.PI);
    if (Math.abs(ph - Math.PI / 2) < .09 && R() < .9) for (let k = 0; k < 4; k++) bubble(x + dir * k * 2.6, surface(x) - .5 + k * .6, 1.6 - k * .3);
  }

  for (const w of waves) greatWave(w);

  function greatWave({ xc, H, L: Lout, seed }: Wave) {
    const c = H * .5, C: P = [xc, sea - c], R0 = H * .5, T0 = H * .24, thMax = Math.PI * 1.05;
    const Rout = (th: number) => R0 * (1 - .42 * th / thMax);
    const thick = (th: number) => T0 * (1 - Math.pow(th / thMax, 1.8));
    const rAt = (th: number, f: number) => Rout(th) - thick(th) * (1 - f);
    const Lin = Math.min(H * .48, Lout * .5);
    /** One stripe, from its foot on the back slope, over the crest, around the barrel to the tip. f: 0 inner → 1 outer. */
    const stripe = (f: number): P[] => {
      const h = c + rAt(0, f), L = Lin + (Lout - Lin) * Math.pow(f, 1.3), pts: P[] = [];
      const nb = Math.max(12, Math.round(L / 4));
      for (let j = 0; j <= nb; j++) { const s = 1 - j / nb; pts.push([xc - dir * L * s, sea - h * slope(s)]); }
      for (let j = 1; j <= 64; j++) {
        const th = thMax * j / 64, r = rAt(th, f), phi = -Math.PI / 2 + dir * th;
        pts.push([C[0] + r * Math.cos(phi), C[1] + r * Math.sin(phi)]);
      }
      return pts;
    };
    const N = H >= 90 ? 8 : H >= 50 ? 6 : 4;
    const stripes = Array.from({ length: N + 1 }, (_, i) => stripe(i / N));
    const outer = stripes[N], inner = stripes[0];

    // body: one wash for the whole mass, then every other band again for the two-tone stripes
    const body = [...outer, ...[...inner].reverse()];
    for (let l = 0; l < 6; l++) wash.push({ path: jitter(body, .8), a: .1 });
    for (let i = 0; i < N; i += 2) {
      const band = [...stripes[i + 1], ...[...stripes[i]].reverse()];
      for (let l = 0; l < 3; l++) wash.push({ path: jitter(band, .5), a: .1 });
    }
    // ink: a strong outline over the top, the barrel's inner edge, thin lines between the bands
    stroke(outer, 2.3, seed + 5, true, 8, .9);
    stroke(inner, 1.8, seed + 7, true, 6, .85);
    for (let i = 1; i < N; i++) stroke(stripes[i], 1.05, seed + 10 + i, true, 3, .62);

    // ---- foam: a cap riding the crest, scalloped on its underside, with fingers that curl over
    const scale = Math.max(.6, H / 100);
    const nIn = (pts: P[], k: number): P => { // unit normal pointing into the water
      const a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)];
      let nx = -(b[1] - a[1]), ny = b[0] - a[0];
      const len = Math.hypot(nx, ny) || 1; nx /= len; ny /= len;
      const p = pts[k];
      return (C[0] - p[0]) * nx + (C[1] - p[1]) * ny > 0 ? [nx, ny] : [-nx, -ny];
    };
    const nBack = outer.findIndex(([x]) => (x - xc) * dir > -H * .42);
    const nTop = outer.length - 64; // index of the crest, where the arc begins
    const capEnd = nTop + Math.round(64 * .62);
    const capPts: number[] = [];
    for (let k = nBack; k <= capEnd; k++) capPts.push(k);
    capPts.forEach((k, i) => {
      const t = i / (capPts.length - 1), rho = H * .068 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.15 + .05)), .55) + .8;
      const [x, y] = outer[k], [nx, ny] = nIn(outer, k);
      bubble(x + nx * rho * .55, y + ny * rho * .55, rho);
      if (i % 5 === 2) bubble(x + nx * rho * 1.35, y + ny * rho * 1.35, rho * .55); // scallop
    });

    /** A foam finger: a tapering chain of foam that hooks the way the wave turns. */
    const finger = (x: number, y: number, ang: number, len: number, r0: number) => {
      let d = 0, a = ang;
      const kappa = (2.4 + R() * .8) / len;
      while (d < len) {
        const r = r0 * Math.pow(1 - d / len, .8) + .45;
        bubble(x, y, r);
        const step = Math.max(.6, r * .45);
        x += Math.cos(a) * step; y += Math.sin(a) * step; a += dir * kappa * step; d += step;
      }
    };
    const roots = 9;
    for (let c2 = 0; c2 < roots; c2++) {
      const t = c2 / (roots - 1), k = nTop + Math.round(t * 64 * .92) - (c2 === 0 ? 6 : 0);
      const [x, y] = outer[k], [nx, ny] = nIn(outer, k), th = t * .92;
      const base = Math.atan2(-ny, -nx) + dir * (.45 + R() * .25);
      const len = H * (.11 + R() * .08) * (1 - .35 * th), r0 = Math.max(1.4, H * .028) * (1 - .3 * th);
      bubble(x, y, r0 * 1.5);
      const fingers = 2 + (R() < .55 ? 1 : 0);
      for (let f = 0; f < fingers; f++) finger(x, y, base + (f - (fingers - 1) / 2) * .6 * dir, len * (.75 + R() * .4), r0);
    }
    // a few fingers off the back of the cap, smaller, reaching up and back
    for (let i = 0; i < 4; i++) {
      const k = nBack + Math.round((nTop - nBack) * (.15 + i * .2)), [x, y] = outer[k], [nx, ny] = nIn(outer, k);
      finger(x - nx * 1.5, y - ny * 1.5, Math.atan2(-ny, -nx) - dir * .2, H * (.06 + R() * .04), Math.max(1.1, H * .02));
    }

    // ---- spray thrown up off the crest, toward the plane's path: open rings and a few solid drops
    const n = Math.round(14 + H * .22);
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + dir * (R() * 1.1 - .1), d = H * .06 + Math.pow(R(), 1.3) * H * .5;
      const x = xc + dir * R0 * .3 + Math.cos(a) * d, y = sea - c - R0 + Math.sin(a) * d * .75;
      if (y > sea - c) continue;
      const r = (.6 + Math.pow(R(), 2) * 2) * scale;
      if (r > 1.6 * scale) { dot(foamEdge, x, y, r + .9); dot(foam, x, y, r - .2); } else bubble(x, y, r);
    }
  }
  return { wash, ink, foamEdge, foam };
}
