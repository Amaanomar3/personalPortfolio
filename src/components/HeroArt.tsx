import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { BASE_TILT, layout } from './hero/layout';

// The hero: a whole made of separate pieces. Server HTML, reduced-motion users and
// browsers without WebGL get the finished form as SVG. Everyone else gets the same form
// in three.js, which loads only after the page is idle and then assembles the pieces.

function canRun3D() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Front-view projection of the finished form, matched to the 3D camera framing. */
const STATIC = (() => {
  const c = Math.cos(BASE_TILT);
  const s = Math.sin(BASE_TILT);
  const tilt = ([x, y, z]: number[]) => [x, y * c - z * s, y * s + z * c];
  const f = (v: number, d = 1) => +v.toFixed(d);
  return layout()
    .map((p) => {
      const [x, y, z] = tilt(p.p);
      const e = tilt(p.e);
      const n = tilt(p.n);
      const len = Math.hypot(e[0], e[1]) || 1;
      const ux = e[0] / len;
      const uy = e[1] / len;
      return {
        z,
        tier: p.tier,
        alt: p.alt,
        o: f(0.3 + 0.7 * Math.max(0, z / 1.6), 2),
        tr: `translate(${f(200 + x * 92)} ${f(200 - y * 92)}) rotate(${f((Math.atan2(-uy, ux) * 180) / Math.PI)}) scale(${f(len, 2)} ${f(Math.abs(ux * n[1] - uy * n[0]), 2)})`,
      };
    })
    .filter((p) => p.z > 0.08)
    .sort((a, b) => a.z - b.z);
})();

function StaticArt() {
  return (
    <svg className="hero-static" viewBox="0 0 400 400" aria-hidden="true" focusable="false">
      {STATIC.map((p, i) => (
        <rect
          key={i}
          className={p.alt ? 'alt' : undefined}
          transform={p.tr}
          style={{ '--o': p.o, '--t': p.tier } as CSSProperties}
        />
      ))}
      <rect className="mark" />
    </svg>
  );
}

export default function HeroArt() {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!host.current || !canRun3D()) return;
    let dispose: (() => void) | undefined;
    let cancelled = false;
    import('./hero/scene')
      .then(({ mount }) => {
        if (cancelled || !host.current) return;
        dispose = mount(host.current, () => setReady(true));
      })
      .catch(() => {
        /* keep the static form */
      });
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, []);

  return (
    <div ref={host} className={ready ? 'hero-art is-live' : 'hero-art'}>
      <StaticArt />
    </div>
  );
}
