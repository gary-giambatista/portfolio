/**
 * EN/日本語: every translatable spot carries both versions in the DOM and CSS shows the active one,
 * so switching never re-renders anything. Script-generated text asks L() for the active language.
 */
import { reduceMotion } from "./motion";

const root = document.documentElement;
export type Lang = "en" | "ja";

export const isJa = () => root.lang === "ja";
export const L = (en: string, ja?: string | null) => isJa() && ja ? ja : en;

export function setLang(lang: Lang, animate = false) {
  const apply = () => {
    root.lang = lang;
    document.querySelectorAll<HTMLElement>("[data-lang]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    document.dispatchEvent(new CustomEvent("langchange"));
  };
  try { localStorage.setItem("lang", lang); } catch { /* private mode */ }
  if (animate && document.startViewTransition && !reduceMotion) document.startViewTransition(apply); else apply();
}

export const onLangChange = (cb: () => void) => document.addEventListener("langchange", cb);

export function initLangToggle() {
  document.querySelectorAll<HTMLElement>("[data-lang]").forEach(b => b.addEventListener("click", () => {
    if (b.dataset.lang !== root.lang) setLang(b.dataset.lang as Lang, true);
  }));
  setLang(isJa() ? "ja" : "en");
}
