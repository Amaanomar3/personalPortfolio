import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshLambertMaterial,
  PerspectiveCamera,
  Quaternion,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { BASE_TILT, layout } from './layout';
import { Assembly, liftPoint } from './motion';
import { readTokens } from './tokens';

// Plain three.js with named imports (no react-three-fiber, no drei) keeps this chunk small.

function pieceGeometry(w: number, h: number, d: number, round: number) {
  if (round <= 0) return new BoxGeometry(w, h, d);
  const r = (round * Math.min(w, h, d)) / 2;
  return new RoundedBoxGeometry(w, h, d, 3, Math.min(r, Math.min(w, h, d) / 2 - 1e-4));
}

/** Mount the hero into `host`. Calls `onReady` after the first frame. Returns a cleanup function. */
export function mount(host: HTMLElement, onReady: () => void) {
  const t = readTokens();
  const pieces = layout().filter((p) => p.tier <= t.density);
  const motion = new Assembly(pieces, t);

  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.className = 'hero-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);

  const scene = new Scene();
  const camera = new PerspectiveCamera(40, 1, 0.1, 50);
  camera.position.set(0, 0, 6.2);

  // Lights scaled by PI so shade 0 gives the token colour exactly.
  scene.add(new AmbientLight(0xffffff, (1 - t.shade) * Math.PI));
  const sun = new DirectionalLight(0xffffff, t.shade * Math.PI * 1.15);
  sun.position.set(2, 3, 5);
  scene.add(sun);

  const form = new Group();
  form.rotation.x = BASE_TILT;
  scene.add(form);

  const geo = pieceGeometry(t.piece.w, t.piece.h, t.piece.d, t.piece.round);
  const mat = new MeshLambertMaterial({ color: 0xffffff });
  const mesh = new InstancedMesh(geo, mat, motion.count);
  const ink = new Color(t.ink);
  const ink2 = new Color(t.ink2);
  pieces.forEach((p, i) => mesh.setColorAt(i, p.alt ? ink2 : ink));
  form.add(mesh);

  const m = t.markShape;
  const markGeo = pieceGeometry(m.w, m.h, m.d, m.round);
  const markMat = new MeshLambertMaterial({ color: new Color(t.mark) });
  const mark = new Mesh(markGeo, markMat);
  mark.position.set(m.x, m.y, 0.3);
  mark.scale.setScalar(0);
  scene.add(mark);

  // Pointer and touch: a gentle lean and a local lift, eased so it never jumps.
  const target = { x: 0, y: 0, active: false, last: 0 };
  const eased = { x: 0, y: 0, a: 0 };
  const onMove = (x: number, y: number) => {
    const r = host.getBoundingClientRect();
    target.x = Math.max(-1.5, Math.min(1.5, ((x - r.left) / r.width) * 2 - 1));
    target.y = Math.max(-1.5, Math.min(1.5, -(((y - r.top) / r.height) * 2 - 1)));
    target.active = true;
    target.last = performance.now();
  };
  const onPointer = (e: PointerEvent) => onMove(e.clientX, e.clientY);
  const onTouch = (e: TouchEvent) => e.touches[0] && onMove(e.touches[0].clientX, e.touches[0].clientY);
  const onLeave = () => (target.active = false);
  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('touchmove', onTouch, { passive: true });
  window.addEventListener('touchstart', onTouch, { passive: true });
  document.addEventListener('pointerleave', onLeave);

  const resize = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  // Only render while the hero is on screen and the tab is visible.
  let onScreen = true;
  const io = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen) kick();
  });
  io.observe(host);
  const onVis = () => !document.hidden && kick();
  document.addEventListener('visibilitychange', onVis);

  const mtx = new Matrix4();
  const inv = new Quaternion();
  const lift = new Vector3();
  let raf = 0;
  let prev = 0;
  let clock = 0;
  let ready = false;

  function frame(now: number) {
    raf = 0;
    const dt = prev ? Math.min(0.05, (now - prev) / 1000) : 1 / 60;
    prev = now;
    clock += dt;
    const at = clock * t.speed;

    if (target.active && now - target.last > 2500) target.active = false;
    const k = Math.min(1, dt * 3);
    eased.x += ((target.active ? target.x : 0) - eased.x) * k;
    eased.y += ((target.active ? target.y : 0) - eased.y) * k;
    eased.a += ((target.active ? 1 : 0) - eased.a) * k;

    form.rotation.y = clock * t.spin * t.speed + eased.x * t.tilt;
    form.rotation.x = BASE_TILT - eased.y * t.tilt;
    form.updateMatrixWorld();
    inv.copy(form.quaternion).invert();
    const lp = eased.a > 0.05 ? liftPoint(eased.x, eased.y, inv, lift) : null;

    for (let i = 0; i < motion.count; i++) mesh.setMatrixAt(i, motion.pose(i, at, lp, dt, mtx));
    mesh.instanceMatrix.needsUpdate = true;

    const s = motion.markScale(at);
    mark.scale.setScalar(s);
    mark.visible = s > 0 && !(m.blink && s === 1 && Math.floor(clock * 1.6) % 2 === 1);

    renderer.render(scene, camera);
    if (!ready) {
      ready = true;
      onReady();
    }
    if (onScreen && !document.hidden) raf = requestAnimationFrame(frame);
  }
  function kick() {
    if (!raf) {
      prev = 0;
      raf = requestAnimationFrame(frame);
    }
  }
  kick();

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    window.removeEventListener('pointermove', onPointer);
    window.removeEventListener('touchmove', onTouch);
    window.removeEventListener('touchstart', onTouch);
    document.removeEventListener('pointerleave', onLeave);
    document.removeEventListener('visibilitychange', onVis);
    geo.dispose();
    markGeo.dispose();
    mat.dispose();
    markMat.dispose();
    renderer.dispose();
    canvas.remove();
  };
}
