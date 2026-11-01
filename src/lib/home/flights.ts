/**
 * Flights: each plane follows its route as its band scrolls through the viewport. The timeline runs backward in
 * time as you scroll down, so a plane waits at the later place (its destination), flies back to the earlier one
 * as you scroll down, and makes the real flight when you scroll up. It turns to face the way it's moving.
 */
import { easeInOut, planeAt, routePath } from "../flight";
import { onLangChange, isJa } from "../i18n";
import { fitCanvas, paint } from "../ink/paint";
import { reduceMotion } from "../motion";
import { onThemeChange } from "../theme";
import { buildWave } from "./waves";

type Flight = { el: HTMLElement; svg: SVGSVGElement; path?: SVGPathElement; trail?: SVGPathElement; plane?: SVGUseElement; len?: number; x0?: number; x1?: number; dims?: [number, number, number, number, number]; waveKey?: string; raw?: number; heading?: number; turn?: number; turning?: number; pos?: ReturnType<typeof planeAt> };
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

function placePlane(f: Flight) {
  const { x, y, ang, scale } = f.pos!;
  f.plane!.setAttribute("transform", `translate(${x} ${y}) rotate(${ang * 180 / Math.PI + f.turn!}) scale(${scale})`);
}

/** Bank smoothly around when the scroll direction changes. */
function turnPlane(f: Flight) {
  f.turning = 0;
  const left = f.heading! - f.turn!;
  f.turn = Math.abs(left) < 2 ? f.heading! : f.turn! + left * .16;
  placePlane(f);
  if (f.turn !== f.heading) f.turning = requestAnimationFrame(() => turnPlane(f));
}

export function updateFlights() {
  const vh = innerHeight;
  for (const f of flights) {
    if (!f.len || !f.path) continue;
    paintWaveIfNear(f);
    const r = f.el.getBoundingClientRect();
    const raw = reduceMotion ? 1 : Math.min(1, Math.max(0, (vh * .9 - r.top) / (vh * .62)));
    const pos = f.pos = planeAt(f.path, f.len, reduceMotion ? 1 : 1 - easeInOut(raw));
    if (f.raw !== undefined && raw !== f.raw) f.heading = raw > f.raw ? 180 : 0;
    f.raw = raw;
    f.heading ??= reduceMotion ? 0 : 180;
    f.turn ??= f.heading;
    placePlane(f);
    if (f.turn !== f.heading && !f.turning) f.turning = requestAnimationFrame(() => turnPlane(f));
    // The trail and the sea run from the destination back to the plane; the wash deepens along the way.
    const from = reduceMotion ? 0 : pos.L;
    f.trail!.style.strokeDasharray = `${f.len - from} ${f.len}`;
    f.trail!.style.strokeDashoffset = String(-from);
    const wave = f.el.querySelector<HTMLElement>(".wave");
    if (wave) {
      const edge = raw <= 0 ? f.el.clientWidth + 1 : raw >= 1 ? -80 : pos.x - 36;
      const mask = `linear-gradient(to right, transparent ${edge}px, #000 ${edge + 70}px)`;
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
