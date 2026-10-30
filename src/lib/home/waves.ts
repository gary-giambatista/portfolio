/**
 * The sea under each flight: an original wave in the spirit of Hokusai's woodblocks, painted with the site's
 * brush engine. Indigo wash for the water, sumi lines for the striations and the curling lip, foam "claws"
 * along the crest, spray where the plane passes, and a small Fuji at the Japan end of the route.
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
  /** Which way the great wave curls: 1 → right, -1 → left. */
  dir: 1 | -1;
  /** Where along the route Fuji stands (0–1), or null for none. */
  fuji: number | null;
  seed: number;
};
export type WaveSegs = { wash: Seg[]; ink: Seg[]; foamEdge: Seg[]; foam: Seg[] };

type P = [number, number];

export function buildWave(o: WaveSpec): WaveSegs {
  const R = rng(o.seed), gauss = () => (R() + R() + R() - 1.5) / 1.5;
  const wash: Seg[] = [], ink: Seg[] = [], foamEdge: Seg[] = [], foam: Seg[] = [];
  const span = o.x1 - o.x0, xa = o.x0 + span * .07, xb = o.x1 - span * .07, sea = o.yb - 3;
  const Hc = Math.min(o.height * .5, span * .26), cpos = o.dir > 0 ? .28 : .72, xc = xa + (xb - xa) * cpos;
  const Lb = Hc * 1.9; // back slope length
  const swellAmp = Math.min(9, o.height * .035), swellLen = Math.max(46, span / 11), phase = R() * 6.28;
  const wob = smooth(R, 3, 2);
  const envelope = (x: number) => Math.pow(Math.max(0, Math.sin(Math.PI * (x - xa) / (xb - xa))), .6);
  const crest = (x: number) => {
    const u = (x - xc) * o.dir;
    if (u <= 0 && u > -Lb) return Hc * Math.pow(.5 * (1 + Math.cos(Math.PI * u / Lb)), 1.25);
    return 0;
  };
  const swell = (x: number) => swellAmp * (.5 + .5 * Math.sin(2 * Math.PI * x / swellLen + phase)) * (1 + wob(x / span * 3) * .3);
  const surface = (x: number) => sea - (swell(x) + crest(x)) * envelope(x);
  const dot = (list: Seg[], x: number, y: number, r: number, a = 1) => list.push({ dot: [x, y, r, a] });
  /** A foam bubble: an ink rim with a paper-white center. */
  const bubble = (x: number, y: number, r: number) => { dot(foamEdge, x, y, r + .85); dot(foam, x, y, r); };
  const stroke = (pts: P[], width: number, seed: number, taper = true, nb = 6, dry = .82) => {
    const n = pts.length;
    const bp: BrushPt[] = pts.map(([x, y], i) => ({ x, y, p: taper ? Math.min(1, .25 + i / n * 6) * (1 - Math.pow(i / n, 3) * .7) : 1 }));
    ink.push(...buildBrush(bp, width, seed, dry, nb));
  };

  // ---- Fuji, small and pale on the horizon at the Japan end (painted first, so the sea overlaps its base)
  if (o.fuji !== null) {
    const xf = xa + (xb - xa) * o.fuji, fw = Hc * .95, fh = Hc * .46, base = sea - swellAmp * .5;
    const slope = (t: number, side: -1 | 1): P => { // a gently concave flank from the summit down to the shore
      const x = xf + side * (fw * .07 + (fw * .43) * t), y = base - fh + fh * Math.pow(t, .8);
      return [x, y];
    };
    const left = Array.from({ length: 24 }, (_, i) => slope(1 - i / 23, -1)), right = Array.from({ length: 24 }, (_, i) => slope(i / 23, 1));
    const body = [...left, ...right];
    for (let l = 0; l < 5; l++) wash.push({ path: body.map(([x, y]) => [x + gauss() * .6, y + gauss() * .6]), a: .1 });
    // snowcap with a ragged hem
    const cap: P[] = [];
    for (let i = 0; i <= 10; i++) cap.push(slope(i / 10 * .34, -1));
    cap.reverse();
    for (let i = 0; i <= 8; i++) { const x = xf - fw * .2 + fw * .4 * i / 8; cap.push([x, base - fh * .62 - (i % 2 ? fh * .1 : 0) - R() * 2]); }
    for (let i = 0; i <= 10; i++) cap.push(slope(i / 10 * .34, 1));
    foam.push({ path: cap, a: 1 });
    stroke(left, 1.6, o.seed + 3, false, 4); stroke(right, 1.6, o.seed + 4, false, 4);
  }

  // ---- the curling lip: a tightening spiral from the crest, forward and down into the barrel. The spiral is
  // the lip's OUTER edge, so it leaves the crest exactly where the back slope arrives; the lip's thickness grows
  // from nothing there, peeling off the surface instead of sitting on top of it.
  const top: P = [xc, surface(xc)], R0 = Hc * .46, thMax = Math.PI * 1.02;
  const C: P = [xc, top[1] + R0];
  const lipAt = (t: number) => { // t in 0–1 along the lip
    const th = thMax * t, r = R0 * (1 - .45 * t), phi = -Math.PI / 2 + o.dir * th;
    return { x: C[0] + r * Math.cos(phi), y: C[1] + r * Math.sin(phi), nx: Math.cos(phi), ny: Math.sin(phi), r };
  };
  const lipW = Hc * .12;
  /** Lip thickness at t: zero at the crest, full by ~20% along, thinning toward the tip. */
  const thick = (t: number) => lipW * 1.9 * Math.pow(Math.min(1, t / .2), .75) * Math.max(.08, 1 - Math.pow(t, 1.1) * .92);
  const lipT = Array.from({ length: 90 }, (_, i) => i / 89);
  const outer = lipT.map(t => { const q = lipAt(t); return [q.x, q.y] as P; });
  const inner = lipT.map(t => { const q = lipAt(t), w = thick(t); return [q.x - q.nx * w, q.y - q.ny * w] as P; });
  const curlEnd = inner[inner.length - 1], foot: P = [curlEnd[0] + o.dir * Hc * .05, sea];

  // ---- the water mass: one outline, layered translucent copies, like pigment pooling
  const xs: number[] = []; for (let x = xa; x <= xb; x += 3) xs.push(x); xs.push(xb);
  const ahead = (x: number) => (x - foot[0]) * o.dir >= 0, behind = (x: number) => (x - xc) * o.dir <= 0;
  const order = (a: number[]) => o.dir > 0 ? a : [...a].reverse();
  const backPts = order(xs.filter(behind)).map(x => [x, surface(x)] as P);
  const frontPts = order(xs.filter(ahead)).map(x => [x, surface(x)] as P);
  const mass: P[] = [...backPts, ...inner, foot, ...frontPts, [o.dir > 0 ? xb : xa, sea + 5], [o.dir > 0 ? xa : xb, sea + 5]];
  for (let l = 0; l < 9; l++) wash.push({ path: mass.map(([x, y]) => [x + gauss() * 1.1, y + gauss() * 1.1]), a: .1 });
  // the face, from the end of the curl down to the sea
  stroke([curlEnd, [(curlEnd[0] + foot[0]) / 2 + o.dir * 2, (curlEnd[1] + foot[1]) / 2], foot], 1.6, o.seed + 62, false, 4);

  // ---- the surface line, and striations that follow the water's shape
  stroke([...backPts, ...outer.slice(1)], 2.2, o.seed + 5, true, 8, .9);
  stroke(frontPts, 1.8, o.seed + 6, true, 6, .9);
  for (let k = 1; k <= 5; k++) {
    const from = xc - o.dir * Lb * (.95 - k * .08), to = xc - o.dir * Hc * (.04 + k * .05);
    const pts: P[] = [];
    for (let i = 0; i <= 40; i++) { const x = from + (to - from) * i / 40; const y = surface(x) + k * Math.max(5, Hc * .075); if (y < sea) pts.push([x, y]); }
    if (pts.length > 6) stroke(pts, 1.3, o.seed + 10 + k, true, 4, .7);
  }
  // swell lines across the open water
  for (let k = 0; k < 3; k++) {
    const y0 = sea - swellAmp * (.2 + k * .25), xs2 = xs.filter(x => Math.abs(x - xc) > Hc * (1.2 + k * .2) && envelope(x) > .3);
    let run: P[] = [];
    let px = -Infinity;
    for (const x of xs2) {
      const y = Math.min(sea, surface(x) + 5 + k * 4);
      if (x - px > 4 && run.length) { if (run.length > 8) stroke(run, 1.1, o.seed + 30 + k, true, 3, .6); run = []; }
      px = x;
      if (y < y0 + 10) run.push([x, y]); else if (run.length) { if (run.length > 8) stroke(run, 1.1, o.seed + 30 + k, true, 3, .6); run = []; }
    }
    if (run.length > 8) stroke(run, 1.1, o.seed + 40 + k, true, 3, .6);
  }

  // the lip's body in wash, then ink along its inner edge (the outer edge is the surface stroke above)
  const lipBody = [...outer, ...[...inner].reverse()];
  for (let l = 0; l < 4; l++) wash.push({ path: lipBody.map(([x, y]) => [x + gauss() * .5, y + gauss() * .5]), a: .16 });
  stroke(inner.slice(8), 1.4, o.seed + 61, true, 4, .7);
  for (let k = 1; k <= 2; k++) { // striations inside the lip, fanning out of the crest
    const pts: P[] = Array.from({ length: 50 }, (_, i) => { const t = .04 + i / 49 * .71, q = lipAt(t), off = thick(t) * (k * .33); return [q.x - q.nx * off, q.y - q.ny * off]; });
    stroke(pts, 1, o.seed + 70 + k, true, 3, .6);
  }

  // ---- foam claws reaching off the lip's outer edge
  const scale = Math.max(.7, Hc / 100);
  for (let c = 0; c < 11; c++) {
    const t = .1 + c * .075, q = lipAt(t);
    let x = q.x + q.nx, y = q.y + q.ny;
    // grow outward, bending forward the way the wave is breaking
    let ang = Math.atan2(q.ny, q.nx) + o.dir * (.5 + R() * .3);
    const fingers = 2 + (R() < .6 ? 1 : 0);
    for (let f = 0; f < fingers; f++) {
      let fx = x, fy = y, fa = ang + (f - (fingers - 1) / 2) * .55 * o.dir;
      const steps = 4 + Math.floor(R() * 3);
      for (let s = 0; s < steps; s++) {
        const r = (3.1 - s * .45) * scale * (.85 + R() * .3);
        if (r < .7) break;
        bubble(fx, fy, r);
        fx += Math.cos(fa) * r * 1.55; fy += Math.sin(fa) * r * 1.55; fa += o.dir * .32;
      }
    }
  }
  // foam along the back of the crest and on the swell tops
  for (let i = 0; i < 26; i++) {
    const x = xc - o.dir * Lb * (.05 + R() * .55), y = surface(x) - 1 - R() * 2;
    bubble(x + gauss() * 2, y, (.9 + R() * 1.4) * scale);
  }
  for (const x of xs) {
    if (Math.abs(x - xc) < Hc * 1.3 || envelope(x) < .4) continue;
    const ph = (2 * Math.PI * x / swellLen + phase) % (2 * Math.PI);
    if (Math.abs(ph - Math.PI / 2) < .09 && R() < .9) for (let k = 0; k < 4; k++) bubble(x + o.dir * k * 2.6, surface(x) - .5 + k * .6, 1.6 - k * .3);
  }
  // ---- spray thrown up ahead of the crest, toward the plane's path
  for (let i = 0; i < 46; i++) {
    const a = -Math.PI / 2 + o.dir * (R() * 1.3 - .2), d = R() * Hc * .75 + R() * 6;
    const x = top[0] + o.dir * R0 * .5 + Math.cos(a) * d, y = top[1] - 4 + Math.sin(a) * d * .8;
    if (y > sea - 4) continue;
    bubble(x, y, (.5 + Math.pow(R(), 2) * 1.8) * scale);
  }
  return { wash, ink, foamEdge, foam };
}
