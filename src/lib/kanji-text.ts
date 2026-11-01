/** Kanji pad text, shared by the server render and the browser so the first paint matches what the script shows. */
import { esc } from "./esc";

export type StorySeg = { t: "k" | "t" | "p"; x: string; g?: string; m?: string };
export type KanjiText = { c: string; m: string; p: string; on: string[]; n: number; s: StorySeg[] };

export const readingOf = (k: KanjiText) => `${k.p} · ${k.on[0] || ""}`;
export const strokeCount = (done: number, k: KanjiText) => `Stroke ${done} of ${k.n}`;
export const padLabel = (k: KanjiText) => `Writing pad. Draw ${k.c}, ${k.m}, in ${k.n} strokes.`;
/** The mnemonic story: keywords in bold, primitives with a popover naming the building block. */
export const storyHtml = (k: KanjiText) => k.s.map(seg => seg.t === "k" ? `<b>${esc(seg.x)}</b>`
  : seg.t === "p" ? `<span class="prim" tabindex="0" data-tip="${esc(seg.g)} · ${esc(seg.m)}" data-tip-sub="Primitive: a building block reused across kanji">${esc(seg.x)}</span>` : esc(seg.x)).join("");
