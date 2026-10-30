# gary-giambatista.com

Personal portfolio of Gary Giambatista: a timeline home page (present at the top, scroll down to go back in time), an About page, and a blog post with live demos. Static site built with [Astro](https://astro.build), deployed to GitHub Pages.

Pages ship plain HTML and CSS plus small TypeScript modules. There is no client-side framework. Hanzi Writer and the kanji stroke data load only when the writing pad nears the viewport.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server at http://localhost:4321 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the build locally |
| `npm run check` | Type-check everything (`astro check`) |
| `npm run data:maps` | Rebuild the location-card maps from Natural Earth |
| `npm run data:fonts` | Rebuild the Japanese font subsets |
| `npm run data:kanji` | Re-sync Lesson 1 from kanji-kaku (needs `gh` access to that private repo) |

Node 24 (see `.nvmrc`). The build downloads the Latin fonts from Google Fonts, so it needs network access.

## Where things live

```
src/
  config/links.ts          every outbound or volatile link (TestFlight, Android build, socials, routes)
  content/timeline.ts      the timeline: eras and entries, English with Japanese alongside
  content/blog/*.mdx       blog posts (frontmatter: title, description, published, readingTime, toc)
  content/placeholder-shots.ts   unused drawn placeholder illustrations, kept for later
  data/generated/          build-time data (committed): maps, kanji, raw Hoboken paths
  lib/                     client modules (no framework)
    ink/                   the brush engine: seeded RNG, stroke builders, painter, <canvas class="ink"> controller
    home/                  timeline-only: ruler and scroll sync, spine ink, flights, ⌘K palette
    widgets/               Bundle Builder and Gift with Purchase demos
    popover.ts, placement.ts, theme.ts, i18n.ts, kanji-pad.ts, flight.ts, ...
  components/              Astro components (server-rendered HTML)
  pages/                   index, about, blog/[slug], 404
  styles/                  tokens.css (design tokens), base.css, one file per page or component
scripts/                   build-time data scripts (maps, fonts, kanji)
public/                    CNAME, resume PDF, favicon, Japanese font subsets
```

## Common edits

- **A link changed** (for example the Android build): edit `src/config/links.ts`. Nothing else needs to change.
- **Timeline copy**: edit the entry in `src/content/timeline.ts`. `sub` may contain `<b>`. Japanese goes in the entry's `ja` block.
- **New Japanese copy anywhere**: run `npm run data:fonts` afterwards. The Japanese fonts are subset to exactly the characters the site uses, so a new kanji won't render in Shippori Mincho or Plex Sans JP until the subsets are rebuilt.
- **New blog post**: add `src/content/blog/<slug>.mdx`. It's served at `/blog/<slug>/`.
- **Screenshots**: put the image in `src/assets/img/`, add its key to the `Shot` type and the `IMAGES` map in `src/components/Entry.astro`, and set `shot` on the entry. Astro outputs responsive WebP.

## Languages

The home page is bilingual. Both languages are in the DOM (`.l-en` and `.l-ja` spans) and CSS shows the active one, so switching never re-renders. The Japanese is a draft awaiting review by a native speaker; corrections go in the `ja` blocks of `src/content/timeline.ts`, the hero and contact markup, and `JA_PLACE`.

The blog, About page, widgets and kanji pad are English-only for now. To add Japanese to a component, wrap each string in `<T en="…" ja="…" />` (`src/components/T.astro`), use `L(en, ja)` for script-generated text (`src/lib/i18n.ts`), and pass `bilingual` to the page's `Base` layout so the visitor's language is restored before paint.

## Kanji Kaku video (not added yet)

`src/components/PhoneVideo.astro` is ready for the screen recording: a muted, looping video in a phone frame with a poster. It loads only near the viewport and never autoplays with reduced motion. To add it:

```sh
# 1. Compress (no audio, 590px wide, 30 fps). Aim for about 1 MB per 15 seconds.
ffmpeg -i recording.mov -an -vf "scale=590:-2,fps=30" -c:v libsvtav1 -crf 38 -preset 6 -pix_fmt yuv420p -movflags +faststart public/video/kanji-kaku.av1.mp4
ffmpeg -i recording.mov -an -vf "scale=590:-2,fps=30" -c:v libx264 -profile:v high -preset slow -crf 26 -pix_fmt yuv420p -movflags +faststart public/video/kanji-kaku.h264.mp4
# 2. Poster frame: pick a moment that reads well as a still.
ffmpeg -ss 2 -i recording.mov -frames:v 1 -vf "scale=590:-2" src/assets/video/kanji-kaku-poster.png
```

Then render `<PhoneVideo>` where the video should go (usage is in the component's header comment).

## Data sources

- **Maps:** [Natural Earth](https://www.naturalearthdata.com/) 1:10m land, lakes and rivers, projected with d3-geo. The projections are fitted to the original design; `scripts/build-maps.ts` has the per-card scale and translate.
- **Skill icons:** [simple-icons](https://simpleicons.org/), read at build time, plus five custom glyphs in `src/components/IconSprite.astro`.
- **Kanji:** Lesson 1 from the private kanji-kaku repo (read-only) plus stroke data from `@k1low/hanzi-writer-data-jp` (animCJK and Make Me a Hanzi). Output is committed, so CI never needs kanji-kaku access.
- **Fonts:** Shippori Mincho B1 and IBM Plex Sans, Mono and Sans JP, all self-hosted.

## Deploying

`.github/workflows/deploy.yml` type-checks, builds and publishes `dist/` to GitHub Pages on every push to `main`. The repo's Pages source must be set to **GitHub Actions**. The custom domain is set in the repo's Pages settings; `public/CNAME` documents it, but an Actions deployment doesn't rely on it.

Kanji Kaku is closed source: never link its repository.
