// The long table: geometry and timeline, renderer-agnostic (from the brand's motion spec).
//
// pose(tMs, { scroll, px, py }) -> [{ id, kind, size:[w,h,d], pos:[x,y,z], rot:[rx,ry,rz], sanded }]
//   tMs     ms since load (Infinity = finished; that is also the reduced-motion still)
//   scroll  0..1 how far the hero has scrolled out; px, py pointer -1..1

export const TABLE = {
  length: 4.4,      // the long dimension (x)
  topY: 0.0,        // underside of the top
  board: { w: 0.2, t: 0.08, gap: 0.016 }, // top boards run lengthwise, 7 across the depth
  boards: 7,
  legH: 1.0,
  legInset: 0.12,   // legs 12% in from each end, same as the mark
};

const rand = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a, b, t) => a + (b - a) * t;
const easeOutBack = (t, s = 0.9) => { const c = s + 1; return 1 + c * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); };
const easeInOut = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** The finished table: 14 planks. order = landing order (legs first, top last). */
export function layout() {
  const { length: L, board, boards, legH, legInset } = TABLE;
  const depth = boards * board.w + (boards - 1) * board.gap;
  const out = [];
  const legX = L / 2 - L * legInset - 0.09;
  // trestle legs: two boards side by side at each end, standing
  [-1, 1].forEach((sx, a) => [-1, 1].forEach((sz, b) => out.push({
    kind: 'leg', size: [0.16, legH, 0.1], pos: [sx * legX, -legH / 2 - 0.06, sz * 0.36], order: a * 2 + b,
  })));
  // stretcher: low, joining the two trestles
  out.push({ kind: 'stretcher', size: [2 * legX + 0.1, 0.12, 0.09], pos: [0, -legH * 0.72, 0], order: 4 });
  // battens: across the depth, under the top, on the legs
  [-1, 1].forEach((sx, i) => out.push({ kind: 'batten', size: [0.16, 0.06, depth - 0.08], pos: [sx * legX, -0.03, 0], order: 5 + i }));
  // top boards, back to front; the front board lands last
  for (let i = 0; i < boards; i++) {
    const z = -depth / 2 + board.w / 2 + i * (board.w + board.gap);
    out.push({ kind: 'top', size: [L, board.t, board.w], pos: [0, board.t / 2, z], order: 7 + i });
  }
  return out.map((p, id) => ({ ...p, id }));
}

/** Where each plank lies before assembly: on the floor, tumbled, spread wide. */
function scattered(p) {
  const r1 = rand(p.id + 1), r2 = rand(p.id + 41), r3 = rand(p.id + 97);
  const floor = -TABLE.legH - 0.06;
  const lying = p.kind === 'leg' ? [0, 0, Math.PI / 2] : [0, 0, 0]; // legs lie down too
  return {
    pos: [mix(-2.5, 2.7, r1), floor + Math.min(...p.size) / 2 + r3 * 0.05, mix(-1.5, 0.5, r2)],
    rot: [lying[0] + (r3 - 0.5) * 0.12, (r1 - 0.5) * 2.6, lying[2] + (r2 - 0.5) * 0.16],
  };
}

export const TIMING = { start: 300, stagger: 150, travel: 900, settle: 900 };
/** ms when the last plank has landed and settled: the end of the intro */
export const DONE = TIMING.start + 13 * TIMING.stagger + TIMING.travel + TIMING.settle;

export function pose(tMs, { scroll = 0, px = 0, py = 0, breathe = 0.03, period = 7 } = {}) {
  const { start, stagger, travel } = TIMING;
  const t = Number.isFinite(tMs) ? tMs : 1e9;
  return layout().map((p) => {
    const s = scattered(p);
    const k = clamp((t - start - p.order * stagger) / travel);
    // lift first (planks rise off the floor), then glide to place with a small overshoot
    const glide = easeOutBack(k, 0.6);
    const lift = Math.sin(Math.PI * clamp(k * 1.15)) * 0.55;
    const pos = p.pos.map((v, i) => mix(s.pos[i], v, glide) + (i === 1 ? lift * (1 - k) : 0));
    const rot = s.rot.map((v) => mix(v, 0, easeInOut(k)));
    // breathing: planks part slightly along their own offset from the table centre
    const idle = Number.isFinite(tMs) ? 0.25 * (0.5 + 0.5 * Math.sin((t / 1000) * (2 * Math.PI / period) + p.id * 0.4)) : 0;
    const amt = breathe * clamp(scroll + idle * 0.3) * clamp((t - DONE + 600) / 600);
    const dir = [Math.sign(p.pos[0]) * (p.kind === 'top' ? 0 : 1), p.kind === 'top' ? 1 + (p.order - 10) * 0.15 : -0.4, Math.sign(p.pos[2]) || 0];
    const breathPos = pos.map((v, i) => v + dir[i] * amt * (p.kind === 'top' ? 1.4 : 1));
    // the top's upper faces are sanded back to clean wood once settled: char -> clay
    const sanded = p.kind === 'top' ? clamp((t - (start + p.order * stagger + travel)) / TIMING.settle) : 0;
    return { id: p.id, kind: p.kind, size: p.size, pos: breathPos, rot, sanded, landed: k };
  }).map((q) => ({ ...q, tilt: [py * -0.05, px * 0.1] }));
}
