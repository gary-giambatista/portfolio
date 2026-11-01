/**
 * A stroke is built once into an ordered list of segments, then painted. Painting the whole list gives the
 * finished stroke; painting a few more each frame gives the paint-in animation.
 */
type Pt = [number, number];
export type Seg =
  | { poly: Pt[]; a: number }
  | { line: [number, number, number, number]; w: number; a: number }
  | { path: number[][]; a: number }
  | { erase: [number, number, number, number] }
  | { dot: [number, number, number, number]; stretch?: number; ang?: number }
  | { shape: [number, number, number] };

export function paint(ctx: CanvasRenderingContext2D, segs: Seg[], from = 0, to = segs.length) {
  for (let i = from; i < to; i++) {
    const s = segs[i];
    ctx.globalAlpha = "a" in s ? s.a : 1;
    if ("poly" in s) {
      ctx.beginPath(); ctx.moveTo(...s.poly[0]); for (let k = 1; k < 4; k++) ctx.lineTo(...s.poly[k]); ctx.closePath(); ctx.fill();
    } else if ("line" in s) {
      ctx.lineWidth = s.w; ctx.beginPath(); ctx.moveTo(s.line[0], s.line[1]); ctx.lineTo(s.line[2], s.line[3]); ctx.stroke();
    } else if ("path" in s) {
      ctx.beginPath(); s.path.forEach(([x, y], k) => k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill();
    } else if ("erase" in s) { // paper granulation
      const [x, y, r, a] = s.erase;
      ctx.save(); ctx.globalCompositeOperation = "destination-out"; ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.29); ctx.fill(); ctx.restore();
    } else if ("dot" in s) {
      const [x, y, r, a] = s.dot;
      ctx.globalAlpha = a; ctx.beginPath(); ctx.ellipse(x, y, r * (s.stretch || 1), r, s.ang || 0, 0, 6.29); ctx.fill();
    } else if ("shape" in s) { // a drip: the spine's line swells into a drop
      const [x, y, r] = s.shape;
      ctx.beginPath(); ctx.moveTo(x - 1, 0); ctx.bezierCurveTo(x - 1, y * .55, x - r, y - r * 1.4, x - r, y); ctx.arc(x, y, r, Math.PI, 0, true);
      ctx.bezierCurveTo(x + r, y - r * 1.4, x + 1, y * .55, x + 1, 0); ctx.closePath(); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

/** Size a canvas to its CSS box at up to 2× device pixels, and return a context in CSS pixels. */
export function fitCanvas(c: HTMLCanvasElement): [CanvasRenderingContext2D, number, number] {
  const dpr = Math.min(2, devicePixelRatio || 1), w = c.clientWidth, h = c.clientHeight;
  c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
  const ctx = c.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return [ctx, w, h];
}

/** Paint segments progressively over `dur` ms with an ease-out, after `delay`. Returns a cancel function. */
export function paintIn(ctx: CanvasRenderingContext2D, segs: Seg[], dur: number, delay = 0, onFrame?: () => void): () => void {
  const t0 = performance.now() + delay;
  let drawn = 0, raf = 0;
  const step = (now: number) => {
    const t = Math.min(1, Math.max(0, (now - t0) / dur)), k = Math.min(segs.length, Math.floor(segs.length * (1 - Math.pow(1 - t, 2.2))));
    onFrame?.();
    paint(ctx, segs, drawn, k); drawn = Math.max(drawn, k);
    if (t < 1) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}
