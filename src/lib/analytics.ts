/**
 * Custom Umami events; page views are automatic. Umami's own data-umami-event attribute holds internal links
 * back until its request finishes, so one listener calls track() instead and navigation is never delayed.
 * If the script is blocked, every call here does nothing.
 */
import { ANDROID_BUILD, RESUME, ROUTES, SOCIAL, TESTFLIGHT } from "~/config/links";

declare global { interface Window { umami?: { track(event: string): unknown } } }

const LINKS: Record<string, string> = {
  "#contact": "contact",
  [ROUTES.contact]: "contact",
  [RESUME]: "resume",
  [TESTFLIGHT]: "testflight",
  [ANDROID_BUILD]: "android-build",
  [SOCIAL.github.href]: "github",
  [SOCIAL.linkedin.href]: "linkedin",
  [SOCIAL.instagram.href]: "instagram",
};
const DEMOS: Record<string, string> = { kk: "demo-kanji-kaku", "rw-bb": "demo-bundle-builder", "rw-gwp": "demo-gift-with-purchase" };

export const track = (event: string) => { window.umami?.track(event); };

const seen = new Set<string>();
/** A demo counts once per page load, however many times it is used. */
export function trackDemo(id: string) {
  if (seen.has(id)) return;
  seen.add(id);
  track(DEMOS[id]);
}

export function initAnalytics() {
  // Capture phase: some demo buttons replace themselves on click, and would be detached by the time it bubbled.
  document.addEventListener("click", e => {
    const el = (e.target as Element).closest("a, button, input, select");
    if (!el) return;
    const event = LINKS[el.getAttribute("href") ?? ""];
    if (event) track(event);
    const demo = el.closest("#kk, #rw-bb, #rw-gwp");
    if (demo) trackDemo(demo.id);
  }, true);
}
