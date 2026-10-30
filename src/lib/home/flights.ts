/** Flights: each plane follows its route as its band scrolls through the viewport. */
import { easeInOut, planeAt, routePath } from "../flight";
import { onLangChange, isJa } from "../i18n";
import { fitCanvas, paint } from "../ink/paint";
import { reduceMotion } from "../motion";
import { onThemeChange } from "../theme";
import { buildWave } from "./waves";

type Flight = { el: HTMLElement; svg: SVGSVGElement; path?: SVGPathElement; trail?: SVGPathElement; plane?: SVGUseElement; len?: number; x0?: number; x1?: number; dims?: [number, number, number, number, number]; waveKey?: string };
const tl = document.getElementById("timeline")!;
const flights: Flight[] = [...document.querySelectorAll<HTMLElement>(".flight")].map(el => ({ el, svg: el.querySelector("svg")! }));

export function layoutFlights() {
  const contentX = parseFloat(getComputedStyle(tl).getPropertyValue("--content-x")) || 0;
  for (const f of flights) {
    const W = f.el.clientWidth, H = f.el.clientHeight;
    const x0 = contentX + 6, x1 = W - 10, yb = H - 44;
    f.svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const d = routePath(x0, x1, yb);
    f.svg.querySelectorAll(".track, .trail").forEach(p => p.setAttribute("d", d));
    f.path = f.svg.querySelector<SVGPathElement>(".track")!;
    f.len = f.path.getTotalLength();
    f.trail = f.svg.querySelector<SVGPathElement>(".trail")!;
    f.trail.style.strokeDasharray = `${f.len} ${f.len}`;
    const [a, b] = f.svg.querySelectorAll(".end");
    a.setAttribute("cx", String(x0)); a.setAttribute("cy", String(yb)); b.setAttribute("cx", String(x1)); b.setAttribute("cy", String(yb));
    const [la, lb] = f.svg.querySelectorAll(".lbl:not(.yr)");
    la.setAttribute("x", String(x0)); la.setAttribute("y", String(yb + 24)); lb.setAttribute("x", String(x1)); lb.setAttribute("y", String(yb + 24));
    const yr = f.svg.querySelector(".yr")!; yr.setAttribute("x", String((x0 + x1) / 2)); yr.setAttribute("y", String((2 * yb - 60) / 8 + 34));
    f.plane = f.svg.querySelector<SVGUseElement>(".plane")!;
    f.x0 = x0; f.x1 = x1; f.dims = [W, H, x0, x1, yb];
    paintWaveIfNear(f);
  }
  updateFlights();
}

/** Waves are painted only once their band is within two screens, so a fresh page load never pays for them. */
function paintWaveIfNear(f: Flight) {
  if (!f.dims) return;
  const r = f.el.getBoundingClientRect();
  if (r.top < innerHeight * 3 && r.bottom > -innerHeight * 2) paintWave(f, ...f.dims);
}

/** Paint the flight's sea, only when its size or the theme changed. */
function paintWave(f: Flight, W: number, H: number, x0: number, x1: number, yb: number) {
  const wash = f.el.querySelector<HTMLCanvasElement>(".wave-wash"), ink = f.el.querySelector<HTMLCanvasElement>(".wave-ink");
  if (!wash || !ink) return;
  const css = getComputedStyle(f.el), color = (n: string) => css.getPropertyValue(n).trim();
  const key = [W, H, x0, x1, color("--brush"), color("--foam")].join();
  if (key === f.waveKey) return;
  f.waveKey = key;
  const dir = f.el.dataset.waveDir === "-1" ? -1 : 1, fuji = f.el.dataset.fuji ? +f.el.dataset.fuji : null;
  const segs = buildWave({ width: W, height: H, x0, x1, yb, dir, fuji, seed: dir > 0 ? 2019 : 2022 });
  const [wc] = fitCanvas(wash), [ic] = fitCanvas(ink);
  wc.fillStyle = wc.strokeStyle = color("--wash"); wc.lineCap = "round"; paint(wc, segs.wash);
  ic.lineCap = "round"; ic.lineJoin = "round";
  ic.fillStyle = ic.strokeStyle = color("--brush"); paint(ic, segs.ink); paint(ic, segs.foamEdge);
  ic.fillStyle = color("--foam"); paint(ic, segs.foam);
}

export function updateFlights() {
  const vh = innerHeight;
  for (const f of flights) {
    if (!f.len || !f.path) continue;
    paintWaveIfNear(f);
    const r = f.el.getBoundingClientRect();
    const raw = reduceMotion ? 1 : Math.min(1, Math.max(0, (vh * .9 - r.top) / (vh * .62)));
    const pos = planeAt(f.path, f.len, easeInOut(raw));
    f.plane!.setAttribute("transform", pos.transform);
    f.trail!.style.strokeDashoffset = String(f.len - pos.L);
    // The sea paints in behind the plane, and its wash deepens as the flight goes on.
    const wave = f.el.querySelector<HTMLElement>(".wave");
    if (wave) {
      const edge = raw <= 0 ? -1 : raw >= 1 ? f.el.clientWidth + 80 : pos.x + 36;
      const mask = `linear-gradient(to right, #000 ${edge - 70}px, transparent ${edge}px)`;
      wave.style.setProperty("-webkit-mask-image", mask); wave.style.maskImage = mask;
      wave.style.setProperty("--wash-depth", String(.4 + .45 * raw));
    }
  }
}

export function initFlights() {
  addEventListener("scroll", updateFlights, { passive: true });
  addEventListener("resize", layoutFlights);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(layoutFlights);
  onThemeChange(layoutFlights);
  onLangChange(() => {
    flights.forEach(({ el }) => el.setAttribute("aria-label", (isJa() ? el.dataset.labelJa : el.dataset.labelEn) || ""));
    layoutFlights();
  });
  layoutFlights();
}
