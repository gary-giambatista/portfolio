/**
 * Popover placement, shared by the site-wide popover and the blog's playground: center above the target,
 * flip below when there's no room, slide inward near the sides, and keep the arrow pointing at the target.
 */
export type Placement = { x: number; top: number; below: boolean; ax: number; ideal: number };

export function placePopover(
  target: { left: number; top: number; width: number; bottom: number },
  pw: number, ph: number, boundsWidth: number, minTop: number, gap = 10,
): Placement {
  const cx = target.left + target.width / 2, ideal = cx - pw / 2;
  const x = Math.max(8, Math.min(boundsWidth - pw - 8, ideal));
  const below = target.top - ph - gap < minTop;
  return { x, top: below ? target.bottom + gap : target.top - ph - gap, below, ax: Math.max(12, Math.min(pw - 12, cx - x)), ideal };
}
