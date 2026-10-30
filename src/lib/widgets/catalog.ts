/**
 * The pretend coffee and tea shop behind both widget demos: products, gifts, artwork and prices.
 * No browser APIs, so the components can render the widgets' first state in the HTML.
 */
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


export const PRODUCTS = [
  { id: "blend", name: "Morning Blend", cat: "Coffee", price: 18, art: "bag", c: "#B07A45" },
  { id: "decaf", name: "Night Owl Decaf", cat: "Coffee", price: 17, art: "bag", c: "#7462A0" },
  { id: "hoji", name: "Hojicha Tin", cat: "Tea", price: 14, art: "tin", c: "#A3653C" },
  { id: "matcha", name: "Ceremonial Matcha", cat: "Tea", price: 26, art: "tin", c: "#6E9B4E" },
  { id: "mug", name: "Stoneware Mug", cat: "Gear", price: 22, art: "mug", c: "#3F6FA8" },
  { id: "drip", name: "Pour-over Dripper", cat: "Gear", price: 28, art: "dripper", c: "#C0573D" },
];
export const BUNDLE_MAX = 3;
export const BUNDLE_FILTERS = ["All", "Coffee", "Tea", "Gear"];
/** Tiered bundle discount, plus 5% more for subscribe & save. */
export const bundleTier = (n: number) => n >= 3 ? .15 : n >= 2 ? .10 : 0;
export const SUBSCRIBE_OFF = .05;

export const GOAL1 = 50, GOAL2 = 80;
export const CART_LINES = [
  { id: "blend", name: "Morning Blend", price: 18, qty: 1, art: "bag", c: "#B07A45" },
  { id: "mug", name: "Stoneware Mug", price: 22, qty: 1, art: "mug", c: "#3F6FA8" },
];
export const GIFTS = [
  { id: "spoon", name: "Tasting Spoon", value: 8, min: GOAL1, art: "spoon", c: "#9A8F7A" },
  { id: "whisk", name: "Bamboo Whisk", value: 12, min: GOAL1, art: "whisk", c: "#C9A15A" },
  { id: "tumbler", name: "Travel Tumbler", value: 24, min: GOAL2, art: "tumbler", c: "#2F8C86" },
];
