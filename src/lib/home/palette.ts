/** ⌘K command palette, plus the page's single-key shortcuts: / opens it, J and K step through time. */
import { EMAIL, RESUME, ROUTES, SOCIAL } from "~/config/links";
import { track } from "../analytics";
import { esc } from "../esc";
import { isJa, L, setLang } from "../i18n";
import { reduceMotion } from "../motion";
import { hideTip } from "../popover";
import { isDark, toggleTheme } from "../theme";
import { entryEl, flat } from "./data";
import { filterBy, replayIntro, scrollToEntry, stepEntry } from "./timeline";

type Cmd = { group: string; icon: string; label: string; sub?: string; keys?: string; keep?: boolean; run: (it: Cmd) => void; score?: number; hits?: number[] };

const ICO = {
  page: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 2.75h8l4 4V21.25H6z"/><path d="M14 2.75v4h4"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/></svg>',
  act: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 3 5 14h6l-1 7 8-11h-6z"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/></svg>',
};
const openLink = (href: string) => {
  const a = document.createElement("a"); a.href = href;
  if (/^https?:|\.pdf$/.test(href)) { a.target = "_blank"; a.rel = "noopener"; }
  document.body.append(a); a.click(); a.remove();
};
const jumpTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });

function commands(): Cmd[] {
  const tryIt = L("Try it", "試してみる"), pages = L("Pages", "ページ"), actions = L("Actions", "操作");
  return [
    ...flat.filter(e => !entryEl(e.id).classList.contains("hidden")).map(e => ({
      group: L("Timeline", "タイムライン"), icon: `<i class="${e.type}"></i>`, label: L(e.title, e.titleJa),
      sub: `${L(e.kind, e.kindJa)} · ${L(e.dates, e.datesJa).split(" – ")[0]}`, keys: `${e.kind} ${e.dates} ${e.skills.join(" ")} ${L(e.era, e.eraJa)}`,
      run: () => scrollToEntry(e.id),
    })),
    { group: tryIt, icon: ICO.act, label: L("Write a kanji", "漢字を書いてみる"), sub: "Kanji Kaku", keys: "kanji demo draw write 漢字", run: () => jumpTo("kk") },
    { group: tryIt, icon: ICO.act, label: L("Build a bundle", "バンドルを作る"), sub: "Bundle Builder", keys: "rebuy shopify widget cart", run: () => jumpTo("rw-bb") },
    { group: tryIt, icon: ICO.act, label: L("Unlock a free gift", "無料ギフトを選ぶ"), sub: "Selectable gift with purchase", keys: "rebuy shopify widget cart gwp", run: () => jumpTo("rw-gwp") },
    { group: pages, icon: ICO.page, label: L("How this site is built", "このサイトの作り方"), sub: L("Blog", "ブログ"), keys: "blog article ink maps", run: () => openLink(ROUTES.blog) },
    { group: pages, icon: ICO.page, label: L("About me", "自己紹介"), sub: L("Story, habits and toolbox", "経歴・仕事の進め方・スキル"), keys: "about bio story me who", run: () => openLink(ROUTES.about) },
    { group: pages, icon: ICO.page, label: L("Resume", "履歴書"), sub: "PDF", keys: "cv resume pdf", run: () => openLink(RESUME) },
    { group: pages, icon: ICO.link, label: "GitHub", sub: SOCIAL.github.handle, keys: "code source", run: () => openLink(SOCIAL.github.href) },
    { group: pages, icon: ICO.link, label: "LinkedIn", sub: SOCIAL.linkedin.handle, keys: "social", run: () => openLink(SOCIAL.linkedin.href) },
    { group: pages, icon: ICO.link, label: "Instagram", sub: SOCIAL.instagram.handle, keys: "social photos", run: () => openLink(SOCIAL.instagram.href) },
    { group: pages, icon: ICO.page, label: L("Contact", "連絡先"), sub: L("Get in touch", "お問い合わせ"), keys: "contact hire email reach", run: () => { track("contact"); jumpTo("contact"); } },
    { group: pages, icon: ICO.copy, label: L("Copy my email", "メールアドレスをコピー"), sub: EMAIL, keys: "contact mail email", keep: true,
      run: item => {
        track("email-copy");
        const done = (ok: boolean) => { item.sub = ok ? L("Copied", "コピーしました") : EMAIL; renderList(); };
        try { navigator.clipboard.writeText(EMAIL).then(() => done(true), () => done(false)); } catch { done(false); }
      } },
    { group: actions, icon: ICO.act, label: isDark() ? L("Switch to light theme", "ライトテーマにする") : L("Switch to dark theme", "ダークテーマにする"), keys: "theme dark light mode color", run: () => toggleTheme() },
    { group: actions, icon: ICO.act, label: isJa() ? "Switch to English" : "日本語に切り替え", sub: isJa() ? "EN" : "JA", keys: "language japanese english lang 言語", run: () => setLang(isJa() ? "en" : "ja", true) },
    { group: actions, icon: ICO.act, label: L("Replay the intro", "イントロを再生"), keys: "animation sweep timeline", run: replayIntro },
    { group: actions, icon: ICO.act, label: L("Show only work", "仕事だけを表示"), keys: "filter jobs", run: () => filterBy("work") },
    { group: actions, icon: ICO.act, label: L("Show only projects", "個人開発だけを表示"), keys: "filter side", run: () => filterBy("project") },
    { group: actions, icon: ICO.act, label: L("Show everything", "すべて表示"), keys: "filter all reset", run: () => filterBy("all") },
  ];
}

/** Subsequence match: consecutive letters and word starts score higher. */
function match(q: string, text: string) {
  const t = text.toLowerCase(); let ti = 0, score = 0, prev = -2; const hits: number[] = [];
  for (const ch of q) {
    const i = t.indexOf(ch, ti); if (i < 0) return null;
    score += 1 + (i === prev + 1 ? 3 : 0) + (i === 0 || /[\s\-·./(]/.test(t[i - 1]) ? 2 : 0);
    hits.push(i); prev = i; ti = i + 1;
  }
  return { score: score - t.length * .01, hits };
}

let el: HTMLElement | null = null, items: Cmd[] = [], sel = 0, returnTo: Element | null = null;

function renderList() {
  if (!el) return;
  const list = el.querySelector(".cmdk-list")!, input = el.querySelector("input")!;
  if (!items.length) {
    list.innerHTML = `<li class="cmdk-empty" role="presentation">${L("Nothing matches. Try “kanji”, “bundle” or “2019”.", "一致する項目がありません。「kanji」や「2019」を試してください。")}</li>`;
    input.removeAttribute("aria-activedescendant");
    return;
  }
  let html = "", g: string | null = null;
  items.forEach((it, i) => {
    if (it.group !== g) { g = it.group; html += `<li class="cmdk-group" role="presentation">${esc(g)}</li>`; }
    const lb = it.hits ? [...it.label].map((c, k) => it.hits!.includes(k) ? `<mark>${esc(c)}</mark>` : esc(c)).join("") : esc(it.label);
    html += `<li class="cmdk-item" role="option" id="cmdk-${i}" data-i="${i}" aria-selected="${i === sel}"><span class="ic">${it.icon}</span><span class="lb">${lb}</span>${it.sub ? `<span class="sb">${esc(it.sub)}</span>` : ""}</li>`;
  });
  list.innerHTML = html;
  input.setAttribute("aria-activedescendant", "cmdk-" + sel);
  list.querySelector(`#cmdk-${sel}`)?.scrollIntoView({ block: "nearest" });
}

function filterCmds(q: string) {
  q = q.trim().toLowerCase();
  const all = commands();
  items = !q ? all : all.flatMap((it): Cmd[] => {
    const m = match(q, it.label); if (m) return [{ ...it, score: m.score + 5, hits: m.hits }];
    const k = match(q, it.keys || ""); return k ? [{ ...it, score: k.score }] : [];
  }).sort((a, b) => b.score! - a.score!);
  sel = 0; renderList();
}

function open() {
  if (el) return;
  hideTip(); returnTo = document.activeElement;
  el = document.createElement("div");
  el.className = "cmdk-wrap";
  el.innerHTML = `<div class="cmdk" role="dialog" aria-modal="true" aria-label="${L("Command menu", "コマンドメニュー")}">
    <div class="cmdk-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <input type="text" id="cmdkInput" role="combobox" aria-expanded="true" aria-controls="cmdkList" aria-autocomplete="list" autocomplete="off" spellcheck="false" placeholder="${L("Jump to a moment, page or action…", "時期、ページ、操作を検索…")}"><kbd>esc</kbd></div>
    <ul class="cmdk-list" id="cmdkList" role="listbox" aria-label="${L("Results", "結果")}"></ul>
    <div class="cmdk-foot"><span><kbd>↑</kbd><kbd>↓</kbd>${L("move", "移動")}</span><span><kbd>↵</kbd>${L("open", "開く")}</span><span><kbd>J</kbd><kbd>K</kbd>${L("step through time on the page", "ページ上で時間をたどる")}</span></div></div>`;
  document.body.append(el);
  const input = el.querySelector("input")!, list = el.querySelector<HTMLElement>(".cmdk-list")!;
  input.addEventListener("input", () => filterCmds(input.value));
  input.addEventListener("keydown", e => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); if (items.length) { sel = (sel + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length; renderList(); } }
    else if (e.key === "Enter") { e.preventDefault(); run(sel); }
    else if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "Tab") e.preventDefault();
  });
  list.addEventListener("pointermove", e => { const li = (e.target as Element).closest<HTMLElement>(".cmdk-item"); if (li && +li.dataset.i! !== sel) { sel = +li.dataset.i!; renderList(); } });
  list.addEventListener("click", e => { const li = (e.target as Element).closest<HTMLElement>(".cmdk-item"); if (li) run(+li.dataset.i!); });
  el.addEventListener("pointerdown", e => { if (e.target === el) close(); });
  filterCmds(""); input.focus();
}

function close() {
  if (!el) return;
  el.remove(); el = null;
  if (returnTo instanceof HTMLElement) returnTo.focus({ preventScroll: true });
}

function run(i: number) {
  const it = items[i]; if (!it) return;
  if (it.keep) { it.run(it); return; }
  close(); setTimeout(() => it.run(it), 30);
}

const typing = (t: EventTarget | null) => t instanceof Element && t.closest("input, textarea, select, [contenteditable], .kk-pad");

export function initPalette() {
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  document.querySelectorAll(".cmdk-key").forEach(k => k.textContent = isMac ? "⌘K" : "Ctrl K");
  document.getElementById("cmdkBtn")?.addEventListener("click", open);
  addEventListener("keydown", e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); el ? close() : open(); return; }
    if (el || e.metaKey || e.ctrlKey || e.altKey || typing(e.target)) return;
    if (e.key === "/") { e.preventDefault(); open(); }
    else if (e.key === "j" || e.key === "J") { e.preventDefault(); stepEntry(1); }
    else if (e.key === "k" || e.key === "K") { e.preventDefault(); stepEntry(-1); }
  });
}
