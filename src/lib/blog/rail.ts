/**
 * The post's side nav and reading progress, both driven by one number: how far down the page you are. The rail's
 * ink is mapped so it reaches each link's dot just as that section takes over, while still running 0 to 100% of the
 * page. An ensō fills with the same number, following the brush around from where it starts. Narrow or short screens
 * have no room for the rail, so they get a thin bar under the nav, and the ensō becomes a button that opens the links.
 */
const LINE = .38; // a section is current once its heading passes this height on screen
// Where ensoPath starts and how far it sweeps, as a conic gradient measures them: its a0 of -2.2 rad, and 95% of a turn.
const RING_START = -36, RING_SWEEP = 342;

export function initRail() {
  const rail = document.getElementById("rail")!, fill = document.getElementById("railFill")!, pct = document.getElementById("railPct")!, bar = document.getElementById("readBar")!;
  const ring = document.getElementById("railRing") as HTMLButtonElement, ink = document.getElementById("railInk")!;
  const list = rail.querySelector("ol")!, items = [...list.querySelectorAll("li")], links = items.map(li => li.querySelector("a")!);
  const heads = links.map(a => document.querySelector<HTMLElement>(a.hash)!);
  let scrollStops: number[] = [], railStops: number[] = [], maxScroll = 1, current = -1, ticking = false;

  function measure() {
    maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    scrollStops = heads.map(h => Math.min(maxScroll, h.getBoundingClientRect().top + scrollY - innerHeight * LINE));
    const top = list.getBoundingClientRect().top;
    railStops = items.map(li => { const r = li.getBoundingClientRect(); return r.top - top + 9; });
    update();
  }

  /** Scroll position to ink length, piece by piece between the links. */
  function inkAt(y: number) {
    const H = list.offsetHeight, ys = [0, ...scrollStops, maxScroll], rs = [0, ...railStops, H];
    for (let i = 1; i < ys.length; i++) if (y <= ys[i]) return rs[i - 1] + (rs[i] - rs[i - 1]) * (ys[i] > ys[i - 1] ? (y - ys[i - 1]) / (ys[i] - ys[i - 1]) : 1);
    return H;
  }

  function update() {
    ticking = false;
    const y = Math.min(maxScroll, Math.max(0, scrollY)), p = y / maxScroll;
    bar.style.transform = `scaleX(${p})`;
    fill.style.height = inkAt(y) + "px";
    pct.textContent = Math.round(p * 100) + "%";
    const deg = p * RING_SWEEP, mask = p >= .995 ? "none" : p < .003 ? "linear-gradient(transparent, transparent)" : `conic-gradient(from ${RING_START}deg, #000 ${deg}deg, transparent ${deg + 8}deg)`;
    ink.style.setProperty("-webkit-mask-image", mask); ink.style.maskImage = mask;
    ring.classList.toggle("done", p >= .995);
    let now = -1;
    scrollStops.forEach((s, i) => { if (y >= s) now = i; });
    if (now !== current) {
      current = now;
      items.forEach((li, i) => li.classList.toggle("reached", i <= now));
      links.forEach((a, i) => i === now ? a.setAttribute("aria-current", "location") : a.removeAttribute("aria-current"));
    }
  }

  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  // Demos and images can change the page's height, which moves every stop.
  new ResizeObserver(measure).observe(document.body);
  // The rail takes over once the quick links at the top of the post have scrolled away.
  new IntersectionObserver(([e]) => {
    const on = !e.isIntersecting && e.boundingClientRect.top < 0;
    rail.classList.toggle("on", on);
    if (!on) setOpen(false);
  }).observe(document.querySelector(".toc")!);

  // The ensō as a button: only where the links are tucked away. Beside the page it's just the progress ring.
  const setOpen = (open: boolean) => { rail.classList.toggle("open", open); ring.setAttribute("aria-expanded", String(open)); };
  const wide = matchMedia("(min-width: 1240px) and (min-height: 620px)");
  const setMode = () => {
    ring.disabled = wide.matches;
    wide.matches ? ring.setAttribute("aria-hidden", "true") : ring.removeAttribute("aria-hidden");
    setOpen(false); measure();
  };
  wide.addEventListener("change", setMode);
  ring.addEventListener("click", () => setOpen(!rail.classList.contains("open")));
  list.addEventListener("click", e => { if ((e.target as Element).closest("a")) setOpen(false); });
  document.addEventListener("pointerdown", e => { if (!rail.contains(e.target as Node)) setOpen(false); });
  rail.addEventListener("keydown", e => { if (e.key === "Escape" && rail.classList.contains("open")) { setOpen(false); ring.focus(); } });
  rail.addEventListener("focusout", e => { const to = e.relatedTarget as Node | null; if (to && !rail.contains(to)) setOpen(false); });
  setMode();
}
