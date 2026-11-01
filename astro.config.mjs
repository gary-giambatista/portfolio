// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

/**
 * Google serves Japanese-capable families as ~120 unlabeled unicode-range slices, and Astro would list every one.
 * Passing exactly the characters of the latin and latin-ext slices as `glyphs` keeps those two slices and drops
 * the rest. Japanese glyphs come from subset files instead (scripts/build-cjk-fonts.ts, src/styles/fonts-cjk.css).
 */
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
/** @param {string} family */
async function latinGlyphs(family) {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}`, { headers: { "user-agent": UA } })).text();
  const glyphs = new Set();
  for (const [, subset, body] of css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*{([^}]*)}/g)) {
    if (subset !== "latin" && subset !== "latin-ext") continue;
    for (const part of body.match(/unicode-range:\s*([^;]+);/)?.[1].split(",") ?? []) {
      const [a, b = a] = part.trim().replace(/^U\+/i, "").split("-").map(h => parseInt(h, 16));
      for (let cp = a; cp <= b; cp++) glyphs.add(String.fromCodePoint(cp));
    }
  }
  if (!glyphs.size) throw new Error(`No latin ranges found for ${family}`);
  return [...glyphs];
}
const latin = async (/** @type {string} */ family) => ({ experimental: { glyphs: await latinGlyphs(family) } });

export default defineConfig({
  site: "https://gary-giambatista.com",
  trailingSlash: "ignore",
  integrations: [mdx(), sitemap()],
  build: { inlineStylesheets: "auto" },
  // Keep the approved copy exactly as written (no automatic curly quotes).
  markdown: { smartypants: false },
  // Fonts are downloaded at build time and served from this site, with metric-matched fallbacks.
  fonts: [
    { provider: fontProviders.google(), name: "Shippori Mincho B1", cssVariable: "--ff-mincho", weights: [500, 700, 800], styles: ["normal"], subsets: ["latin", "latin-ext"],
      fallbacks: ["Shippori Mincho B1 CJK", "Hiragino Mincho ProN", "Georgia", "serif"], options: await latin("Shippori Mincho B1") },
    { provider: fontProviders.google(), name: "IBM Plex Sans", cssVariable: "--ff-plex-sans", weights: [400, 500, 600], styles: ["normal"], subsets: ["latin", "latin-ext"],
      fallbacks: ["IBM Plex Sans JP CJK", "Hiragino Sans", "Helvetica Neue", "Arial", "sans-serif"], options: await latin("IBM Plex Sans") },
    { provider: fontProviders.google(), name: "IBM Plex Mono", cssVariable: "--ff-plex-mono", weights: [400, 500], styles: ["normal"], subsets: ["latin", "latin-ext"],
      fallbacks: ["IBM Plex Sans JP CJK", "ui-monospace", "Menlo", "monospace"], options: await latin("IBM Plex Mono") },
  ],
});
