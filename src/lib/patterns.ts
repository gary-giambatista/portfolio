/**
 * Traditional Japanese patterns as seamless SVG tiles, generated at build time for the timeline's badges:
 * kikkō hanabishi (tortoiseshell hexagons with a flower: work), bishamon kikkō (three hexagons nested around a
 * point: personal projects) and seigaiha (wave scales: learning). Each tile is drawn in a theme's colors like
 * indigo-dyed cloth: a dyed ground with pale resist lines.
 */
export type Dye = { ground: string; mid: string; line: string };

const f = (n: number) => +n.toFixed(1);
const SQ3 = Math.sqrt(3);
/** Tiles are whole pixels (stretched imperceptibly), so repeats never leave a hairline seam. */
const svg = (w: number, h: number, body: string, ground: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(w)}" height="${Math.round(h)}" viewBox="0 0 ${f(w)} ${f(h)}" preserveAspectRatio="none"><rect x="-1" y="-1" width="${f(w + 2)}" height="${f(h + 2)}" fill="${ground}"/>${body}</svg>`;
const poly = (pts: number[][]) => pts.map(([x, y], i) => `${i ? "L" : "M"}${f(x)} ${f(y)}`).join("") + "Z";
/** Flat-topped hexagon corners around (cx, cy). */
const hex = (cx: number, cy: number, r: number) => Array.from({ length: 6 }, (_, k) => [cx + r * Math.cos(Math.PI / 3 * k), cy + r * Math.sin(Math.PI / 3 * k)]);
/** Axial (q, s) to the centre of a flat-topped hexagon of radius r. */
const centre = (q: number, s: number, r: number) => [r * 1.5 * q, r * SQ3 * (s + q / 2)];

/** Kikkō hanabishi: a tortoiseshell grid, each shell double-lined with a small five-petal flower inside. */
export function kikko(d: Dye, r = 6) {
  const W = 3 * r, H = SQ3 * r;
  let lines = "", fills = "";
  for (let q = -1; q <= 3; q++) for (let s = -2; s <= 2; s++) {
    const [cx, cy] = centre(q, s, r);
    if (cx < -r || cx > W + r || cy < -r || cy > H + r) continue;
    lines += poly(hex(cx, cy, r)) + poly(hex(cx, cy, r * .74));
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + k * 2 * Math.PI / 5;
      fills += `<circle cx="${f(cx + Math.cos(a) * r * .24)}" cy="${f(cy + Math.sin(a) * r * .24)}" r="${f(r * .15)}"/>`;
    }
    fills += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * .07)}" fill="${d.ground}"/>`;
  }
  return svg(W, H, `<path d="${lines}" fill="none" stroke="${d.line}" stroke-width="${f(r * .1)}"/><g fill="${d.mid}">${fills}</g>`, d.ground);
}

/**
 * Bishamon kikkō: hexagons grouped in threes around a shared corner, each group outlined and nested twice
 * toward that corner. Groups are the hex at every point of the (q + 2s ≡ 0 mod 3) sublattice plus its two
 * neighbours around its right-hand corner, which tiles the plane exactly.
 */
export function bishamon(d: Dye, r = 3.6) {
  const W = 3 * r, H = 3 * SQ3 * r;
  const key = (p: number[]) => `${Math.round(p[0] * 100)},${Math.round(p[1] * 100)}`;
  let outer = "", inner = "";
  for (let q = -3; q <= 5; q++) for (let s = -4; s <= 5; s++) {
    if ((((q + 2 * s) % 3) + 3) % 3 !== 0) continue;
    const [vx, vy] = centre(q, s, r).map((v, i) => v + (i ? 0 : r)); // the shared corner
    if (vx < -2.5 * r || vx > W + 2.5 * r || vy < -2.5 * r || vy > H + 2.5 * r) continue;
    // outline of the three hexagons' union: the edges only one of them owns, chained into a loop
    const edges = new Map<string, number[][]>();
    for (const [dq, ds] of [[0, 0], [1, 0], [1, -1]]) {
      const [cx, cy] = centre(q + dq, s + ds, r), c = hex(cx, cy, r);
      c.forEach((p, k) => { const e = [p, c[(k + 1) % 6]], id = [key(e[0]), key(e[1])].sort().join("|"); edges.has(id) ? edges.delete(id) : edges.set(id, e); });
    }
    const left = [...edges.values()], loop = [left[0][0], left[0][1]];
    left.shift();
    while (left.length) {
      const end = key(loop[loop.length - 1]), i = left.findIndex(e => key(e[0]) === end || key(e[1]) === end);
      if (i < 0) break;
      const [a, b] = left.splice(i, 1)[0];
      loop.push(key(a) === end ? b : a);
    }
    loop.pop();
    const toward = (k: number) => loop.map(([x, y]) => [vx + (x - vx) * k, vy + (y - vy) * k]);
    outer += poly(loop);
    inner += poly(toward(.66)) + poly(toward(.34));
  }
  return svg(W, H, `<path d="${inner}" fill="none" stroke="${d.mid}" stroke-width="${f(r * .2)}"/><path d="${outer}" fill="none" stroke="${d.line}" stroke-width="${f(r * .2)}"/>`, d.ground);
}

/** Seigaiha: overlapping wave scales, each a set of concentric arcs. */
export function seigaiha(d: Dye, R = 6) {
  const W = 2 * R, H = R;
  let body = "";
  for (let row = 0; row <= 4; row++) {
    const y = (row - 1) * R / 2;
    for (let x = (row % 2 ? R : 0) - 2 * R; x <= W + 2 * R; x += 2 * R) {
      body += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(R)}" fill="${d.ground}"/>`;
      for (let k = 0; k < 3; k++) body += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(R * (.92 - k * .28))}" fill="none" stroke="${k ? d.mid : d.line}" stroke-width="${f(R * .1)}"/>`;
    }
  }
  return svg(W, H, body, d.ground);
}

/** A compact data URL: single quotes inside, and only the characters URLs need escaped. */
export const url = (s: string) => `url("data:image/svg+xml,${s.replace(/"/g, "'").replace(/[%#<>{}\n]/g, c => encodeURIComponent(c))}")`;
