/** Copy the email address, falling back to selecting it so ⌘C works. */
import { EMAIL } from "~/config/links";
import { track } from "./analytics";
import { L } from "./i18n";

export function initCopyEmail(button: HTMLElement | null, out: HTMLElement | null) {
  if (!button || !out) return;
  button.addEventListener("click", () => {
    track("email-copy");
    const fallback = () => {
      const r = document.createRange(); r.selectNodeContents(button.querySelector(".email") || button);
      const sel = getSelection()!; sel.removeAllRanges(); sel.addRange(r);
      out.textContent = L("Selected. Press ⌘C or Ctrl C to copy.", "選択しました。⌘C または Ctrl C でコピーしてください。");
    };
    try { navigator.clipboard.writeText(EMAIL).then(() => { out.textContent = L("Copied to your clipboard.", "クリップボードにコピーしました。"); }, fallback); }
    catch { fallback(); }
  });
}
