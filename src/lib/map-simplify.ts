/**
 * Shrinks projected map paths: round to 0.1px and drop points that sit closer than `tol` px to the last
 * point kept. Used by the map build script and live in the blog's demo. Paths use only M, L and Z.
 */
export function simplifyPath(d: string, tol: number, fixed = false): { d: string; points: number } {
  let out = "", px = NaN, py = NaN, points = 0;
  const num = (n: number) => fixed ? n.toFixed(1) : String(+n.toFixed(1));
  for (const cmd of d.match(/[MLZ][^MLZ]*/g) || []) {
    if (cmd[0] === "Z") { out += "Z"; continue; }
    const [x, y] = cmd.slice(1).split(",").map(Number);
    if (cmd[0] === "L" && Math.hypot(x - px, y - py) < tol) continue;
    out += cmd[0] + num(x) + "," + num(y);
    px = x; py = y; points++;
  }
  return { d: out, points };
}
