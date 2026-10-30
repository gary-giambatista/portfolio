/**
 * One shared annotation for anything with data-tip / data-tip-sub (plus -ja variants). Hover or focus shows it,
 * Escape hides it, and on touch screens you tap to open and tap anywhere else to close.
 */
import { esc } from "./esc";
import { isJa } from "./i18n";
import { placePopover } from "./placement";

let pop: HTMLElement | null = null, anchor: HTMLElement | null = null, touch = false, minTop = 70;

function place() {
  if (!pop || !anchor) return;
  const p = placePopover(anchor.getBoundingClientRect(), pop.offsetWidth, pop.offsetHeight, innerWidth, minTop);
  pop.style.left = p.x + "px";
  pop.style.top = p.top + "px";
  pop.style.setProperty("--ax", p.ax + "px");
  pop.classList.toggle("below", p.below);
}

function show(el: HTMLElement) {
  if (!pop || anchor === el) return;
  hideTip();
  anchor = el;
  const ja = isJa(), d = el.dataset, title = (ja && d.tipJa) || d.tip, sub = (ja && d.tipSubJa) || d.tipSub;
  pop.innerHTML = `<b>${esc(title)}</b>${sub ? `<span>${esc(sub)}</span>` : ""}`;
  if (!el.hasAttribute("aria-label") || d.tipDescribe) el.setAttribute("aria-describedby", "pop");
  place();
  pop.classList.add("show");
}

export function hideTip() {
  if (!pop || !anchor) return;
  anchor.removeAttribute("aria-describedby");
  anchor = null;
  pop.classList.remove("show");
}

/** `top` is how close to the top of the window a popover may sit before it flips below (clears the sticky nav). */
export function initPopover({ top = 70 } = {}) {
  if (pop) return;
  minTop = top;
  pop = document.createElement("div");
  pop.className = "pop"; pop.id = "pop"; pop.setAttribute("role", "tooltip");
  document.body.appendChild(pop);
  const tipOf = (t: EventTarget | null) => (t instanceof Element ? t.closest<HTMLElement>("[data-tip]") : null);
  document.addEventListener("pointerover", e => { touch = e.pointerType === "touch"; const el = tipOf(e.target); if (el) show(el); });
  document.addEventListener("pointerout", e => {
    if (touch || !anchor) return;
    if (!e.relatedTarget || !anchor.contains(e.relatedTarget as Node)) hideTip();
  });
  document.addEventListener("pointerdown", e => { if (anchor && !anchor.contains(e.target as Node)) hideTip(); });
  document.addEventListener("focusin", e => { const el = tipOf(e.target); el ? show(el) : hideTip(); });
  document.addEventListener("focusout", e => { if (anchor && !anchor.contains(e.relatedTarget as Node)) hideTip(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") hideTip(); });
  addEventListener("scroll", () => { touch ? hideTip() : place(); }, { passive: true });
  addEventListener("resize", hideTip);
}
