/**
 * Spine ink: one long brush stroke down the timeline, revealed in step with the scroll.
 * The same ink-tip position drives the dot highlight, so a dot lights up exactly when the ink reaches it.
 */
import { buildBrush, type BrushPt } from "../ink/builders";
import { paint } from "../ink/paint";
import { rng, smooth } from "../ink/random";
import { reduceMotion } from "../motion";
import { inkMask } from "../spine-mask";
import { onThemeChange } from "../theme";
import { entryEl, visibleEntries } from "./data";

const tl = document.getElementById("timeline")!;
const spineInk = document.createElement("canvas"), inkTip = document.createElement("span");
spineInk.className = "spine-ink"; inkTip.className = "ink-tip";
spineInk.setAttribute("aria-hidden", "true"); inkTip.setAttribute("aria-hidden", "true");
tl.prepend(spineInk, inkTip);
const spineDrop = tl.querySelector(".spine-drop");

let spineLen = 0, lastTip = 0, lastTipTime = 0, tipRest = 0;
const NODE_OFFSET = 15; // node centre, measured from the top of its entry
const BOTTOM_GAP = 136; // the spine stops this far above the timeline's end
export const nodeY = (el: HTMLElement) => el.getBoundingClientRect().top - tl.getBoundingClientRect().top + NODE_OFFSET;

/** Where the ink tip would be at scroll position `sY`. */
export function tipAt(sY: number) {
  // Normally the tip rides 38% down the viewport; over the last stretch of scrolling it blends to the end of the
  // spine, so the final dots and the ink drop are reached exactly at the bottom of the page.
  const vh = innerHeight, max = document.documentElement.scrollHeight - vh, tlTop = tl.getBoundingClientRect().top + scrollY;
  const k = Math.min(1, Math.max(0, (sY - (max - vh * .8)) / (vh * .8))), f = k * k * (3 - 2 * k);
  const base = Math.min(spineLen, Math.max(0, vh * .38 - (tlTop - sY)));
  return base + (spineLen - base) * f;
}
export const tipPosition = () => tipAt(scrollY);

export function layoutSpineInk() {
  spineLen = Math.max(0, tl.clientHeight - BOTTOM_GAP);
  const W = 40, H = Math.ceil(spineLen), dpr = H * 2 > 30000 ? 1 : Math.min(2, devicePixelRatio || 1);
  spineInk.style.height = H + "px";
  spineInk.width = W * dpr; spineInk.height = Math.max(1, Math.round(H * dpr));
  const ctx = spineInk.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const R = rng(1234), wob = smooth(R, 3, 1), wob2 = smooth(R, 3, 6), press = smooth(R, 4, 2);
  const nodes = visibleEntries().map(e => nodeY(entryEl(e.id)));
  const pts: BrushPt[] = [];
  for (let y = 0; y <= H; y += 3) {
    // ink pools where the brush pauses at each moment in time, and thins between them
    let p = .5 + press(y / 420) * .14;
    for (const ny of nodes) { const d = (y - ny) / 18; if (Math.abs(d) < 4) p += Math.exp(-d * d) * .75; }
    pts.push({ x: W / 2 + wob(y / 900) * 1.4 + wob2(y / 140) * .45, y, p });
  }
  const segs = buildBrush(pts, 9, 77, 2, 12);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = ctx.strokeStyle = getComputedStyle(spineInk).getPropertyValue("--brush").trim() || "#1A2130";
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  paint(ctx, segs);
  updateSpineInk();
}

export function updateSpineInk() {
  const tip = tipPosition(), now = performance.now();
  const v = Math.abs(tip - lastTip) / Math.max(16, now - lastTipTime) * 16; // px per frame
  lastTip = tip; lastTipTime = now;
  inkMask(spineInk, tip);
  const stretch = reduceMotion ? 1 : 1 + Math.min(1.6, v / 18); // the wet tip elongates when you scroll fast
  inkTip.style.transform = `translateY(${tip}px)`;
  inkTip.style.setProperty("--stretch", String(stretch));
  clearTimeout(tipRest); tipRest = window.setTimeout(() => inkTip.style.setProperty("--stretch", "1"), 90);
  inkTip.style.opacity = tip > 4 && tip < spineLen - 4 ? "1" : "0";
  spineDrop?.classList.toggle("filled", tip >= spineLen - 1);
}

export function initSpine() {
  addEventListener("scroll", updateSpineInk, { passive: true });
  addEventListener("resize", layoutSpineInk);
  if ("ResizeObserver" in window) { let q = 0; new ResizeObserver(() => { cancelAnimationFrame(q); q = requestAnimationFrame(layoutSpineInk); }).observe(tl); }
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(layoutSpineInk);
  addEventListener("load", layoutSpineInk);
  onThemeChange(layoutSpineInk);
}
