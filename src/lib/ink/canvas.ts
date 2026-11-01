/**
 * Paints every <canvas class="ink" data-ink="…"> on the page.
 *
 *   data-ink    which stroke to build (see BUILDERS)
 *   data-seed   fixes the randomness
 *   data-color  the CSS custom property for the ink (default --brush)
 *   data-dur    paint-in duration in ms (0 = draw at once)
 *   data-delay  paint-in delay in ms
 *   data-start  "load" (default: once fonts are ready) or "visible" (when a quarter of it scrolls into view)
 *
 * Strokes rebuild at the new size on resize and in the new ink on a theme change, without animating.
 */
import { reduceMotion } from "../motion";
import { onThemeChange } from "../theme";
import { brushAlong, buildDotSwash, buildDrop, buildEnso, buildOpenEnso, buildSplat, buildSwash, buildWash, ensoPath } from "./builders";
import { fitCanvas, paint, paintIn, type Seg } from "./paint";
import { rng, smooth } from "./random";

type Builder = (c: HTMLCanvasElement, w: number, h: number, seed: number) => Seg[];

/** The About page's brush line through each station dot, pooling ink where it pauses. */
const stationPath: Builder = (c) => {
  const host = c.getBoundingClientRect();
  const dots = [...c.parentElement!.querySelectorAll(".dot")].map(d => { const r = d.getBoundingClientRect(); return [r.left + r.width / 2 - host.left, r.top + r.height / 2 - host.top]; });
  if (dots.length < 2) return [];
  const lens = dots.slice(1).map((d, i) => Math.hypot(d[0] - dots[i][0], d[1] - dots[i][1])), total = lens.reduce((a, b) => a + b, 0);
  const cum = lens.reduce((a, l) => (a.push(a[a.length - 1] + l), a), [0]);
  const R = rng(5), wob = smooth(R, 3, 2);
  const pt = (t: number): [number, number] => {
    const d = t * total;
    let i = cum.findIndex((_, k) => k < lens.length && d <= cum[k + 1]);
    if (i < 0) i = lens.length - 1;
    const f = (d - cum[i]) / lens[i], [x0, y0] = dots[i], [x1, y1] = dots[i + 1];
    const nx = -(y1 - y0) / lens[i], ny = (x1 - x0) / lens[i], wv = wob(t * 3) * 3;
    return [x0 + (x1 - x0) * f + nx * wv, y0 + (y1 - y0) * f + ny * wv];
  };
  return brushAlong(pt, total, 7, 5, { dry: .93, pools: cum.map(c2 => c2 / total) });
};

const BUILDERS: Record<string, Builder> = {
  enso: (_, w, h, seed) => buildEnso(w, h, seed),
  wash: (_, w, h, seed) => buildWash(w, h, seed),
  swash: (_, w, h, seed) => buildSwash(w, h, seed),
  splat: (_, w, h, seed) => buildSplat(w / 2, h / 2, Math.min(w, h) * .14, seed),
  drop: (_, w, h, seed) => buildDrop(w, h, seed),
  "stroke-enso": (_, w, h, seed) => { const [pt, len] = ensoPath(w, h, seed, .92); return brushAlong(pt, len, Math.min(w, h) * .085, seed, { dry: .68 }); },
  "stroke-swash": (_, w, h, seed) => brushAlong(t => [6 + t * (w - 12), h * .58 - Math.sin(t * Math.PI) * h * .12], w, h * .82, seed, { dry: .86 }),
  "quiet-enso": (_, w, h, seed) => { const [pt, len] = ensoPath(w, h, seed, .8); return brushAlong(pt, len, Math.min(w, h) * .032, seed, { dry: .68 }); },
  "ring-enso": (_, w, h, seed) => { const [pt, len] = ensoPath(w, h, seed, .95); return brushAlong(pt, len, Math.min(w, h) * .085, seed, { dry: .74 }); },
  "stroke-path": stationPath,
  "open-enso": (_, w, h, seed) => buildOpenEnso(w, h, seed),
  "dot-swash": (_, w, h, seed) => buildDotSwash(w, h, seed),
};

type Item = { c: HTMLCanvasElement; started: boolean; cancel?: () => void };

function draw(item: Item, animate: boolean) {
  const { c } = item, d = c.dataset;
  item.cancel?.();
  const [ctx, w, h] = fitCanvas(c);
  const segs = BUILDERS[d.ink!]?.(c, w, h, +(d.seed || 7)) ?? [];
  ctx.fillStyle = ctx.strokeStyle = getComputedStyle(c).getPropertyValue(d.color || "--brush").trim() || "#1A2130";
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  const dur = +(d.dur || 0);
  if (!animate || reduceMotion || !dur) { paint(ctx, segs); return; }
  item.cancel = paintIn(ctx, segs, dur, +(d.delay || 0));
}

export function initInk(root: ParentNode = document) {
  const items: Item[] = [...root.querySelectorAll<HTMLCanvasElement>("canvas.ink[data-ink]")].map(c => ({ c, started: false }));
  const start = (item: Item) => { item.started = true; draw(item, true); };
  const io = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => {
    const item = items.find(i => i.c === e.target);
    if (e.isIntersecting && item && !item.started) { io!.unobserve(e.target); start(item); }
  }), { threshold: .25 }) : null;

  // Washes below the fold fade in as they arrive.
  if ("IntersectionObserver" in window && !reduceMotion) {
    const waitIo = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.remove("wait"); waitIo.unobserve(e.target); } }), { rootMargin: "0px 0px -10% 0px" });
    items.forEach(({ c }) => { if (c.classList.contains("wash") && c.getBoundingClientRect().top > innerHeight) { c.classList.add("wait"); waitIo.observe(c); } });
  }

  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => items.forEach(item => {
    if (item.c.dataset.start === "visible" && io) io.observe(item.c); else start(item);
  }));
  const redraw = () => items.forEach(item => { if (item.started) draw(item, false); });
  let rz = 0;
  addEventListener("resize", () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(redraw); });
  onThemeChange(redraw);
}
