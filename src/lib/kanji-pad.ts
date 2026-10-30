/**
 * Kanji Kaku writing pad: real Lesson 1 data and the same stroke checking the app uses (Hanzi Writer).
 * The picker and prompt text ship with the page; Hanzi Writer and the stroke data load only when the pad
 * nears the viewport.
 */
import type HanziWriterType from "hanzi-writer";
import { padLabel, readingOf, storyHtml, strokeCount, type KanjiText } from "./kanji-text";
import { onThemeChange } from "./theme";

type StrokeData = { strokes: string[]; medians: number[][][]; radStrokes: number[] };

const TOLERANCE: Record<string, number> = { strict: .75, standard: 1, relaxed: 1.5, forgiving: 2 };

export function initKanjiPad(root: HTMLElement | null) {
  if (!root) return;
  const $ = <T extends Element = HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const KK: KanjiText[] = JSON.parse($(".kk-data").textContent!);
  const pad = $(".kk-pad"), host = $(".kk-writer"), msg = $(".kk-msg"), count = $(".kk-count"), picker = $(".kk-picker");
  const guideBtn = $("[data-kk=guide]"), tolSel = $<HTMLSelectElement>(".kk-tol select");
  let idx = KK.findIndex(k => k.c === "日"), guide = true, started = false;
  let writer: HanziWriterType | null = null, nextBtn: HTMLButtonElement | null = null;
  let HanziWriter: typeof HanziWriterType | null = null, strokes: Record<string, StrokeData> = {};
  const cur = () => KK[idx];
  const css = (name: string) => getComputedStyle(root).getPropertyValue(name).trim();

  function say(text: string, tone = "") { msg.textContent = text; msg.className = "kk-msg" + (tone ? " " + tone : ""); }

  function renderPrompt() {
    const k = cur();
    $(".kk-meaning").textContent = k.m;
    $(".kk-reading").textContent = readingOf(k);
    count.textContent = strokeCount(0, k);
    pad.setAttribute("aria-label", padLabel(k));
    $(".kk-story").innerHTML = storyHtml(k);
    picker.querySelectorAll("button").forEach((b, i) => b.setAttribute("aria-pressed", String(i === idx)));
  }

  function startQuiz() {
    if (!writer) return;
    pad.classList.remove("miss", "win");
    if (nextBtn) { nextBtn.remove(); nextBtn = null; }
    const k = cur(), leniency = TOLERANCE[tolSel.value];
    count.textContent = strokeCount(0, k);
    say("Write the strokes in order.");
    guide ? writer.showOutline() : writer.hideOutline();
    writer.quiz({
      leniency, acceptBackwardsStrokes: false, showHintAfterMisses: false, highlightOnComplete: true,
      onMistake: d => {
        pad.classList.add("miss"); setTimeout(() => pad.classList.remove("miss"), 450);
        say(d.mistakesOnStroke >= 2 && !guide ? "Try that stroke again. The guide or Watch can help." : "Try that stroke again.", "bad");
      },
      onCorrectStroke: d => { count.textContent = strokeCount(d.strokeNum + 1, k); say(d.strokesRemaining ? "Keep going." : ""); },
      onComplete: sum => {
        pad.classList.add("win");
        picker.children[idx].classList.add("done");
        const m = sum.totalMistakes;
        say(`Complete! ${k.n} stroke${k.n > 1 ? "s" : ""}, ${m ? `${m} miss${m > 1 ? "es" : ""}` : "no misses"}.`, "good");
        nextBtn = document.createElement("button");
        nextBtn.type = "button"; nextBtn.className = "kk-btn primary"; nextBtn.textContent = "Next kanji →";
        nextBtn.addEventListener("click", () => choose((idx + 1) % KK.length));
        $(".kk-tools").prepend(nextBtn);
      },
    });
  }

  function build() {
    if (!HanziWriter) return;
    const size = Math.round(pad.clientWidth);
    host.innerHTML = "";
    writer = HanziWriter.create(host, cur().c, {
      width: size, height: size, padding: Math.round(size * .07),
      showCharacter: false, showOutline: guide,
      strokeColor: css("--brush"), drawingColor: css("--brush"), outlineColor: css("--kk-guide"),
      highlightColor: css("--indigo"), highlightCompleteColor: css("--indigo"),
      drawingWidth: Math.max(14, size * .05), strokeAnimationSpeed: 1.1, delayBetweenStrokes: 220,
      charDataLoader: (ch, done) => done(strokes[ch]),
      onLoadCharDataSuccess: () => { if (started) startQuiz(); },
    });
    started = true;
  }

  function choose(i: number) {
    idx = i; renderPrompt();
    if (writer) writer.setCharacter(cur().c).then(startQuiz);
  }

  let booting: Promise<void> | null = null;
  const boot = () => booting ??= Promise.all([import("hanzi-writer"), import("~/data/generated/kanji-lesson1.json")])
    .then(([hw, data]) => {
      HanziWriter = hw.default;
      strokes = Object.fromEntries((data.default as { c: string; d: StrokeData }[]).map(k => [k.c, k.d]));
      build();
    })
    .catch(() => { host.innerHTML = `<div class="kk-fallback">The writing pad could not load here. Try Kanji Kaku itself on TestFlight or Android.</div>`; });

  picker.addEventListener("click", e => { const b = (e.target as Element).closest<HTMLElement>("button[data-i]"); if (b) choose(+b.dataset.i!); });
  $("[data-kk=watch]").addEventListener("click", () => {
    if (!writer) return;
    writer.cancelQuiz(); pad.classList.remove("miss", "win");
    say("Watch the stroke order…");
    writer.hideOutline();
    writer.animateCharacter({ onComplete: () => setTimeout(startQuiz, 500) });
  });
  $("[data-kk=reset]").addEventListener("click", startQuiz);
  guideBtn.addEventListener("click", () => {
    guide = !guide; guideBtn.setAttribute("aria-pressed", String(guide));
    if (writer) guide ? writer.showOutline() : writer.hideOutline();
  });
  tolSel.addEventListener("change", startQuiz);
  renderPrompt();

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); boot(); } }, { rootMargin: "300px" });
    io.observe(root);
  } else boot();
  let lastW = 0;
  addEventListener("resize", () => { const w = Math.round(pad.clientWidth); if (writer && Math.abs(w - lastW) > 2) { lastW = w; build(); } });
  onThemeChange(() => { if (writer) build(); });
}
