/**
 * Selectable Gift with Purchase demo: spend thresholds unlock gifts the shopper chooses.
 * The markup ships in the page (src/components/widgets/GiftWithPurchase.astro); this only updates what changes.
 * Quantity changes touch the number and the totals; the gift row appears or goes only when the gift does.
 */
import { art, CART_LINES, GIFTS, GOAL1, GOAL2, money } from "./catalog";
import { fly, tweenNumber } from "./shared";

export function initGiftWithPurchase(root: HTMLElement | null) {
  if (!root) return;
  const lines = CART_LINES.map(l => ({ ...l }));
  let gift: string | null = null;
  const q = <T extends Element = HTMLElement>(s: string) => root.querySelector<T>(s)!;
  const list = q(".rw-lines"), msg = q(".rw-prog p"), live = q(".rw-sr"), cta = q(".rw-cta");
  const giftLabels = [...root.querySelectorAll<HTMLElement>(".rw-gift")];
  const subtotal = () => lines.reduce((a, l) => a + l.price * l.qty, 0);

  /** Add, swap or remove the free-gift row. Returns its artwork when a row was just added or swapped. */
  function syncGiftRow(): SVGElement | null {
    const row = list.querySelector<HTMLElement>("[data-gift]");
    const g = GIFTS.find(x => x.id === gift);
    if ((row?.dataset.gift || null) === (g?.id || null)) return null;
    row?.remove();
    if (!g) return null;
    list.insertAdjacentHTML("beforeend", `<li class="rw-line" data-gift="${g.id}">${art(g.art, g.c)}<div><div class="nm">${g.name}<span class="badge">Gift</span></div><div class="meta"><s>${money(g.value)}</s>Free</div></div><span></span></li>`);
    return list.querySelector<SVGElement>("[data-gift] .art");
  }

  function render() {
    const st = subtotal();
    // drop a gift the cart no longer qualifies for
    const was = GIFTS.find(x => x.id === gift);
    if (was && st < was.min) { gift = null; live.textContent = `${was.name} was removed because your cart is under ${money(was.min)}.`; }
    giftLabels.forEach((lab, i) => {
      const locked = st < GIFTS[i].min, input = lab.querySelector("input")!;
      input.disabled = locked; input.checked = GIFTS[i].id === gift;
      lab.querySelector<HTMLElement>(".lock")!.hidden = !locked;
      lab.dataset.tip = locked ? `Unlocks at ${money(GIFTS[i].min)}` : GIFTS[i].name;
      lab.dataset.tipSub = locked ? `Add ${money(GIFTS[i].min - st)} more` : `Free with your order`;
    });
    q("legend").textContent = st >= GOAL1 ? "Choose your free gift" : "Free gifts";
    msg.textContent = st < GOAL1 ? `You're ${money(GOAL1 - st)} away from a free gift.`
      : st < GOAL2 ? (gift ? `Gift added. Spend ${money(GOAL2 - st)} more to unlock the tumbler.` : `You've unlocked a free gift. Pick one below.`)
      : gift ? "Gift added. You've unlocked every gift." : "You've unlocked every gift. Pick one below.";
    q(".rw-bar .fill").style.width = Math.min(100, st / GOAL2 * 100) + "%";
    q(".rw-bar").querySelectorAll(".ms").forEach((m, i) => m.classList.toggle("hit", st >= [GOAL1, GOAL2][i]));
    tweenNumber(q(".rw-total .now"), st);
    const gv = GIFTS.find(x => x.id === gift);
    q(".rw-total .save").textContent = gv ? `Includes a free ${gv.name.toLowerCase()}` : "";
    cta.textContent = `Checkout · ${money(st)}`;
    return syncGiftRow();
  }

  list.addEventListener("click", e => {
    const b = (e.target as Element).closest<HTMLButtonElement>("button[data-inc], button[data-dec]"); if (!b) return;
    const id = b.dataset.inc || b.dataset.dec, l = lines.find(x => x.id === id)!;
    l.qty = Math.max(1, Math.min(9, l.qty + (b.dataset.inc ? 1 : -1)));
    const li = list.querySelector(`[data-line="${id}"]`)!;
    li.querySelector("output")!.textContent = String(l.qty);
    li.querySelector<HTMLButtonElement>("[data-dec]")!.disabled = l.qty <= 1;
    li.querySelector<HTMLButtonElement>("[data-inc]")!.disabled = l.qty >= 9;
    render();
  });
  q(".rw-gifts").addEventListener("change", e => {
    const input = e.target as HTMLInputElement;
    gift = input.value; const g = GIFTS.find(x => x.id === gift)!;
    live.textContent = `${g.name} added to your cart for free.`;
    const row = render();
    if (row) { row.style.opacity = "0"; fly(input.closest(".rw-gift")!.querySelector(".art"), row, () => { row.style.opacity = "1"; }); }
  });
  cta.addEventListener("click", () => { live.textContent = "This is a demo store, so checkout stops here."; cta.textContent = "Demo store · no real checkout"; setTimeout(render, 1600); });
}
