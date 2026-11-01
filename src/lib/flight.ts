/**
 * The flight path between New Jersey and Japan, shared by the timeline and the blog's demo:
 * a curve shaped like a route on an airline map, and a plane placed along it.
 */
/** Ease in-out, like a takeoff and landing. */
export const easeInOut = (p: number) => p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

export const routePath = (x0: number, x1: number, yb: number) =>
  `M${x0},${yb} C${x0 + (x1 - x0) * .3},-10 ${x0 + (x1 - x0) * .7},-10 ${x1},${yb}`;

/** Where the plane sits at eased progress `p`: position, heading (radians) from a point just ahead, and a mid-flight climb. */
export function planeAt(path: SVGPathElement, len: number, p: number) {
  const L = len * p, pt = path.getPointAtLength(L);
  const pa = path.getPointAtLength(Math.max(0, L - 1)), pb = path.getPointAtLength(Math.min(len, L + 1));
  const ang = Math.atan2(pb.y - pa.y, pb.x - pa.x);
  const scale = .78 + Math.sin(p * Math.PI) * .32; // climbs toward the viewer mid-flight
  return { x: pt.x, y: pt.y, ang, scale, L, transform: `translate(${pt.x} ${pt.y}) rotate(${ang * 180 / Math.PI}) scale(${scale})` };
}
