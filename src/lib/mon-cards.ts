/**
 * The timeline's pattern cards and the hero's cloth: the About cards' hover, in the site's other patterns. The
 * tiles come from the CSS variables PatternDyes.astro emits, are drawn once into a sheet, and each frame shifts thin columns of that sheet
 * near the cursor, so a wave travels along these short boxes and the dye deepens where it lifts.
 */
import type { Card, Painter } from "./ink-cards";

const COL = 2, SIGMA = 120, SPEED = 2, SCALE = 2, PAD = 12;
/** The ripple's shape. Mutable so the blog's demo can put it on sliders. */
export const RIPPLE = { amp: 2.4, wave: 92 };
const sheets = new WeakMap<Card, HTMLCanvasElement>();
const tiles = new Map<string, Promise<HTMLImageElement>>();

function tile(src: string) {
  let t = tiles.get(src);
  if (!t) { const img = new Image(); img.src = src; t = img.decode().then(() => img); tiles.set(src, t); }
  return t;
}

/** Size the card's canvas, load its tiles, and let `compose` paint the sheet the wave will warp. */
function prepare(k: Card, repaint: () => void, names: string[], compose: (sc: CanvasRenderingContext2D, fills: CanvasPattern[], w: number, h: number, dpr: number) => void) {
  const W = k.el.clientWidth, H = k.el.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
  const root = getComputedStyle(document.documentElement);
  const urls = names.map(n => root.getPropertyValue(`--mon-${n}`).trim());
  const key = [W, H, dpr, getComputedStyle(k.el).getPropertyValue("--mon-base"), ...urls.map(u => u.length + u.slice(-60))].join();
  if (!W || !urls.every(Boolean) || k.key === key) return false;
  k.key = key; k.W = W; k.H = H;
  k.c.width = Math.round(W * dpr); k.c.height = Math.round(H * dpr);
  Promise.all(urls.map(u => tile(u.slice(5, -2)))).then(imgs => {
    if (k.key !== key) return;
    const sheet = document.createElement("canvas"), sc = sheet.getContext("2d")!;
    sheet.width = k.c.width; sheet.height = k.c.height + Math.ceil(PAD * 2 * dpr);
    compose(sc, imgs.map(img => {
      const piece = document.createElement("canvas"), s = SCALE * dpr;
      piece.width = Math.round(img.naturalWidth * s); piece.height = Math.round(img.naturalHeight * s);
      piece.getContext("2d")!.drawImage(img, 0, 0, piece.width, piece.height);
      return sc.createPattern(piece, "repeat")!;
    }), sheet.width, sheet.height, dpr);
    sheets.set(k, sheet);
    repaint();
    k.c.classList.add("ready");
  }).catch(() => { /* no tile: the card stays plain */ });
  return true;
}

function render(k: Card, time: number) {
  const sheet = sheets.get(k);
  if (!sheet) return;
  const ctx = k.c.getContext("2d")!, cw = k.c.width, dpr = cw / k.W, off = (sheet.height - k.c.height) / 2;
  const base = parseFloat(getComputedStyle(k.el).getPropertyValue("--mon-base")) || .22;
  ctx.clearRect(0, 0, cw, k.c.height);
  ctx.globalAlpha = base;
  const reach = SIGMA * 2.4, lo = k.amp > .01 ? Math.max(0, Math.round((k.px - reach) / COL) * COL * dpr) : cw, hi = k.amp > .01 ? Math.min(cw, Math.round((k.px + reach) / COL) * COL * dpr) : cw;
  // Far from the cursor the sheet is still, so it's drawn in two blocks; only the columns nearby move.
  if (lo > 0) ctx.drawImage(sheet, 0, off, lo, k.c.height, 0, 0, lo, k.c.height);
  if (hi < cw) ctx.drawImage(sheet, hi, off, cw - hi, k.c.height, hi, 0, cw - hi, k.c.height);
  const step = Math.round(COL * dpr), kw = 2 * Math.PI / RIPPLE.wave, wt = time / 1000 * SPEED * Math.PI;
  for (let x = lo; x < hi; x += step) {
    const d = Math.abs((x + step / 2) / dpr - k.px), f = Math.exp(-((d / SIGMA) ** 2)) * k.amp, wv = Math.sin(d * kw - wt);
    ctx.globalAlpha = base + base * .9 * f * (.5 + .5 * wv);
    ctx.drawImage(sheet, x, off + wv * f * RIPPLE.amp * dpr, Math.min(step, cw - x), k.c.height, x, 0, Math.min(step, cw - x), k.c.height);
  }
  ctx.globalAlpha = 1;
}

export const monPainter: Painter = {
  layout: (k, repaint) => prepare(k, repaint, [k.el.closest<HTMLElement>("[data-mon]")!.dataset.mon!], (sc, [fill], w, h) => {
    sc.fillStyle = fill; sc.fillRect(0, 0, w, h);
  }),
  render,
};

/**
 * A hero's cloth: patterns in flowing bands like a brocade, with a paper-colored seam between each. `flip` runs the
 * bands the other way, so About's cloth isn't a copy of Home's.
 */
function brocade(bands: string[], flip = false): Painter {
  return {
    layout: (k, repaint) => prepare(k, repaint, bands, (sc, fills, w, h, dpr) => {
      const tilt = h * .7, band = (h + tilt) / bands.length, step = 6 * dpr;
      const edge = (i: number, x: number) => {
        const t = flip ? 1 - x / w : x / w;
        return i * band - tilt * t + h * .07 * Math.sin(t * 7 + i * 1.7) + h * .025 * Math.sin(t * 17 + i * 2.9);
      };
      bands.forEach((_, i) => {
        const p = new Path2D();
        for (let x = 0; x <= w + step; x += step) p.lineTo(x, edge(i, x));
        for (let x = w + step; x >= 0; x -= step) p.lineTo(x, edge(i + 1, x));
        p.closePath();
        sc.fillStyle = fills[i]; sc.fill(p);
      });
      sc.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--paper").trim(); sc.lineWidth = 3 * dpr;
      for (let i = 1; i < bands.length; i++) {
        sc.beginPath();
        for (let x = 0; x <= w + step; x += step) sc.lineTo(x, edge(i, x));
        sc.stroke();
      }
    }),
    render,
  };
}

/** Home: every pattern on the site. */
export const brocadePainter = brocade(["learning", "education", "work", "marketing", "project", "teaching"]);
/** About: the five chapters of "The path here", in the order they happened. */
export const pathBrocadePainter = brocade(["marketing", "teaching", "learning", "work", "project"], true);
