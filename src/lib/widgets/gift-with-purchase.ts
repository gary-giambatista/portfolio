/** Selectable Gift with Purchase demo: spend thresholds unlock gifts the shopper chooses. */
import { art, fly, ICO_CART, money, tweenNumber } from "./shared";

const GOAL1 = 50, GOAL2 = 80;
const GIFTS = [
  { id: "spoon", name: "Tasting Spoon", value: 8, min: GOAL1, art: "spoon", c: "#9A8F7A" },
  { id: "whisk", name: "Bamboo Whisk", value: 12, min: GOAL1, art: "whisk", c: "#C9A15A" },
  { id: "tumbler", name: "Travel Tumbler", value: 24, min: GOAL2, art: "tumbler", c: "#2F8C86" },
];

export function initGiftWithPurchase(root: HTMLElement | null) {
  if (!root) return;
  const LINES = [
    { id: "blend", name: "Morning Blend", price: 18, qty: 1, art: "bag", c: "#B07A45" },
    { id: "mug", name: "Stoneware Mug", price: 22, qty: 1, art: "mug", c: "#3F6FA8" },
  ];
  let gift: string | null = null;
  root.innerHTML = `
    <div class="rw-top"><span>Demo store · Gift with purchase</span><span class="rw-cart">${ICO_CART}</span></div>
    <h3 class="rw-title">Your cart</h3>
    <ul class="rw-lines"></ul>
    <div class="rw-prog"><p aria-live="polite"></p>
      <div class="rw-bar"><span class="fill"></span>
        <span class="ms" style="left:${GOAL1 / GOAL2 * 100}%" data-tip="Free gift" data-tip-sub="Choose one at ${money(GOAL1)}"><svg viewBox="0 0 12 12"><path d="M2 6h8v4.5H2zM1.5 3.8h9V6h-9zM6 3.8v6.7M6 3.8C4.6 1.4 2.6 2.2 3.6 3.8M6 3.8c1.4-2.4 3.4-1.6 2.4 0"/></svg><span>${money(GOAL1)}</span></span>
        <span class="ms" style="left:100%" data-tip="Premium gift" data-tip-sub="Unlocks at ${money(GOAL2)}"><svg viewBox="0 0 12 12"><path d="M6 1.5l1.4 2.9 3.1.4-2.3 2.2.6 3.1L6 8.6 3.2 10.1l.6-3.1L1.5 4.8l3.1-.4z"/></svg><span>${money(GOAL2)}</span></span>
      </div>
    </div>
    <fieldset class="rw-gifts"><legend>Choose your free gift</legend></fieldset>
    <div class="rw-total"><div><span class="now" data-v="0">$0.00</span></div><span class="save"></span></div>
    <button type="button" class="rw-cta">Checkout</button>
    <span class="rw-sr" aria-live="polite"></span>
    <span class="rw-note">Rebuilt from scratch to show how Selectable Gift with Purchase works. Not Rebuy's code.</span>`;
  const q = <T extends Element = HTMLElement>(s: string) => root.querySelector<T>(s)!;
  const lines = q(".rw-lines"), gifts = q(".rw-gifts"), msg = q(".rw-prog p"), live = q(".rw-sr");
  const subtotal = () => LINES.reduce((a, l) => a + l.price * l.qty, 0);
  gifts.insertAdjacentHTML("beforeend", GIFTS.map(g => `<label class="rw-gift"><input type="radio" name="gwp" value="${g.id}">${art(g.art, g.c)}<span class="nm">${g.name}</span><span class="pr">Worth ${money(g.value)}</span><span class="lock" hidden><svg viewBox="0 0 10 10"><rect x="2" y="4.5" width="6" height="4.5" rx="1"/><path d="M3.3 4.5V3.2a1.7 1.7 0 0 1 3.4 0v1.3"/></svg></span></label>`).join(""));

  function renderLines() {
    const g = GIFTS.find(x => x.id === gift);
    lines.innerHTML = LINES.map(l => `<li class="rw-line">${art(l.art, l.c)}<div><div class="nm">${l.name}</div><div class="meta">${money(l.price)} each</div></div>
      <span class="rw-step"><button type="button" data-dec="${l.id}" aria-label="Decrease ${l.name}" ${l.qty <= 1 ? "disabled" : ""}>−</button><output aria-label="Quantity">${l.qty}</output><button type="button" data-inc="${l.id}" aria-label="Increase ${l.name}" ${l.qty >= 9 ? "disabled" : ""}>+</button></span></li>`).join("")
      + (g ? `<li class="rw-line" data-gift>${art(g.art, g.c)}<div><div class="nm">${g.name}<span class="badge">Gift</span></div><div class="meta"><s>${money(g.value)}</s>Free</div></div><span></span></li>` : "");
  }
  function render() {
    const st = subtotal();
    // drop a gift the cart no longer qualifies for
    const g = GIFTS.find(x => x.id === gift);
    if (g && st < g.min) { gift = null; live.textContent = `${g.name} was removed because your cart is under ${money(g.min)}.`; }
    gifts.querySelectorAll<HTMLElement>(".rw-gift").forEach((lab, i) => {
      const locked = st < GIFTS[i].min, input = lab.querySelector("input")!;
      input.disabled = locked; input.checked = GIFTS[i].id === gift;
      lab.querySelector<HTMLElement>(".lock")!.hidden = !locked;
      lab.dataset.tip = locked ? `Unlocks at ${money(GIFTS[i].min)}` : GIFTS[i].name;
      lab.dataset.tipSub = locked ? `Add ${money(GIFTS[i].min - st)} more` : `Free with your order`;
    });
    gifts.querySelector("legend")!.textContent = st >= GOAL1 ? "Choose your free gift" : "Free gifts";
    msg.textContent = st < GOAL1 ? `You're ${money(GOAL1 - st)} away from a free gift.`
      : st < GOAL2 ? (gift ? `Gift added. Spend ${money(GOAL2 - st)} more to unlock the tumbler.` : `You've unlocked a free gift. Pick one below.`)
      : gift ? "Gift added. You've unlocked every gift." : "You've unlocked every gift. Pick one below.";
    q(".rw-bar .fill").style.width = Math.min(100, st / GOAL2 * 100) + "%";
    q(".rw-bar").querySelectorAll(".ms").forEach((m, i) => m.classList.toggle("hit", st >= [GOAL1, GOAL2][i]));
    renderLines();
    tweenNumber(q(".rw-total .now"), st);
    const gv = GIFTS.find(x => x.id === gift);
    q(".rw-total .save").textContent = gv ? `Includes a free ${gv.name.toLowerCase()}` : "";
    q(".rw-cta").textContent = `Checkout · ${money(st)}`;
  }
  lines.addEventListener("click", e => {
    const b = (e.target as Element).closest("button"); if (!b) return;
    const id = b.dataset.inc || b.dataset.dec, l = LINES.find(x => x.id === id)!;
    l.qty = Math.max(1, Math.min(9, l.qty + (b.dataset.inc ? 1 : -1)));
    render();
    lines.querySelector<HTMLElement>(`[data-${b.dataset.inc ? "inc" : "dec"}="${id}"]`)?.focus();
  });
  gifts.addEventListener("change", e => {
    const input = e.target as HTMLInputElement;
    gift = input.value; const g = GIFTS.find(x => x.id === gift)!;
    live.textContent = `${g.name} added to your cart for free.`;
    render();
    const label = input.closest(".rw-gift")!, row = lines.querySelector<SVGElement>("[data-gift] .art");
    if (row) { row.style.opacity = "0"; fly(label.querySelector(".art"), row, () => { row.style.opacity = "1"; }); }
  });
  q(".rw-cta").addEventListener("click", () => { live.textContent = "This is a demo store, so checkout stops here."; q(".rw-cta").textContent = "Demo store · no real checkout"; setTimeout(render, 1600); });
  render();
}
