/** Range sliders paint their filled part with a CSS variable, since WebKit has no ::range-progress. */
export const setFill = (el: HTMLInputElement) =>
  el.style.setProperty("--fill", ((+el.value - +el.min) / (+el.max - +el.min) * 100) + "%");

export function initRanges() {
  document.querySelectorAll<HTMLInputElement>('input[type="range"]').forEach(r => { setFill(r); r.addEventListener("input", () => setFill(r)); });
}
