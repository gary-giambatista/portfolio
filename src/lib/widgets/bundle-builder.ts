/**
 * Bundle Builder demo: pick 3, filters, tiered discounts, subscribe & save. A pretend coffee and tea shop.
 * The markup ships in the page (src/components/widgets/BundleBuilder.astro); this only updates what changes,
 * so cards never re-render and nothing shifts.
 */
import { art, BUNDLE_MAX, bundleTier, ICO_CHECK, ICO_X, money, PRODUCTS, SUBSCRIBE_OFF } from "./catalog";
import { fly, tweenNumber } from "./shared";

const product = (id: string) => PRODUCTS.find(p => p.id === id)!;

export function initBundleBuilder(root: HTMLElement | null) {
  if (!root) return;
  let sel: string[] = [], sub = false, busy = false, cartCount = 0;
  const q = <T extends Element = HTMLElement>(s: string) => root.querySelector<T>(s)!;
  const cards = [...root.querySelectorAll<HTMLButtonElement>(".rw-card")];
  const slots = [...root.querySelectorAll<HTMLElement>(".rw-slot")];
  const pill = q(".rw-pill"), cta = q<HTMLButtonElement>(".rw-cta"), live = q(".rw-sr"), badge = q(".rw-cart b");

  /** Selection state on the cards: pressed, and disabled once the kit is full. */
  function syncCards() {
    const full = sel.length >= BUNDLE_MAX;
    for (const c of cards) {
      const on = sel.includes(c.dataset.id!);
      c.setAttribute("aria-pressed", String(on));
      c.disabled = !on && full;
    }
  }
  /** Fill the tray slots from `from` onward (a removal shifts the later items left). */
  function syncTray(from = 0, hideIdx = -1) {
    for (let i = from; i < BUNDLE_MAX; i++) {
      const p = sel[i] ? product(sel[i]) : null, slot = slots[i];
      if ((slot.dataset.item || "") === (p?.id || "")) continue;
      slot.dataset.item = p?.id || "";
      slot.classList.toggle("on", !!p);
      slot.innerHTML = p ? `${art(p.art, p.c)}<button type="button" class="x" data-rm="${p.id}" aria-label="Remove ${p.name}">${ICO_X}</button>` : String(i + 1);
    }
    if (hideIdx >= 0) (slots[hideIdx].querySelector(".art") as SVGElement).style.opacity = "0";
  }
  function syncTotals() {
    const n = sel.length, base = sel.reduce((a, id) => a + product(id).price, 0);
    const off = bundleTier(n) + (sub && n >= 2 ? SUBSCRIBE_OFF : 0), total = base * (1 - off);
    pill.textContent = n === 0 ? "Pick 3 · save up to 15%" : n === 1 ? "Add 1 more to save 10%" : n === 2 ? "Add 1 more to save 15%" : "Kit complete · 15% off";
    pill.classList.toggle("full", n === BUNDLE_MAX);
    tweenNumber(q(".rw-total .now"), total);
    q(".rw-total s").textContent = off ? money(base) : "";
    q(".rw-total .save").textContent = off ? `You save ${money(base - total)}` : "";
    if (!busy) { cta.disabled = n < 2; cta.textContent = n < 2 ? `Pick ${2 - n} more to add` : `Add kit to cart · ${money(total)}`; }
  }

  function toggle(id: string, card?: Element) {
    const i = sel.indexOf(id);
    if (i >= 0) {
      sel.splice(i, 1);
      live.textContent = `Removed ${product(id).name}.`;
      syncCards(); syncTray(i); syncTotals();
      return;
    }
    if (sel.length >= BUNDLE_MAX) return;
    sel.push(id);
    const slotIdx = sel.length - 1;
    live.textContent = `Added ${product(id).name}. ${sel.length} of ${BUNDLE_MAX}.`;
    syncCards(); syncTray(slotIdx, slotIdx); syncTotals();
    const slotArt = slots[slotIdx].querySelector(".art") as SVGElement;
    fly(card?.querySelector(".art"), slotArt, () => { slotArt.style.opacity = "1"; });
  }

  root.querySelector(".rw-grid")!.addEventListener("click", e => {
    const c = (e.target as Element).closest<HTMLButtonElement>(".rw-card");
    if (c && !c.disabled) toggle(c.dataset.id!, c);
  });
  root.querySelector(".rw-tray")!.addEventListener("click", e => {
    const x = (e.target as Element).closest<HTMLElement>("[data-rm]");
    if (!x) return;
    const id = x.dataset.rm!;
    toggle(id);
    // keep keyboard focus in the tray, or hand it back to the product card
    (root.querySelector<HTMLElement>(".rw-slot.on .x") ?? cards.find(c => c.dataset.id === id))?.focus();
  });
  q(".rw-chips").addEventListener("click", e => {
    const b = (e.target as Element).closest("button"); if (!b) return;
    const filter = b.textContent!;
    q(".rw-chips").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    // hidden → shown restarts the cards' entrance animation, so only newly shown cards animate
    for (const c of cards) c.hidden = filter !== "All" && c.dataset.cat !== filter;
  });
  const sw = q(".rw-switch button");
  sw.addEventListener("click", () => { sub = !sub; sw.setAttribute("aria-checked", String(sub)); syncTotals(); });
  cta.addEventListener("click", () => {
    if (busy || sel.length < 2) return;
    busy = true; cta.disabled = true; cta.innerHTML = '<span class="spin" aria-hidden="true"></span>Adding…';
    setTimeout(() => {
      cartCount++; badge.hidden = false; badge.textContent = String(cartCount);
      badge.classList.remove("bump"); void badge.offsetWidth; badge.classList.add("bump");
      cta.innerHTML = ICO_CHECK.replace('aria-hidden="true"', 'aria-hidden="true" width="13" height="13"') + "Added to cart";
      live.textContent = "Kit added to cart.";
      setTimeout(() => { busy = false; sel = []; syncCards(); syncTray(); syncTotals(); }, 1400);
    }, 650);
  });
}
