// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://gary-giambatista.com",
  trailingSlash: "ignore",
  integrations: [mdx(), sitemap()],
  build: { inlineStylesheets: "auto" },
  prefetch: { prefetchAll: false, defaultStrategy: "hover" },
  // Fonts are downloaded at build time and served from this site, with metric-matched fallbacks.
  fonts: [
    { provider: fontProviders.google(), name: "Shippori Mincho B1", cssVariable: "--ff-mincho", weights: [500, 700, 800], styles: ["normal"], subsets: ["latin"], fallbacks: ["Hiragino Mincho ProN", "Georgia", "serif"] },
    { provider: fontProviders.google(), name: "IBM Plex Sans", cssVariable: "--ff-plex-sans", weights: [400, 500, 600], styles: ["normal"], subsets: ["latin"], fallbacks: ["Helvetica Neue", "Arial", "sans-serif"] },
    { provider: fontProviders.google(), name: "IBM Plex Mono", cssVariable: "--ff-plex-mono", weights: [400, 500], styles: ["normal"], subsets: ["latin"], fallbacks: ["ui-monospace", "Menlo", "monospace"] },
    { provider: fontProviders.google(), name: "IBM Plex Sans JP", cssVariable: "--ff-plex-jp", weights: [400, 500, 600], styles: ["normal"], subsets: ["japanese"], fallbacks: ["Hiragino Sans", "sans-serif"] },
  ],
});
