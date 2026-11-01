/**
 * The nav's second life: once it has scrolled off the top, the same links become a small seal floating at the left,
 * dyed in the current entry's pattern (the two layers crossfade). It opens on hover, on a tap, or with the keyboard
 * through its button, in the same expanding circle as the theme change.
 */
const nav = document.querySelector<HTMLElement>(".nav")!;
const btn = nav.querySelector<HTMLButtonElement>(".seal")!;
const items = nav.querySelector<HTMLElement>(".nav-items")!;
const layers = [...btn.querySelectorAll<HTMLElement>(".seal-dye")];
let front = 0, closeTimer = 0;

export function dyeSeal(mon: string | undefined) {
  if (!mon || layers[front].dataset.mon === mon) return;
  const next = layers[1 - front];
  next.dataset.mon = mon;
  next.classList.add("on"); layers[front].classList.remove("on");
  front = 1 - front;
}

function setOpen(open: boolean) {
  clearTimeout(closeTimer);
  nav.classList.toggle("open", open);
  btn.setAttribute("aria-expanded", String(open));
}

export function initNavIsland() {
  new IntersectionObserver(([e]) => {
    nav.classList.toggle("island", !e.isIntersecting);
    if (e.isIntersecting) setOpen(false);
  }).observe(nav);

  const shell = btn.parentElement!;
  shell.addEventListener("pointerenter", e => { if (e.pointerType === "mouse" && nav.classList.contains("island")) setOpen(true); });
  // The theme change's overlay reads as the pointer leaving; it hasn't.
  shell.addEventListener("pointerleave", e => { if (e.pointerType === "mouse" && !document.documentElement.classList.contains("vt-theme")) closeTimer = window.setTimeout(() => setOpen(false), 260); });
  // A mouse has already opened it by hovering, so only touch and the keyboard toggle it here.
  btn.addEventListener("click", e => { if ((e as PointerEvent).pointerType !== "mouse") setOpen(!nav.classList.contains("open")); });
  items.addEventListener("click", e => { if ((e.target as Element).closest("a, .cmdk-btn")) setOpen(false); });
  document.addEventListener("pointerdown", e => { if (!shell.contains(e.target as Node)) setOpen(false); });
  shell.addEventListener("focusout", e => { const to = (e as FocusEvent).relatedTarget as Node | null; if (to && !shell.contains(to)) setOpen(false); });
  shell.addEventListener("keydown", e => { if (e.key === "Escape" && nav.classList.contains("open")) { setOpen(false); btn.focus(); } });
}
