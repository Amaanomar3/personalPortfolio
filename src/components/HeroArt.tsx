import { lazy, Suspense, useEffect, useState } from 'react';

// three + r3f + drei are only fetched when this resolves, after the page is idle,
// so none of it is on the critical path of the first paint.
const HeroScene = lazy(() => import('./HeroScene'));

function canRun3D() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Static fallback: what server HTML, reduced-motion users and no-WebGL browsers see. */
const DOTS: [number, number, number][] = [[384,200,1.3],[242,366,1.7],[117,352,2],[38,155,1.8],[256,75,1.4],[156,37,0.9],[138,60,2.3],[245,80,1.6],[349,122,1.8],[37,114,2.3],[100,303,2.1],[135,314,1.3],[73,261,2.3],[40,140,2.2],[330,250,1.7],[51,192,1.1],[304,133,1.4],[107,338,2.3],[69,188,1.4],[170,342,1.5],[122,337,1.8],[219,382,1.5],[307,75,1.8],[45,184,1.9],[337,145,1.9],[199,361,1.4],[129,329,2.1],[292,111,2.1],[331,270,1],[367,289,1.2],[112,104,1.5],[92,129,2.3],[336,79,2.2],[345,105,1.2],[337,209,0.9],[363,202,1.2],[191,46,1.9],[214,381,1.2],[72,330,1],[80,208,2.3],[80,60,0.8],[308,122,2.3],[46,133,1.2],[223,333,1.7],[365,256,1.9],[165,49,0.9],[342,318,1],[131,31,0.9],[334,79,2.4],[366,151,1.5],[202,371,2.2],[90,281,1.4],[321,96,1.4],[76,81,1.3],[177,52,1.1],[129,375,2.4],[78,66,2.3],[251,357,1],[41,203,2],[345,149,1.1],[76,243,1.9],[42,178,1.6],[207,55,2],[339,223,1.7],[250,363,1.3],[215,366,1.5],[355,279,2.1],[358,107,1.9],[318,169,2],[63,99,2.2]];

function StaticArt() {
  return (
    <svg className="hero-static" viewBox="0 0 400 400" aria-hidden="true">
      <g fill="var(--color-ink)" opacity="0.55">
        {DOTS.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} />)}
      </g>
      <circle cx="200" cy="200" r="92" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" />
      <circle cx="200" cy="200" r="60" fill="none" stroke="var(--color-accent)" strokeWidth="1" opacity="0.5" />
      <circle cx="200" cy="200" r="6" fill="var(--color-accent-2)" />
    </svg>
  );
}

export default function HeroArt() {
  const [live, setLive] = useState(false);
  useEffect(() => setLive(canRun3D()), []);

  return (
    <div className="hero-art">
      {live ? (
        <Suspense fallback={<StaticArt />}>
          <HeroScene />
        </Suspense>
      ) : (
        <StaticArt />
      )}
    </div>
  );
}
