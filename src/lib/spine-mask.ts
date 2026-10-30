/**
 * The ink tip is the one source of truth: the same position reveals the painted spine (through a mask whose
 * last 26px fade out, so the edge looks wet) and decides which dots are inked.
 */
export function inkMask(el: HTMLElement, tip: number) {
  const mask = `linear-gradient(to bottom, #000 ${Math.max(0, tip - 26)}px, transparent ${tip}px)`;
  el.style.setProperty("-webkit-mask-image", mask);
  el.style.maskImage = mask;
}
