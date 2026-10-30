/** Shared parts of the demo-store widgets: product art, money, tweened totals, and the fly-to-cart motion. */
import { reduceMotion } from "../motion";

export const money = (n: number) => "$" + n.toFixed(2);

const ART: Record<string, string> = {
  bag: '<path class="f" d="M14 15h20l2 25H12z"/><path class="l" d="M14 15l3-5h14l3 5"/><rect class="w" x="18" y="23" width="12" height="9" rx="1.5"/>',
  tin: '<rect class="f" x="14" y="12" width="20" height="28" rx="3"/><path class="l" d="M14 17h20"/><rect class="w" x="14" y="23" width="20" height="8"/>',
  mug: '<path class="f" d="M12 16h20v17a7 7 0 0 1-7 7h-6a7 7 0 0 1-7-7z"/><path class="l" d="M32 20h3a5 5 0 0 1 0 10h-3"/>',
  dripper: '<path class="f" d="M11 13h26l-8 18H19z"/><path class="l" d="M16 35h16M21 31v4M27 31v4M15 19h18"/>',
  spoon: '<ellipse class="f" cx="24" cy="15" rx="6" ry="8"/><path class="f" d="M22.6 22.5h2.8V41a1.4 1.4 0 0 1-2.8 0z"/>',
  tote: '<path class="f" d="M11 19h26l-2 21H13z"/><path class="l" d="M18 19v-4a6 6 0 0 1 12 0v4"/>',
  whisk: '<path class="f" d="M24 30C13 26 14 9 24 6c10 3 11 20 0 24z"/><path class="l" d="M24 30c-5-6-5-18 0-24M24 30c5-6 5-18 0-24"/><rect class="f" x="22" y="30" width="4" height="12" rx="1.5"/>',
  tumbler: '<path class="f" d="M16 12h16l-2 29H18z"/><path class="f" d="M15 8h18v4H15z"/><path class="l" d="M17 22h14"/>',
};
export const art = (kind: string, c: string) => `<svg class="art" viewBox="0 0 48 48" style="--c:${c}" aria-hidden="true"><rect class="t" width="48" height="48" rx="7"/>${ART[kind]}</svg>`;

export const ICO_CHECK = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.5l2.3 2.3L9.5 3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
export const ICO_X = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 2l6 6M8 2L2 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
export const ICO_CART = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4h2.5l2.2 11h10.6L20.5 7H7"/><circle cx="9.5" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/></svg>';

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
