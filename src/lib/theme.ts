/**
 * Light and dark themes. The system setting is the default; a choice made with the toggle is remembered.
 * Anything drawn on canvas listens for "themechange" and repaints in the new ink colors.
 */
import { reduceMotion } from "./motion";

const root = document.documentElement;
const systemDark = matchMedia("(prefers-color-scheme: dark)");

export const isDark = () => root.dataset.theme ? root.dataset.theme === "dark" : systemDark.matches;

function applyTheme(next: "light" | "dark") {
  root.dataset.theme = next;
  try { localStorage.setItem("theme", next); } catch { /* private mode */ }
  document.dispatchEvent(new CustomEvent("themechange"));
}

/** Toggle with an ink-circle reveal growing from the button. */
export function toggleTheme(from?: Element | null) {
  const next = isDark() ? "light" : "dark";
  if (!document.startViewTransition || reduceMotion) return applyTheme(next);
  const btn = from || document.getElementById("themeBtn");
  const r = btn ? btn.getBoundingClientRect() : { left: innerWidth / 2, top: 0, width: 0, height: 0 };
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  const rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  root.classList.add("vt-theme");
  const vt = document.startViewTransition(() => applyTheme(next));
  vt.ready.then(() => root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${rad}px at ${x}px ${y}px)`] },
    { duration: 620, easing: "cubic-bezier(.4,0,.2,1)", pseudoElement: "::view-transition-new(root)" }));
  vt.finished.finally(() => root.classList.remove("vt-theme"));
}

/** Runs `cb` after the theme changes, from the toggle or from the system setting. */
export function onThemeChange(cb: () => void) {
  document.addEventListener("themechange", cb);
  systemDark.addEventListener("change", () => requestAnimationFrame(cb));
}

export function initThemeButton() {
  document.getElementById("themeBtn")?.addEventListener("click", e => toggleTheme(e.currentTarget as Element));
}
