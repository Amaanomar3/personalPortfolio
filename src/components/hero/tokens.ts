// Every visual choice the hero makes comes from CSS custom properties in
// src/styles/tokens.css, so a brand direction changes the hero without code changes.

export interface HeroTokens {
  ink: string;
  ink2: string;
  mark: string;
  piece: { w: number; h: number; d: number; round: number };
  markShape: { w: number; h: number; d: number; round: number; x: number; y: number; blink: boolean };
  density: number;
  speed: number;
  snap: number;
  shade: number;
  spin: number;
  tilt: number;
  scatter: number;
}

export function readTokens(el: Element = document.documentElement): HeroTokens {
  const cs = getComputedStyle(el);
  const str = (n: string, fb: string) => cs.getPropertyValue(n).trim() || fb;
  const num = (n: string, fb: number) => {
    const v = parseFloat(cs.getPropertyValue(n));
    return Number.isFinite(v) ? v : fb;
  };
  return {
    ink: str('--hero-ink', '#e9edf2'),
    ink2: str('--hero-ink-2', '#4fd1c5'),
    mark: str('--hero-mark', '#f6ad55'),
    piece: {
      w: num('--hero-piece-w', 0.09),
      h: num('--hero-piece-h', 0.09),
      d: num('--hero-piece-d', 0.09),
      round: num('--hero-piece-round', 1),
    },
    markShape: {
      w: num('--hero-mark-w', 0.16),
      h: num('--hero-mark-h', 0.16),
      d: num('--hero-mark-d', 0.16),
      round: num('--hero-mark-round', 1),
      x: num('--hero-mark-x', 1.55),
      y: num('--hero-mark-y', -1.45),
      blink: num('--hero-mark-blink', 0) > 0,
    },
    density: Math.round(num('--hero-density', 2)),
    speed: num('--hero-speed', 1),
    snap: Math.round(num('--hero-snap', 0)),
    shade: num('--hero-shade', 0.35),
    spin: num('--hero-spin', 0.12),
    tilt: num('--hero-tilt', 0.18),
    scatter: num('--hero-scatter', 1),
  };
}
