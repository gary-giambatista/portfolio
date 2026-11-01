/**
 * The timeline's pattern cards: the About cards' hover, in the entry's own pattern. The tile comes from the CSS
 * variables PatternDyes.astro emits, is drawn once into a sheet, and each frame shifts thin columns of that sheet
 * near the cursor, so a wave travels along these short boxes and the dye deepens where it lifts.
 */
import type { Card, Painter } from "../ink-cards";

const COL = 2, AMP = 2.4, SIGMA = 120, WAVE = 92, SPEED = 2, SCALE = 2;
const sheets = new WeakMap<Card, HTMLCanvasElement>();
const tiles = new Map<string, Promise<HTMLImageElement>>();

function tile(src: string) {
  let t = tiles.get(src);
  if (!t) { const img = new Image(); img.src = src; t = img.decode().then(() => img); tiles.set(src, t); }
  return t;
}

export const monPainter: Painter = {
  layout(k, repaint) {
    const W = k.el.clientWidth, H = k.el.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
    const name = k.el.closest<HTMLElement>("[data-mon]")!.dataset.mon;
    const url = getComputedStyle(document.documentElement).getPropertyValue(`--mon-${name}`).trim();
    const key = [W, H, dpr, url.length, getComputedStyle(k.el).getPropertyValue("--mon-base"), url.slice(-60)].join();
    if (!W || !url || k.key === key) return false;
    k.key = key; k.W = W; k.H = H;
    k.c.width = Math.round(W * dpr); k.c.height = Math.round(H * dpr);
    const src = url.slice(5, -2);
    tile(src).then(img => {
      if (k.key !== key) return;
      const piece = document.createElement("canvas"), s = SCALE * dpr;
      piece.width = Math.round(img.naturalWidth * s); piece.height = Math.round(img.naturalHeight * s);
      piece.getContext("2d")!.drawImage(img, 0, 0, piece.width, piece.height);
      const sheet = document.createElement("canvas"), sc = sheet.getContext("2d")!;
      sheet.width = k.c.width; sheet.height = k.c.height + Math.ceil(AMP * 2 * dpr);
      sc.fillStyle = sc.createPattern(piece, "repeat")!; sc.fillRect(0, 0, sheet.width, sheet.height);
      sheets.set(k, sheet);
      repaint();
    }).catch(() => { /* no tile: the card stays plain */ });
    return true;
  },
  render(k, time) {
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
    const step = Math.round(COL * dpr), kw = 2 * Math.PI / WAVE, wt = time / 1000 * SPEED * Math.PI;
    for (let x = lo; x < hi; x += step) {
      const d = Math.abs((x + step / 2) / dpr - k.px), f = Math.exp(-((d / SIGMA) ** 2)) * k.amp, wv = Math.sin(d * kw - wt);
      ctx.globalAlpha = base + base * .9 * f * (.5 + .5 * wv);
      ctx.drawImage(sheet, x, off + wv * f * AMP * dpr, Math.min(step, cw - x), k.c.height, x, 0, Math.min(step, cw - x), k.c.height);
    }
    ctx.globalAlpha = 1;
  },
};
