/**
 * The time ruler and everything that follows the scroll: the cursor and readout, inked and active entries,
 * the intro sweep from 2016 to now, the filters, and J/K stepping.
 */
import { esc } from "../esc";
import { L, onLangChange } from "../i18n";
import { reduceMotion } from "../motion";
import { hideTip } from "../popover";
import { data, entryEl, flat, visibleEntries, type EntryIndex } from "./data";
import { nodeY, tipAt, tipPosition } from "./spine";

const { now: NOW, min: MIN, max: MAX } = data;
const pct = (y: number) => ((y - MIN) / (MAX - MIN)) * 100;
const ruler = document.getElementById("ruler")!;
const cursor = document.getElementById("cursor")!;
const readout = document.getElementById("readout")!;
const dots = [...ruler.querySelectorAll<HTMLButtonElement>(".dot")];
const dotById = Object.fromEntries(dots.map(d => [d.dataset.id!, d]));

const bar = ruler.closest<HTMLElement>(".ruler-bar")!;
/** Moves the cursor, and the ink behind it that runs from today back to this point. */
const moveCursor = (y: number) => { cursor.style.left = pct(y) + "%"; ruler.style.setProperty("--at", pct(y) + "%"); };

const titleOf = (e: EntryIndex) => L(e.title, e.titleJa);
const yearLabel = (e: EntryIndex) => e.end === null ? L("Now", "現在") : L(e.startEn, e.startJa);
const say = (e: EntryIndex, label: string) => { readout.innerHTML = `<b>${esc(label)}</b> · ${esc(titleOf(e))} · ${esc(L(e.era, e.eraJa))}`; };

function setCurrent(e: EntryIndex) {
  moveCursor(e.end === null ? NOW : e.start);
  bar.dataset.mon = entryEl(e.id).dataset.mon;
  dots.forEach(d => d.classList.toggle("current", d.dataset.id === e.id));
  say(e, yearLabel(e));
}

// ---------- Scroll sync ----------
let playing = false;
export let currentEntryId: string | null = null;
export function syncToScroll() {
  if (playing) return;
  const tip = tipPosition(), vis = visibleEntries();
  let current = vis[0];
  for (const e of vis) {
    const el = entryEl(e.id), reached = nodeY(el) <= tip + 1;
    el.classList.toggle("inked", reached);
    if (reached) current = e;
  }
  if (!current) return;
  currentEntryId = current.id;
  setCurrent(current);
  flat.forEach(f => entryEl(f.id).classList.toggle("active", f === current));
  dots.forEach(d => { const en = flat.find(f => f.id === d.dataset.id)!; d.classList.toggle("lit", en.start >= current.start || en.end === null); });
}

// ---------- Intro: sweep 2016 → now, lighting each entry as it passes ----------
const chrono = [...flat].sort((a, b) => a.start - b.start);
export function playIntro() {
  if (reduceMotion) { dots.forEach(d => d.classList.add("lit")); syncToScroll(); return; }
  playing = true; ruler.classList.add("playing");
  dots.forEach(d => d.classList.remove("lit", "current"));
  const dur = 2600, t0 = performance.now(), ease = (t: number) => 1 - Math.pow(1 - t, 3);
  let lastShown: EntryIndex | null = null;
  const frame = (t: number) => {
    if (!playing) return;
    const p = Math.min(1, (t - t0) / dur), y = MIN + (NOW - MIN) * ease(p);
    moveCursor(y);
    let shown: EntryIndex | null = null;
    chrono.forEach(e => { if (e.start <= y) { dotById[e.id].classList.add("lit"); shown = e; } });
    if (shown && shown !== lastShown) { lastShown = shown; say(shown, L((shown as EntryIndex).startEn, (shown as EntryIndex).startJa)); }
    if (p < 1) requestAnimationFrame(frame);
    else { playing = false; ruler.classList.remove("playing"); syncToScroll(); }
  };
  requestAnimationFrame(frame);
}
function stopIntro() {
  if (!playing) return;
  playing = false; ruler.classList.remove("playing");
  dots.forEach(d => d.classList.add("lit"));
  syncToScroll();
}

// ---------- Filters ----------
function applyFilter(btn: HTMLElement) {
  const f = btn.dataset.filter;
  document.querySelectorAll("[data-filter]").forEach(b => b.setAttribute("aria-pressed", String(b === btn)));
  flat.forEach(e => {
    const hide = f !== "all" && e.type !== f;
    entryEl(e.id).classList.toggle("hidden", hide);
    dotById[e.id].style.visibility = hide ? "hidden" : "";
  });
  document.querySelectorAll<HTMLElement>(".era").forEach(era => {
    const firstVisible = [...era.querySelectorAll(".entry")].find(a => !a.classList.contains("hidden"));
    era.querySelectorAll(".entry").forEach(a => a.classList.toggle("first", a === firstVisible));
    era.hidden = !firstVisible;
  });
  syncToScroll();
}
export const filterBy = (f: string) => document.querySelector<HTMLElement>(`[data-filter="${f}"]`)?.click();

// ---------- Keyboard: J / K step through time, and the ink lands exactly on the dot ----------
export function scrollToEntry(id: string) {
  const el = document.getElementById(id); if (!el) return;
  const target = nodeY(el) + 2, max = document.documentElement.scrollHeight - innerHeight;
  let lo = 0, hi = max;
  for (let i = 0; i < 32; i++) { const mid = (lo + hi) / 2; tipAt(mid) < target ? lo = mid : hi = mid; }
  scrollTo({ top: Math.ceil(hi), behavior: reduceMotion ? "auto" : "smooth" });
}
export function stepEntry(dir: 1 | -1) {
  const vis = visibleEntries(), i = Math.max(0, vis.findIndex(e => e.id === currentEntryId));
  const next = vis[Math.min(vis.length - 1, Math.max(0, i + dir))];
  if (next) scrollToEntry(next.id);
}
export const replayIntro = () => { scrollTo({ top: 0 }); setTimeout(playIntro, 50); };

export function initTimeline() {
  ruler.addEventListener("click", ev => {
    const d = (ev.target as Element).closest<HTMLElement>(".dot"); if (!d) return;
    document.getElementById(d.dataset.id!)!.scrollIntoView({ block: "start" });
  });
  let ticking = false;
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; syncToScroll(); }); } }, { passive: true });
  (["wheel", "touchstart", "keydown"] as const).forEach(ev => addEventListener(ev, stopIntro, { passive: true }));
  document.getElementById("replay")!.addEventListener("click", replayIntro);

  document.querySelectorAll<HTMLElement>("[data-filter]").forEach(btn => btn.addEventListener("click", () => {
    if (btn.getAttribute("aria-pressed") === "true") return;
    if (!document.startViewTransition || reduceMotion) return applyFilter(btn);
    // name each entry so the browser can morph it to its new position
    const named = [...document.querySelectorAll<HTMLElement>(".entry, .place")].filter(el => { const r = el.getBoundingClientRect(); return r.bottom > -200 && r.top < innerHeight + 200; });
    named.forEach((el, i) => el.style.viewTransitionName = "tl-" + i);
    document.startViewTransition(() => applyFilter(btn)).finished.finally(() => named.forEach(el => el.style.viewTransitionName = ""));
  }));

  onLangChange(() => { hideTip(); syncToScroll(); });
  syncToScroll();
  playIntro();
}

