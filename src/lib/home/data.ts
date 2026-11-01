/** The slice of timeline data the browser needs (titles, dates, types), read from the JSON the page embeds. */
export type EntryIndex = {
  id: string; type: "work" | "project" | "learning"; start: number; end: number | null;
  title: string; titleJa: string; kind: string; kindJa: string; dates: string; datesJa: string;
  startEn: string; startJa: string; skills: string[]; era: string; eraJa: string;
};
export type TimelineData = { entries: EntryIndex[]; now: number; min: number; max: number };

export const data: TimelineData = JSON.parse(document.getElementById("timeline-data")!.textContent!);
export const flat = data.entries;
export const entryEl = (id: string) => document.getElementById(id)!;
export const isHidden = (id: string) => entryEl(id).classList.contains("hidden");
export const visibleEntries = () => flat.filter(e => !isHidden(e.id));
