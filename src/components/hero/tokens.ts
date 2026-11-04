// Every colour and timing the hero uses comes from CSS custom properties in
// src/styles/tokens.css (the brand tokens), so the scene and the page never disagree.

export interface HeroTokens {
  ink: string;
  ink2: string;
  char: string;
  mark: string;
  ember: string;
  light: string;
  bone: string;
  lightAngle: number;
  breathe: number;
  breathePeriod: number;
}

export function readTokens(el: Element = document.documentElement): HeroTokens {
  const cs = getComputedStyle(el);
  const str = (n: string, fb: string) => cs.getPropertyValue(n).trim() || fb;
  const num = (n: string, fb: number) => {
    const v = parseFloat(cs.getPropertyValue(n));
    return Number.isFinite(v) ? v : fb;
  };
  return {
    ink: str('--hero-ink', '#2B1D14'),
    ink2: str('--hero-ink-2', '#6B5444'),
    char: str('--hero-char', '#1A110B'),
    mark: str('--hero-mark', '#A4462A'),
    ember: str('--hero-ember', '#C2622F'),
    light: str('--hero-light', '#FFD9A0'),
    bone: str('--bone', '#F3E9DA'),
    lightAngle: num('--hero-light-angle', 28),
    breathe: num('--hero-breathe', 0.03),
    breathePeriod: num('--hero-breathe-period-s', 7),
  };
}
