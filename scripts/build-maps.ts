/**
 * Builds the location-card maps from Natural Earth 1:10m data (land, lakes, rivers),
 * projected with d3-geo (Mercator) into a 180×220 card and saved as SVG path strings.
 * Runs once, at build time; the browser never loads a mapping library or map data service.
 *
 *   npm run data:maps
 *
 * Source files are cached in .cache/ne so repeat builds don't re-download ~30 MB.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { geoMercator, geoPath, type GeoPermissibleObjects } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { simplifyPath } from "../src/lib/map-simplify.ts";

const NE = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson";
const CACHE = ".cache/ne";
const OUT = "src/data/generated/maps.json";
const W = 180, H = 220;
/** Points closer than this (px) to the previous kept point are dropped. The blog's map demo explains why. */
const TOLERANCE = 0.7;

type Side = "l" | "r" | "b";
type MapConfig = {
  /** Mercator scale and translate, fitted so each card frames its places. */
  scale: number;
  translate: [number, number];
  /** Only features touching this lon/lat box are projected (keeps the build fast). */
  bbox: [number, number, number, number];
  pins: { name: string; lon: number; lat: number; side: Side }[];
};

export const MAP_CONFIG: Record<string, MapConfig> = {
  "nj-now": {
    scale: 21702.89, translate: [28131.597, 17015.345], bbox: [-74.6, 40.3, -73.4, 41.2],
    pins: [{ name: "Hoboken", lon: -74.0321, lat: 40.744, side: "l" }],
  },
  "japan": {
    scale: 2229.93, translate: [-5290.628, 1565.02], bbox: [134.5, 33.5, 142.5, 38],
    pins: [
      { name: "Tokyo", lon: 139.69, lat: 35.68, side: "l" },
      { name: "Nagoya", lon: 136.91, lat: 35.18, side: "r" },
    ],
  },
  "nj-early": {
    scale: 13674.07, translate: [17798.386, 10807.585], bbox: [-74.8, 40.3, -73.5, 41.4],
    pins: [
      { name: "Wyckoff", lon: -74.17, lat: 41.01, side: "r" },
      { name: "Pompton Plains", lon: -74.30, lat: 40.97, side: "b" },
      { name: "Montclair", lon: -74.21, lat: 40.82, side: "r" },
    ],
  },
};

async function layer(name: string): Promise<FeatureCollection> {
  const file = `${CACHE}/${name}.geojson`;
  if (!existsSync(file)) {
    mkdirSync(CACHE, { recursive: true });
    console.log(`Downloading ${name}…`);
    const res = await fetch(`${NE}/${name}.geojson`);
    if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
  return JSON.parse(readFileSync(file, "utf8"));
}

function touches(f: Feature<Geometry | null>, [x0, y0, x1, y1]: MapConfig["bbox"]): boolean {
  const walk = (c: unknown): boolean => Array.isArray(c) && (typeof c[0] === "number"
    ? (c[0] as number) >= x0 && (c[0] as number) <= x1 && (c[1] as number) >= y0 && (c[1] as number) <= y1
    : c.some(walk));
  const g = f.geometry;
  return !!g && "coordinates" in g && walk(g.coordinates);
}

const [land, lakes, rivers, riversNA] = await Promise.all([
  "ne_10m_land", "ne_10m_lakes", "ne_10m_rivers_lake_centerlines", "ne_10m_rivers_north_america",
].map(layer));

/**
 * Natural Earth's 10m land file splits land by scalerank. The cards use the base land (scalerank 0, plus the
 * unranked base polygons) and leave out the small ranked islands, which are noise at this size.
 */
const isBaseLand = (f: Feature<Geometry | null>) => !(f.properties?.scalerank > 0);
function render(cfg: MapConfig, tol: number, fixed = false) {
  const proj = geoMercator().scale(cfg.scale).translate(cfg.translate).clipExtent([[-2, -2], [W + 2, H + 2]]);
  const path = geoPath(proj).digits(3);
  const draw = (...fcs: FeatureCollection[]) => {
    const features = fcs.flatMap(fc => fc.features.filter(f => touches(f, cfg.bbox) && (fc !== land || isBaseLand(f))));
    return simplifyPath(path({ type: "FeatureCollection", features } as GeoPermissibleObjects) || "", tol, fixed).d;
  };
  return {
    land: draw(land),
    lakes: draw(lakes),
    rivers: draw(rivers, riversNA),
    borders: "",
    pins: cfg.pins.map(p => {
      const [x, y] = proj([p.lon, p.lat])!;
      return { name: p.name, x: +x.toFixed(1), y: +y.toFixed(1), side: p.side };
    }),
  };
}

const maps = Object.fromEntries(Object.entries(MAP_CONFIG).map(([id, cfg]) => [id, render(cfg, TOLERANCE)]));
// The blog's simplification demo starts from the unsimplified Hoboken paths.
const raw = render(MAP_CONFIG["nj-now"], 0, true);
const hobokenRaw = { land: raw.land, rivers: raw.rivers, pin: [raw.pins[0].x, raw.pins[0].y] };

mkdirSync("src/data/generated", { recursive: true });
writeFileSync(OUT, JSON.stringify(maps));
writeFileSync("src/data/generated/map-hoboken-raw.json", JSON.stringify(hobokenRaw));
for (const [id, m] of Object.entries(maps)) {
  console.log(`${id}: land ${m.land.length} B, lakes ${m.lakes.length} B, rivers ${m.rivers.length} B`);
}
console.log(`hoboken raw: ${hobokenRaw.land.length + hobokenRaw.rivers.length} B`);
