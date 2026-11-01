/**
 * Ink cards: each card carries a seigaiha (overlapping wave-scale) pattern drawn onto a canvas. At rest only a
 * faded patch in the top-right corner shows. When the pointer enters, ink spreads from that point until the
 * pattern fills the card (a CSS mask), and ripples run out from the cursor through the scales: each one is
 * nudged along the ripple and its ink deepens where the water lifts. The pattern is redrawn per frame only
 * while a card is hovered or still settling, then it stops.
 */
import { reduceMotion } from "./motion";
import { onThemeChange } from "./theme";
import { rng } from "./ink/random";

type Ring = { r: number; a: number; w: number; t0: number; t1: number };
type Scale = { x: number; y: number; rings: Ring[] };
/** What a card draws: `layout` prepares it (true if anything changed), `render` draws one frame. */
export type Painter = { layout(k: Card, repaint: () => void): boolean; render(k: Card, time: number): void };
export type Card = {
  el: HTMLElement; c: HTMLCanvasElement; key?: string; scales: Scale[];
  W: number; H: number; line: number[]; deep: number[];
  px: number; py: number; amp: number; target: number; raf: number; last: number;
};

const R0 = 22, RINGS = 4;
/** Resting lines are drawn at this strength, leaving headroom for the ripple to lift them toward full ink. */
const BASE = .55;
const RIPPLE = { amp: 3.4, sigma: 120, wave: 58, speed: 2 };

const rgb = (hex: string) => {
  const m = hex.trim().match(/^#([0-9a-f]{6})$/i);
  return m ? [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16)) : [128, 140, 170];
};

/** Lay out the scales once per size, with their brush irregularities fixed so frames don't flicker. */
function layout(k: Card) {
  const W = k.el.clientWidth, H = k.el.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
  const css = getComputedStyle(k.el);
  const key = [W, H, dpr, css.getPropertyValue("--sg-line"), css.getPropertyValue("--sg-deep")].join();
  if (!W || k.key === key) return false;
  k.key = key; k.W = W; k.H = H;
  k.line = rgb(css.getPropertyValue("--sg-line")); k.deep = rgb(css.getPropertyValue("--sg-deep"));
  k.c.width = Math.round(W * dpr); k.c.height = Math.round(H * dpr);
  k.c.getContext("2d")!.setTransform(dpr, 0, 0, dpr, 0, 0);
  const R = rng(W * 7 + H), scales: Scale[] = [];
  for (let row = 0, y = -R0 * .5; y < H + R0; row++, y += R0 * .5) {
    for (let x = (row % 2 ? R0 : 0) - R0; x < W + R0 * 2; x += R0 * 2) {
      const rings: Ring[] = [];
      for (let i = 0; i < RINGS; i++) {
        const r = R0 * (1 - i / RINGS) - .6 + (R() - .5) * .6;
        // a brush-like arc: slightly uneven weight, and it doesn't always reach both ends
        if (r >= 2) rings.push({ r, a: .55 + R() * .45, w: (i ? 1 : 1.35) * (.85 + R() * .3), t0: R() * .08, t1: R() * .08 });
      }
      scales.push({ x, y, rings });
    }
  }
  k.scales = scales;
  return true;
}

/** Draw the pattern; with amp > 0, ripples spread from the pointer through the scales. */
function render(k: Card, time: number) {
  const ctx = k.c.getContext("2d")!, { amp, px, py, line, deep } = k;
  const kw = 2 * Math.PI / RIPPLE.wave, wt = time / 1000 * RIPPLE.speed * Math.PI;
  ctx.clearRect(0, 0, k.W, k.H); ctx.lineCap = "round";
  // Rows from the top down; each scale first erases what's behind it, so it overlaps the row above.
  for (const s of k.scales) {
    let x = s.x, y = s.y, lift = 0;
    if (amp > .01) {
      const dx = s.x - px, dy = s.y - py, d = Math.hypot(dx, dy) || 1;
      const f = Math.exp(-((d / RIPPLE.sigma) ** 2)) * amp, wv = Math.sin(d * kw - wt);
      x += dx / d * wv * f * RIPPLE.amp; y += dy / d * wv * f * RIPPLE.amp - Math.max(0, wv) * f * 1.2;
      lift = f * (.55 + .45 * wv);
    }
    ctx.globalCompositeOperation = "destination-out"; ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(x, y, R0 - .2, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    const m = Math.min(1, Math.max(0, lift));
    ctx.strokeStyle = `rgb(${line.map((v, i) => Math.round(v + (deep[i] - v) * m)).join(" ")})`;
    for (const g of s.rings) {
      ctx.globalAlpha = g.a * BASE + (1 - g.a * BASE) * m; ctx.lineWidth = g.w * (1 + m * .3);
      ctx.beginPath(); ctx.arc(x, y, g.r * (1 + m * .04), Math.PI + g.t0, -g.t1); ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

const seigaihaPainter: Painter = { layout, render };

export function initInkCards(els: NodeListOf<HTMLElement>, painter: Painter = seigaihaPainter) {
  const cards: Card[] = [...els].map(el => ({
    el, c: el.querySelector<HTMLCanvasElement>(".sg")!, scales: [], W: 0, H: 0, line: [], deep: [],
    px: -999, py: -999, amp: 0, target: 0, raf: 0, last: 0,
  }));
  const byEl = new Map(cards.map(k => [k.el, k]));

  function paint(k: Card) { const repaint = () => { if (!k.raf) painter.render(k, performance.now()); }; if (painter.layout(k, repaint) || !k.raf) repaint(); }

  /** Run frames while the card is hovered or its ripples are still dying down. */
  function animate(k: Card) {
    if (reduceMotion || k.raf) return;
    k.last = performance.now();
    const frame = (t: number) => {
      const dt = Math.min(.05, (t - k.last) / 1000); k.last = t;
      k.amp += (k.target - k.amp) * Math.min(1, dt * (k.target ? 3 : 2.2));
      painter.render(k, t);
      if (k.target || k.amp > .01) k.raf = requestAnimationFrame(frame);
      else { k.raf = 0; k.amp = 0; painter.render(k, t); }
    };
    k.raf = requestAnimationFrame(frame);
  }

  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) paint(byEl.get(e.target as HTMLElement)!); }), { rootMargin: "400px 0px" });
  const ro = new ResizeObserver(es => es.forEach(e => { const k = byEl.get(e.target as HTMLElement)!; if (k.key) paint(k); }));

  const local = (k: Card, e: PointerEvent) => {
    const r = k.el.getBoundingClientRect();
    k.px = e.clientX - r.left; k.py = e.clientY - r.top;
  };
  const enter = (k: Card, e: PointerEvent) => {
    local(k, e);
    k.el.style.setProperty("--mx", `${k.px}px`); k.el.style.setProperty("--my", `${k.py}px`);
    k.el.classList.add("bloom"); paint(k); k.target = 1; animate(k);
  };
  const leave = (k: Card) => { k.el.classList.remove("bloom"); k.target = 0; };
  let tapped: Card | null = null, tapTimer = 0;
  cards.forEach(k => {
    io.observe(k.el); ro.observe(k.el);
    k.el.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") enter(k, e); });
    k.el.addEventListener("pointermove", e => { if (e.pointerType === "mouse") local(k, e); });
    k.el.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") leave(k); });
    // touch and pen: a tap blooms the card and sends one set of ripples out; tapping elsewhere lets it ebb
    k.el.addEventListener("pointerdown", e => {
      if (e.pointerType === "mouse") return;
      if (tapped && tapped !== k) leave(tapped);
      enter(k, e); tapped = k;
      clearTimeout(tapTimer); tapTimer = window.setTimeout(() => { k.target = 0; }, 1600);
    });
  });
  document.addEventListener("pointerdown", e => { if (tapped && !tapped.el.contains(e.target as Node)) { leave(tapped); tapped = null; } });
  onThemeChange(() => cards.forEach(k => k.key && paint(k)));
}
