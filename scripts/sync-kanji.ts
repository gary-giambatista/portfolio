/**
 * Builds the Kanji Kaku demo data: the 15 Lesson 1 kanji with their meanings, readings, mnemonic
 * stories and stroke data, trimmed to exactly what the writing pad needs.
 *
 * kanji-kaku is a private repo, so this runs locally (it reads the file through the `gh` CLI)
 * and the output is committed. CI never needs access to kanji-kaku. The repo is only read.
 *
 *   npm run data:kanji
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname } from "node:path";

const REPO = "gary-giambatista/kanji-kaku";
const FILE = "curriculum/lesson-01.draft.json";
const OUT = "src/data/generated/kanji-lesson1.json";

type Segment = { type: "keyword" | "text" | "primitive"; text: string; primitiveCrossEnvironmentId?: string };
type Lesson = {
  primitives: { primitiveCrossEnvironmentId: string; primaryGlyph: string; englishMeaning: string }[];
  kanji: {
    character: string; kanjiPositionInLesson: number; englishMeaning: string; japanesePromptHiragana: string;
    onReadings: string[]; kunReadings: string[]; strokeCount: number; mnemonicStory: Segment[];
  }[];
};

const raw = execFileSync("gh", ["api", `repos/${REPO}/contents/${FILE}`, "--jq", ".content"], { encoding: "utf8" });
const lesson: Lesson = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
const prims = new Map(lesson.primitives.map(p => [p.primitiveCrossEnvironmentId, p]));

const require = createRequire(import.meta.url);
const strokeData = (c: string) => {
  const file = require.resolve(`@k1low/hanzi-writer-data-jp/${c}.json`);
  const { strokes, medians } = JSON.parse(readFileSync(file, "utf8"));
  return { strokes, medians, radStrokes: [] };
};

const out = [...lesson.kanji].sort((a, b) => a.kanjiPositionInLesson - b.kanjiPositionInLesson).map(k => ({
  c: k.character,
  m: k.englishMeaning,
  p: k.japanesePromptHiragana,
  on: k.onReadings,
  kun: k.kunReadings,
  n: k.strokeCount,
  s: k.mnemonicStory.map(seg => {
    if (seg.type === "keyword") return { t: "k", x: seg.text };
    if (seg.type === "primitive") {
      const p = prims.get(seg.primitiveCrossEnvironmentId!);
      if (!p) throw new Error(`Unknown primitive ${seg.primitiveCrossEnvironmentId} in ${k.character}`);
      return { t: "p", x: seg.text, g: p.primaryGlyph, m: p.englishMeaning };
    }
    return { t: "t", x: seg.text };
  }),
  d: strokeData(k.character),
}));

for (const k of out) {
  if (k.d.strokes.length !== k.n) throw new Error(`${k.c}: ${k.d.strokes.length} strokes in data, ${k.n} in lesson`);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(out));
console.log(`Wrote ${out.length} kanji to ${OUT} (${(JSON.stringify(out).length / 1024).toFixed(1)} KB)`);
