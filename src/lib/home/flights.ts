/** Flights: each plane follows its route as its band scrolls through the viewport. */
import { easeInOut, planeAt, routePath } from "../flight";
import { onLangChange, isJa } from "../i18n";
import { reduceMotion } from "../motion";

type Flight = { el: HTMLElement; svg: SVGSVGElement; path?: SVGPathElement; trail?: SVGPathElement; plane?: SVGUseElement; len?: number };
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
  }
  updateFlights();
}

export function updateFlights() {
  const vh = innerHeight;
  for (const f of flights) {
    if (!f.len || !f.path) continue;
    const r = f.el.getBoundingClientRect();
    const raw = reduceMotion ? 1 : Math.min(1, Math.max(0, (vh * .9 - r.top) / (vh * .62)));
    const pos = planeAt(f.path, f.len, easeInOut(raw));
    f.plane!.setAttribute("transform", pos.transform);
    f.trail!.style.strokeDashoffset = String(f.len - pos.L);
  }
}

export function initFlights() {
  addEventListener("scroll", updateFlights, { passive: true });
  addEventListener("resize", layoutFlights);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(layoutFlights);
  onLangChange(() => {
    flights.forEach(({ el }) => el.setAttribute("aria-label", (isJa() ? el.dataset.labelJa : el.dataset.labelEn) || ""));
    layoutFlights();
  });
  layoutFlights();
}
