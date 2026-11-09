/**
 * Every outbound or volatile link in one place. The Android build link changes with each Expo build,
 * so update ANDROID_BUILD here and nowhere else.
 */
export const EMAIL = "gary.giambatista@gmail.com";
export const RESUME = "/gary-giambatista-resume-public.pdf";
/** The site's own commit history, linked from the footer's "Updated" date. */
export const SITE_HISTORY = "https://github.com/gary-giambatista/portfolio/commits/main/";

export const TESTFLIGHT = "https://testflight.apple.com/join/y8edJzEH";
export const ANDROID_BUILD = "https://expo.dev/accounts/ggg3/projects/kanji-kaku/builds/cd4c606f-9475-402e-8aea-aa44adc680d7";

export const SOCIAL = {
  github: { href: "https://github.com/gary-giambatista", handle: "@gary-giambatista" },
  linkedin: { href: "https://www.linkedin.com/in/gary-giambatista/", handle: "in/gary-giambatista" },
  instagram: { href: "https://www.instagram.com/garygiambatista/", handle: "@garygiambatista" },
} as const;

export const PROJECTS = {
  youfilterSite: "https://youfilter.vercel.app/",
  youfilterSource: "https://github.com/gary-giambatista/youtube-filter",
  spacedCardsSite: "https://spaced-cards-azure.vercel.app/",
  spacedCardsSource: "https://github.com/gary-giambatista/spaced-cards",
  katacardSite: "https://katacard.vercel.app/",
  katacardSource: "https://github.com/gary-giambatista/katacard",
} as const;

/** Internal routes, so a URL change is one edit. */
export const ROUTES = {
  home: "/",
  contact: "/#contact",
  about: "/about/",
  blog: "/blog/how-its-built/",
} as const;
