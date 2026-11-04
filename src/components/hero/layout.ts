// The hero's one idea: separate pieces that assemble into a whole.
// This file is the shared geometry: where every piece sits in the finished form.
// The static SVG and the WebGL scene both read it, so they show the same shape.

/** Radius of the finished form, in scene units. */
export const R = 1.6;
/** Resting tilt towards the viewer, radians. */
export const BASE_TILT = 0.32;
const RINGS = 23;
const SPACING = 0.3;

export type Vec3 = [number, number, number];

export interface Piece {
  /** position on the finished form */
  p: Vec3;
  /** unit vectors: along the ring (piece width), towards the pole (piece height), outward (piece depth) */
  e: Vec3;
  n: Vec3;
  o: Vec3;
  /** 1, 2 or 3: a piece shows when --hero-density >= tier */
  tier: 1 | 2 | 3;
  /** 0..1 height on the form, bottom first: the order pieces land in */
  rise: number;
  /** stable pseudo-random value per piece */
  seed: number;
  /** pieces drawn in the second colour */
  alt: boolean;
}

/** Deterministic hash, so server HTML and the client render agree. */
export function rand(i: number) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Rings of pieces around a sphere. Density drops whole rings, so spacing stays even at every level. */
export function layout(): Piece[] {
  const out: Piece[] = [];
  const mid = (RINGS - 1) / 2;
  let i = 0;
  for (let k = 0; k < RINGS; k++) {
    const lat = -Math.PI / 2 + ((k + 1) * Math.PI) / (RINGS + 1);
    const y = R * Math.sin(lat);
    const r = R * Math.cos(lat);
    const m = Math.max(4, Math.round((2 * Math.PI * r) / SPACING));
    const d = Math.abs(k - mid);
    const tier = d % 4 === 0 ? 1 : d % 2 === 0 ? 2 : 3;
    for (let j = 0; j < m; j++) {
      const lon = ((j + (k % 2) * 0.5) / m) * Math.PI * 2;
      const s = Math.sin(lon);
      const c = Math.cos(lon);
      const sl = Math.sin(lat);
      const cl = Math.cos(lat);
      out.push({
        p: [r * s, y, r * c],
        e: [c, 0, -s],
        n: [-sl * s, cl, -sl * c],
        o: [cl * s, sl, cl * c],
        tier,
        rise: (y + R) / (2 * R),
        seed: rand(i),
        alt: rand(i + 999) < 0.2,
      });
      i++;
    }
  }
  return out;
}
