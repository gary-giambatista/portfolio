/**
 * The About page's sea divider: the home page's wave engine as a quiet pause after "The short version".
 * Painted once when it nears the viewport, then the ink sweeps in from left to right the first time it's seen.
 */
import { easeInOut } from "./flight";
import { fitCanvas, paint } from "./ink/paint";
import { reduceMotion } from "./motion";
import { onThemeChange } from "./theme";
import { buildWave } from "./home/waves";

export function initSeaDivider(el: HTMLElement | null) {
  if (!el) return;
  const wave = el.querySelector<HTMLElement>(".wave")!;
  const wash = el.querySelector<HTMLCanvasElement>(".wave-wash")!, ink = el.querySelector<HTMLCanvasElement>(".wave-ink")!;
  let key = "", shown = reduceMotion;

  function draw() {
    const W = el!.clientWidth, H = el!.clientHeight;
    const css = getComputedStyle(el!), color = (n: string) => css.getPropertyValue(n).trim();
    const k = [W, H, color("--brush"), color("--foam")].join();
    if (!W || k === key) return;
    key = k;
    // The route runs a little past both edges, so the sea reaches the soft fade at each side.
    const segs = buildWave({ width: W, height: H, x0: -W * .08, x1: W * 1.08, yb: H - 4, dir: 1, fuji: W > 520 ? .86 : null, seed: 2023 });
    const [wc] = fitCanvas(wash), [ic] = fitCanvas(ink);
    wc.fillStyle = wc.strokeStyle = color("--wash"); wc.lineCap = "round"; paint(wc, segs.wash);
    ic.lineCap = "round"; ic.lineJoin = "round";
    ic.fillStyle = ic.strokeStyle = color("--brush"); paint(ic, segs.ink); paint(ic, segs.foamEdge);
    ic.fillStyle = color("--foam"); paint(ic, segs.foam);
  }

  function reveal(p: number) {
    const W = el!.clientWidth, edge = p >= 1 ? W + 80 : -10 + (W + 90) * p;
    const mask = `linear-gradient(to right, #000 ${edge - 70}px, transparent ${edge}px)`;
    wave.style.setProperty("-webkit-mask-image", mask); wave.style.maskImage = mask;
    wave.style.setProperty("--wash-depth", String(.4 + .45 * p));
  }

  function sweep() {
    shown = true;
    const t0 = performance.now(), dur = 1800;
    const frame = (t: number) => { const p = Math.min(1, (t - t0) / dur); reveal(easeInOut(p)); if (p < 1) requestAnimationFrame(frame); };
    requestAnimationFrame(frame);
  }

  reveal(shown ? 1 : 0);
  const near = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { near.disconnect(); draw(); } }, { rootMargin: "600px 0px" });
  near.observe(el);
  if (!shown) {
    const seen = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { seen.disconnect(); draw(); sweep(); } }, { threshold: .5 });
    seen.observe(el);
  }
  new ResizeObserver(() => { if (key) draw(); }).observe(el);
  onThemeChange(() => { if (key) draw(); });
}
