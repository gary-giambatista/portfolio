/**
 * Procedural brush and ink. Every builder takes a seed and returns segments for `paint()`, so the same seed
 * always paints the same stroke, and a theme change can rebuild it instantly in a new ink color.
 */
import { rng, smooth } from "./random";
import type { Seg } from "./paint";

export type BrushPt = { x: number; y: number; p: number };

/** A bristle brush along a polyline: a solid core while wet, then individual hairs that run dry (flying white). */
export function buildBrush(pts: BrushPt[], width: number, seed: number, dryStart = .72, nb = 34): Seg[] {
  const R = rng(seed), n = pts.length, segs: Seg[] = [];
  const norm = pts.map((_, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
    return [-dy / l, dx / l];
  });
  const bristles = Array.from({ length: nb }, () => ({ u: R() * 2 - 1, w: .5 + R() * 1.3, a: .35 + R() * .5, ink: dryStart + R() * (1 - dryStart) * 1.4, jit: R() * 6.28 }));
  const side = (i: number, u: number): [number, number] => { const p = pts[i], [nx, ny] = norm[i], o = u * width / 2 * p.p; return [p.x + nx * o, p.y + ny * o]; };
  for (let i = 1; i < n; i++) {
    const t = i / n, p = pts[i].p;
    const core = t < dryStart ? 1 : Math.max(0, 1 - (t - dryStart) / (1 - dryStart) * 1.6);
    if (core > 0) {
      const k = .78 * core;
      segs.push({ poly: [side(i - 1, -k), side(i, -k), side(i, k), side(i - 1, k)], a: 1 });
    }
    for (const b of bristles) {
      if (t > b.ink && R() < (t - b.ink) * 9) continue; // the brush runs dry: flying-white gaps
      const u = b.u + Math.sin(i * .21 + b.jit) * .04;
      const [x1, y1] = side(i - 1, u), [x2, y2] = side(i, u);
      segs.push({ line: [x1, y1, x2, y2], w: b.w * (.55 + p * .6), a: b.a * (t > b.ink ? .6 : 1) });
    }
  }
  return segs;
}

export type EnsoOptions = { width: number; dry: number; hairs: number; wob: number };
export const ENSO_DEFAULTS: EnsoOptions = { width: 8.5, dry: .7, hairs: 22, wob: .07 };

/** Hand-painted ensō: a brush tip stamped along a wobbly loop. Wet ink first, then the hairs split and run dry. */
export function buildEnso(w: number, h: number, seed: number, o: EnsoOptions = ENSO_DEFAULTS): Seg[] {
  const R = rng(seed), segs: Seg[] = [];
  const size = Math.min(w, h), R0 = size * .43, W = size * o.width / 100;
  const cx = w / 2, cy = h / 2;
  const wob = smooth(R, 3, 1.3), press = smooth(R, 4, 3), edge = smooth(R, 3, 9);
  const a0 = -2.25 + R() * .2, sweep = Math.PI * 2 * (.9 + R() * .04), N = Math.round(R0 * sweep * 1.4);
  const dry = o.dry;
  const clumps = Array.from({ length: o.hairs }, () => ({ u: R() * 2 - 1, r: .025 + R() * .06, life: dry + .04 + R() * .3, gap: smooth(R, 3, 5 + R() * 7) }));
  const pt = (t: number) => {
    const a = a0 + t * sweep;
    const r = R0 * (1 + o.wob * wob(t * 2.2)) * (1 - t * .05);
    return [cx + t * R0 * .06 + Math.cos(a) * r * 1.04, cy - t * R0 * .04 + Math.sin(a) * r];
  };
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1), [x, y] = pt(t), [xa, ya] = pt(Math.max(0, t - .002)), [xb, yb] = pt(Math.min(1, t + .002));
    const tl = Math.hypot(xb - xa, yb - ya) || 1, nx = -(yb - ya) / tl, ny = (xb - xa) / tl;
    // pressure: a firm press, a wandering middle, a lift at the end
    let p = (t < .05 ? .75 + t * 8 : 1.1 - (t - .05) * .35) + press(t * 3) * .18;
    if (t > .62) p *= 1 - (t - .62) * 1.25;
    const half = W * p / 2;
    if (t < dry) {
      const rr = half * (1 + edge(t * 6) * .07);
      segs.push({ dot: [x + (R() - .5) * .8, y + (R() - .5) * .8, rr, 1] });
      if (R() < .55) { const sd = R() < .5 ? -1 : 1, d = rr * (.88 + R() * .2); segs.push({ dot: [x + nx * d * sd, y + ny * d * sd, .4 + R() * .9, .55] }); }
    }
    if (t > dry - .06) { // split hairs: uneven clumps that break up and give out one by one
      for (const c of clumps) {
        if (t > c.life || c.gap(t * 3) < -.55 + (t - dry) * 2.4) continue;
        const off = c.u * half * 1.05;
        segs.push({ dot: [x + nx * off + (R() - .5) * .5, y + ny * off + (R() - .5) * .5, Math.max(.3, W * c.r * p * (1.15 - (t - dry) * 1.6)), .8] });
      }
    }
    if (i === 6) for (let k = 0; k < 4; k++) segs.push({ dot: [x + (R() - .5) * W * 3.2, y + (R() - .5) * W * 3.2, .6 + R() * 1.6, .85] }); // flick at the first touch
  }
  return segs;
}

/** Watercolor wash: many translucent, randomly deformed copies of one blob, like pigment pooling on paper. */
export function buildWash(w: number, h: number, seed: number): Seg[] {
  const R = rng(seed), gauss = () => (R() + R() + R() - 1.5) / 1.5;
  const deform = (poly: number[][], depth: number) => {
    for (let d = 0; d < depth; d++) {
      const out: number[][] = [];
      for (let i = 0; i < poly.length; i++) {
        const [x1, y1, v1] = poly[i], [x2, y2] = poly[(i + 1) % poly.length], len = Math.hypot(x2 - x1, y2 - y1);
        out.push(poly[i], [(x1 + x2) / 2 + gauss() * len * v1, (y1 + y2) / 2 + gauss() * len * v1, v1 * (.8 + R() * .5)]);
      }
      poly = out;
    }
    return poly;
  };
  const cx = w / 2, cy = h / 2, rx = w * .4, ry = h * .4, base: number[][] = [];
  for (let i = 0; i < 11; i++) { const a = i / 11 * 6.28; base.push([cx + Math.cos(a) * rx * (.9 + R() * .2), cy + Math.sin(a) * ry * (.9 + R() * .2), .22 + R() * .2]); }
  const blob = deform(base, 2), segs: Seg[] = [];
  for (let l = 0; l < 48; l++) segs.push({ path: deform(blob.map(q => [...q]), 3), a: .03 });
  for (let i = 0; i < 260; i++) segs.push({ erase: [R() * w, R() * h, .5 + R() * 2.2, .12 + R() * .25] }); // paper granulation
  return segs;
}

export function buildSplat(cx: number, cy: number, size: number, seed: number, drops = 16): Seg[] {
  const R = rng(seed), segs: Seg[] = [];
  for (let i = 0; i < 7; i++) { const a = R() * 6.28, d = R() * size * .35; segs.push({ dot: [cx + Math.cos(a) * d, cy + Math.sin(a) * d, size * (.28 + R() * .3), 1] }); }
  for (let i = 0; i < drops; i++) {
    const a = R() * 6.28, d = size * (.75 + Math.pow(R(), 1.6) * 1.9), r = Math.max(.8, size * .2 * Math.pow(1 - (d / size - .75) / 1.9, 2) * (.4 + R()));
    segs.push({ dot: [cx + Math.cos(a) * d, cy + Math.sin(a) * d, r, .9], stretch: 1 + R() * 1.4, ang: a });
  }
  return segs;
}

/** The drop at the bottom of the spine. */
export function buildDrop(w: number, h: number, seed: number): Seg[] {
  const R = rng(seed), cx = w / 2, segs: Seg[] = [];
  segs.push({ shape: [cx, h * .72, 9.5] });
  for (let i = 0; i < 4; i++) segs.push({ dot: [cx + (R() * 2 - 1) * 26, h * .72 + (R() * 2 - 1) * 16, 1 + R() * 2.4, .85] });
  return segs;
}

/** The swash under the home page headline. */
export function buildSwash(w: number, h: number, seed: number): Seg[] {
  const pts: BrushPt[] = [], N = 140;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    pts.push({ x: 6 + t * (w - 12), y: h * .58 - Math.sin(t * Math.PI) * h * .12 + t * h * .06, p: Math.min(1, .25 + t * 7) * (1 - Math.pow(t, 2.4) * .85) });
  }
  return buildBrush(pts, h * .8, seed, .8);
}

type PathFn = (t: number) => [number, number];

/** A stamped stroke along any path: wet stamps, then a dry, hairy tail. `pools` swell the stroke at those t values. */
export function brushAlong(pt: PathFn, len: number, W: number, seed: number, { dry = .7, pools = [] as number[] } = {}): Seg[] {
  const R = rng(seed), segs: Seg[] = [], press = smooth(R, 4, 3), N = Math.max(2, Math.round(len * 1.4));
  const clumps = Array.from({ length: 20 }, () => ({ u: R() * 2 - 1, r: .025 + R() * .06, life: dry + .04 + R() * .3, gap: smooth(R, 3, 5 + R() * 7) }));
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1), [x, y] = pt(t), [xa, ya] = pt(Math.max(0, t - .002)), [xb, yb] = pt(Math.min(1, t + .002));
    const tl = Math.hypot(xb - xa, yb - ya) || 1, nx = -(yb - ya) / tl, ny = (xb - xa) / tl;
    let p = (t < .05 ? .75 + t * 8 : 1.1 - (t - .05) * .35) + press(t * 3) * .18;
    if (t > .62) p *= 1 - (t - .62) * 1.25;
    for (const q of pools) { const d = (t - q) * 40; if (Math.abs(d) < 3) p += Math.exp(-d * d) * .6; }
    const half = W * p / 2;
    if (t < dry) {
      segs.push({ dot: [x + (R() - .5) * .8, y + (R() - .5) * .8, half, 1] });
      if (R() < .5) { const s = R() < .5 ? -1 : 1, d = half * (.9 + R() * .2); segs.push({ dot: [x + nx * d * s, y + ny * d * s, .4 + R() * .9, .55] }); }
    }
    if (t > dry - .06) for (const c of clumps) {
      if (t > c.life || c.gap(t * 3) < -.55 + (t - dry) * 2.4) continue;
      const o = c.u * half * 1.05;
      segs.push({ dot: [x + nx * o, y + ny * o, Math.max(.3, W * c.r * p * (1.15 - (t - dry) * 1.6)), .8] });
    }
  }
  return segs;
}

/** The About page's ensō: brushAlong around a wobbly loop. Returns the path and its length. */
export function ensoPath(w: number, h: number, seed: number, sweepFrac: number): [PathFn, number] {
  const R = rng(seed * 7), wob = smooth(R, 3, 1.3), size = Math.min(w, h), R0 = size * .43, a0 = -2.2, sweep = Math.PI * 2 * sweepFrac;
  return [t => {
    const a = a0 + t * sweep, r = R0 * (1 + .07 * wob(t * 2.2)) * (1 - t * .05);
    return [w / 2 + t * R0 * .06 + Math.cos(a) * r * 1.04, h / 2 - t * R0 * .04 + Math.sin(a) * r];
  }, R0 * sweep];
}

/** The 404 ensō is left wide open: a circle that never quite found its way back. */
export function buildOpenEnso(w: number, h: number, seed: number): Seg[] {
  const R = rng(seed), segs: Seg[] = [], size = Math.min(w, h), R0 = size * .42, W = size * .08, cx = w / 2, cy = h / 2;
  const wob = smooth(R, 3, 1.3), press = smooth(R, 4, 3), dry = .66, sweep = Math.PI * 2 * .78, a0 = -1.9, N = Math.round(R0 * sweep * 1.4);
  const clumps = Array.from({ length: 20 }, () => ({ u: R() * 2 - 1, r: .025 + R() * .06, life: dry + .04 + R() * .32, gap: smooth(R, 3, 5 + R() * 7) }));
  const pt = (t: number) => { const a = a0 + t * sweep, r = R0 * (1 + .08 * wob(t * 2.2)); return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1), [x, y] = pt(t), [xa, ya] = pt(Math.max(0, t - .002)), [xb, yb] = pt(Math.min(1, t + .002));
    const tl = Math.hypot(xb - xa, yb - ya) || 1, nx = -(yb - ya) / tl, ny = (xb - xa) / tl;
    let p = (t < .05 ? .75 + t * 8 : 1.1 - (t - .05) * .35) + press(t * 3) * .18; if (t > .6) p *= 1 - (t - .6) * 1.25;
    const half = W * p / 2;
    if (t < dry) {
      segs.push({ dot: [x + (R() - .5) * .8, y + (R() - .5) * .8, half, 1] });
      if (R() < .5) { const s = R() < .5 ? -1 : 1, d = half * (.9 + R() * .2); segs.push({ dot: [x + nx * d * s, y + ny * d * s, .4 + R() * .9, .55] }); }
    }
    if (t > dry - .06) for (const c of clumps) {
      if (t > c.life || c.gap(t * 3) < -.55 + (t - dry) * 2.4) continue;
      const o = c.u * half * 1.05;
      segs.push({ dot: [x + nx * o, y + ny * o, Math.max(.3, W * c.r * p * (1.15 - (t - dry) * 1.6)), .8] });
    }
  }
  return segs;
}

/** The blog title's swash: dense round stamps along a gentle arc. */
export function buildDotSwash(w: number, h: number, seed: number): Seg[] {
  const R = rng(seed), press = smooth(R, 3, 2), segs: Seg[] = [];
  for (let i = 0, N = Math.round(w * 1.2); i < N; i++) {
    const t = i / (N - 1), p = Math.min(1, .3 + t * 7) * (1 - Math.pow(t, 2.4) * .8) * (1 + press(t * 4) * .15);
    segs.push({ dot: [6 + t * (w - 12), h * .58 - Math.sin(t * Math.PI) * h * .12, h * .4 * p, 1] });
  }
  return segs;
}
