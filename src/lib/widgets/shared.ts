/** Browser-side motion shared by the widget demos: tweened totals and the fly-to-cart animation. */
import { reduceMotion } from "../motion";
import { money } from "./catalog";

export function tweenNumber(el: HTMLElement, to: number, fmt = money) {
  const from = +(el.dataset.v || to); el.dataset.v = String(to);
  if (reduceMotion || from === to) { el.textContent = fmt(to); return; }
  const t0 = performance.now(), d = 420;
  const step = (now: number) => { const t = Math.min(1, (now - t0) / d), e = 1 - Math.pow(1 - t, 3); el.textContent = fmt(from + (to - from) * e); if (t < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

/** Flies a copy of an element's artwork to a target, the way an item drops into a bundle. */
export function fly(fromEl: Element | null | undefined, toEl: Element | null | undefined, done: () => void) {
  if (reduceMotion || !fromEl || !toEl) return done();
  const a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
  if (!a.width || !b.width) return done();
  const ghost = fromEl.cloneNode(true) as HTMLElement;
  ghost.classList.add("rw-fly");
  Object.assign(ghost.style, { left: a.left + "px", top: a.top + "px", width: a.width + "px", height: a.height + "px" });
  document.body.appendChild(ghost);
  const dx = b.left - a.left, dy = b.top - a.top, s = b.width / a.width;
  ghost.animate([{ transform: "none" }, { transform: `translate(${dx * .5}px, ${dy * .5 - 40}px) scale(${(1 + s) / 2}) rotate(-6deg)`, offset: .5 }, { transform: `translate(${dx}px, ${dy}px) scale(${s})` }],
    { duration: 520, easing: "cubic-bezier(.45,.05,.3,1)" }).onfinish = () => { ghost.remove(); done(); };
}
