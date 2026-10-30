/** Bundle Builder demo: pick 3, filters, tiered discounts, subscribe & save. A pretend coffee and tea shop. */
import { art, fly, ICO_CART, ICO_CHECK, ICO_X, money, tweenNumber } from "./shared";

const P = [
  { id: "blend", name: "Morning Blend", cat: "Coffee", price: 18, art: "bag", c: "#B07A45" },
  { id: "decaf", name: "Night Owl Decaf", cat: "Coffee", price: 17, art: "bag", c: "#7462A0" },
  { id: "hoji", name: "Hojicha Tin", cat: "Tea", price: 14, art: "tin", c: "#A3653C" },
  { id: "matcha", name: "Ceremonial Matcha", cat: "Tea", price: 26, art: "tin", c: "#6E9B4E" },
  { id: "mug", name: "Stoneware Mug", cat: "Gear", price: 22, art: "mug", c: "#3F6FA8" },
  { id: "drip", name: "Pour-over Dripper", cat: "Gear", price: 28, art: "dripper", c: "#C0573D" },
];
const MAX = 3, TIER = (n: number) => n >= 3 ? .15 : n >= 2 ? .10 : 0, SUB = .05;
const product = (id: string) => P.find(p => p.id === id)!;

export function initBundleBuilder(root: HTMLElement | null) {
  if (!root) return;
  let sel: string[] = [], filter = "All", sub = false, busy = false, cartCount = 0;
  root.innerHTML = `
    <div class="rw-top"><span>Demo store · Bundle Builder</span><span class="rw-cart" data-tip="Cart" data-tip-sub="Bundles added in this demo">${ICO_CART}<b hidden>0</b></span></div>
    <h3 class="rw-title">Build your brew kit</h3>
    <span class="rw-pill" aria-live="polite"></span>
    <div class="rw-chips" role="group" aria-label="Filter products">${["All", "Coffee", "Tea", "Gear"].map(f => `<button type="button" aria-pressed="${f === "All"}">${f}</button>`).join("")}</div>
    <div class="rw-grid"></div>
    <div class="rw-tray" aria-label="Your bundle"></div>
    <label class="rw-switch"><button type="button" role="switch" aria-checked="false" aria-label="Subscribe and save"></button><span>Subscribe &amp; save<small>Delivered every 4 weeks · extra 5% off</small></span></label>
    <div class="rw-total"><div><span class="now" data-v="0">$0.00</span><s></s></div><span class="save"></span></div>
    <button type="button" class="rw-cta"></button>
    <span class="rw-sr" aria-live="polite"></span>
    <span class="rw-note">Rebuilt from scratch to show how Bundle Builder works. Not Rebuy's code.</span>`;
  const q = <T extends Element = HTMLElement>(s: string) => root.querySelector<T>(s)!;
  const grid = q(".rw-grid"), tray = q(".rw-tray"), pill = q(".rw-pill"), cta = q<HTMLButtonElement>(".rw-cta"), live = q(".rw-sr"), badge = q(".rw-cart b");

  function renderGrid() {
    const full = sel.length >= MAX;
    grid.innerHTML = P.filter(p => filter === "All" || p.cat === filter).map(p => {
      const on = sel.includes(p.id);
      return `<button type="button" class="rw-card" data-id="${p.id}" aria-pressed="${on}" ${!on && full ? "disabled" : ""} aria-label="${p.name}, ${money(p.price)}">${art(p.art, p.c)}<span class="nm">${p.name}</span><span class="pr">${money(p.price)}</span><span class="chk">${ICO_CHECK}</span></button>`;
    }).join("");
  }
  function renderTray(hideIdx = -1) {
    tray.innerHTML = Array.from({ length: MAX }, (_, i) => {
      const p = P.find(x => x.id === sel[i]);
      return p ? `<div class="rw-slot on" data-slot="${i}">${art(p.art, p.c)}<button type="button" class="x" data-rm="${p.id}" aria-label="Remove ${p.name}">${ICO_X}</button></div>`
               : `<div class="rw-slot" data-slot="${i}">${i + 1}</div>`;
    }).join("");
    if (hideIdx >= 0) (tray.children[hideIdx].querySelector(".art") as SVGElement).style.opacity = "0";
  }
  function renderTotals() {
    const n = sel.length, base = sel.reduce((a, id) => a + product(id).price, 0);
    const off = TIER(n) + (sub && n >= 2 ? SUB : 0), total = base * (1 - off);
    pill.textContent = n === 0 ? "Pick 3 · save up to 15%" : n === 1 ? "Add 1 more to save 10%" : n === 2 ? "Add 1 more to save 15%" : "Kit complete · 15% off";
    pill.classList.toggle("full", n === MAX);
    tweenNumber(q(".rw-total .now"), total);
    q(".rw-total s").textContent = off ? money(base) : "";
    q(".rw-total .save").textContent = off ? `You save ${money(base - total)}` : "";
    if (!busy) { cta.disabled = n < 2; cta.textContent = n < 2 ? `Pick ${2 - n} more to add` : `Add kit to cart · ${money(total)}`; }
  }
  function toggle(id: string, card?: Element) {
    const i = sel.indexOf(id);
    if (i >= 0) { sel.splice(i, 1); live.textContent = `Removed ${product(id).name}.`; renderGrid(); renderTray(); renderTotals(); return; }
    if (sel.length >= MAX) return;
    sel.push(id);
    const slotIdx = sel.length - 1;
    live.textContent = `Added ${product(id).name}. ${sel.length} of ${MAX}.`;
    renderTray(slotIdx); renderTotals();
    const from = card?.querySelector(".art"), slotArt = tray.children[slotIdx].querySelector(".art") as SVGElement;
    fly(from, slotArt, () => { slotArt.style.opacity = "1"; });
    renderGrid();
    const again = grid.querySelector<HTMLElement>(`[data-id="${id}"]`); if (again && card === document.activeElement) again.focus();
  }
  grid.addEventListener("click", e => {
    const c = (e.target as Element).closest<HTMLButtonElement>(".rw-card");
    if (c && !c.disabled) { const focused = document.activeElement === c; toggle(c.dataset.id!, c); if (focused) grid.querySelector<HTMLElement>(`[data-id="${c.dataset.id}"]`)?.focus(); }
  });
  tray.addEventListener("click", e => { const x = (e.target as Element).closest<HTMLElement>("[data-rm]"); if (x) toggle(x.dataset.rm!); });
  q(".rw-chips").addEventListener("click", e => {
    const b = (e.target as Element).closest("button"); if (!b) return;
    filter = b.textContent!; q(".rw-chips").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    renderGrid();
  });
  const sw = q(".rw-switch button");
  sw.addEventListener("click", () => { sub = !sub; sw.setAttribute("aria-checked", String(sub)); renderTotals(); });
  cta.addEventListener("click", () => {
    if (busy || sel.length < 2) return;
    busy = true; cta.disabled = true; cta.innerHTML = '<span class="spin" aria-hidden="true"></span>Adding…';
    setTimeout(() => {
      cartCount++; badge.hidden = false; badge.textContent = String(cartCount);
      badge.classList.remove("bump"); void badge.offsetWidth; badge.classList.add("bump");
      cta.innerHTML = ICO_CHECK.replace('aria-hidden="true"', 'aria-hidden="true" width="13" height="13"') + "Added to cart";
      live.textContent = "Kit added to cart.";
      setTimeout(() => { busy = false; sel = []; renderGrid(); renderTray(); renderTotals(); }, 1400);
    }, 650);
  });
  renderGrid(); renderTray(); renderTotals();
}
