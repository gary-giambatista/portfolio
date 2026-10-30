/**
 * Ink cards: each card carries a seigaiha (overlapping wave-scale) pattern, drawn once onto a canvas. At rest
 * only a faded patch in the top-right corner shows. When the pointer enters, a ripple of ink sweeps out from
 * that point and off the card, then a soft lantern of pattern follows the cursor. The masks and radii live in
 * CSS, so pointer moves only update custom properties.
 */
import { onThemeChange } from "./theme";
import { rng } from "./ink/random";

export function initInkCards(cards: NodeListOf<HTMLElement>) {
  const painted = new WeakMap<HTMLElement, string>();

  function draw(card: HTMLElement) {
    const c = card.querySelector<HTMLCanvasElement>(".sg")!;
    const W = card.clientWidth, H = card.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
    const color = getComputedStyle(card).getPropertyValue("--sg-line").trim();
    const key = [W, H, dpr, color].join();
    if (!W || painted.get(card) === key) return;
    painted.set(card, key);
    c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
    const ctx = c.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.strokeStyle = color; ctx.lineCap = "round";
    const R = rng(W * 7 + H), r0 = 22, rings = 4, dx = r0 * 2, dy = r0 * .5;
    // Rows from the top down; each scale first erases what's behind it, so it overlaps the row above.
    for (let row = 0, y = -r0 * .5; y < H + r0; row++, y += dy) {
      for (let x = (row % 2 ? r0 : 0) - r0; x < W + r0 * 2; x += dx) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath(); ctx.arc(x, y, r0 - .2, Math.PI, 0); ctx.closePath(); ctx.fill();
        ctx.globalCompositeOperation = "source-over";
        for (let k = 0; k < rings; k++) {
          const r = r0 * (1 - k / rings) - .6 + (R() - .5) * .6;
          if (r < 2) continue;
          // a brush-like arc: slightly uneven weight, and it doesn't always reach both ends
          ctx.globalAlpha = .55 + R() * .45;
          ctx.lineWidth = (k ? 1 : 1.35) * (.85 + R() * .3);
          ctx.beginPath(); ctx.arc(x, y, r, Math.PI + R() * .08, -R() * .08); ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) draw(e.target as HTMLElement); }), { rootMargin: "400px 0px" });
  const ro = new ResizeObserver(es => es.forEach(e => painted.has(e.target as HTMLElement) && draw(e.target as HTMLElement)));

  const at = (card: HTMLElement, e: PointerEvent) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`); card.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  const lamp = (card: HTMLElement, e: PointerEvent) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty("--lx", `${e.clientX - r.left}px`); card.style.setProperty("--ly", `${e.clientY - r.top}px`);
  };
  let tapped: HTMLElement | null = null;
  cards.forEach(card => {
    io.observe(card); ro.observe(card);
    card.addEventListener("pointerenter", e => { if (e.pointerType !== "mouse") return; at(card, e); lamp(card, e); card.classList.add("bloom"); });
    card.addEventListener("pointermove", e => { if (e.pointerType === "mouse") lamp(card, e); });
    card.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") card.classList.remove("bloom"); });
    // touch and pen: a tap blooms the card, and the next tap elsewhere lets it ebb
    card.addEventListener("pointerdown", e => {
      if (e.pointerType === "mouse") return;
      at(card, e); lamp(card, e);
      if (tapped && tapped !== card) tapped.classList.remove("bloom");
      card.classList.add("bloom"); tapped = card;
    });
  });
  document.addEventListener("pointerdown", e => { if (tapped && !tapped.contains(e.target as Node)) { tapped.classList.remove("bloom"); tapped = null; } });
  onThemeChange(() => cards.forEach(c => painted.has(c) && draw(c)));
}
