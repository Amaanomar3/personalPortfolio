import {
  BoxGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  SRGBColorSpace,
  Scene,
  WebGLRenderer,
} from 'three';
import { DONE, TABLE, layout, pose } from './table.js';
import { readTokens } from './tokens';

// The hero's one idea: fourteen charred planks lift off the floor and assemble into a long table,
// legs first, top last. The sanded top turns clay as each board settles, the light warms to late
// afternoon, then the table breathes on scroll and turns a little toward the pointer.
// Plain three.js with named imports keeps this chunk small.

const CAMERA = { eye: [0, 1.25, 7.2], target: [0, -0.5, 0], fov: 26, yaw: -0.32 } as const;
const PIVOT = CAMERA.target;
const LIGHT_DIM = '#CFC3B4';
const FLOOR = -TABLE.legH - 0.06;

/** BoxGeometry face groups: +x, -x, +y, -y, +z, -z. The end grain sits across the longest side. */
function faceSlots(size: number[]) {
  const long = size.indexOf(Math.max(...size));
  return [0, 1, 2, 3, 4, 5].map((f) => (Math.floor(f / 2) === long ? 'end' : f === 2 ? 'top' : 'side'));
}

/** A soft contact shadow: a blurred walnut ellipse on the floor (no shadow maps needed). */
function contactShadow(color: string) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const hex = new Color(color).getHex(); // sRGB
  const rgb = [hex >> 16, (hex >> 8) & 255, hex & 255].join(',');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, `rgba(${rgb},0.5)`);
  grad.addColorStop(0.6, `rgba(${rgb},0.2)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  const mat = new MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0 });
  const mesh = new Mesh(new PlaneGeometry(TABLE.length * 1.35, 1.9), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = FLOOR + 0.001;
  return { mesh, mat, tex };
}

/**
 * Mount the hero into `host`. Calls `onReady` after the first frame, and `onFallback` if the
 * device cannot hold ~40fps for 2s (the page then keeps the still). Returns a cleanup function.
 */
export function mount(host: HTMLElement, onReady: () => void, onFallback: () => void) {
  const t = readTokens();
  const planks = layout();

  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.className = 'hero-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);

  const scene = new Scene();
  const camera = new PerspectiveCamera(CAMERA.fov, 1, 0.1, 60);
  camera.position.set(...CAMERA.eye);
  camera.lookAt(...CAMERA.target);

  // Light: one warm key from screen left, about 28 degrees up, and a low bone/walnut fill.
  // Intensities are scaled by PI so a lit face reads close to its token colour.
  const elev = (t.lightAngle * Math.PI) / 180;
  const key = new DirectionalLight(LIGHT_DIM, 0.55 * Math.PI);
  key.position.set(-6 * Math.cos(elev), 6 * Math.sin(elev) + PIVOT[1], 3.2);
  key.target.position.set(...PIVOT);
  scene.add(key, key.target);
  const fill = new HemisphereLight(t.bone, t.ink, 0.5 * Math.PI);
  scene.add(fill);
  const lightDim = new Color(LIGHT_DIM);
  const lightWarm = new Color(t.light);

  // pivot group (yaw toward the pointer around the table centre) > offset group > planks
  const turn = new Group();
  turn.position.set(...PIVOT);
  turn.rotation.order = 'ZYX';
  scene.add(turn);
  const table = new Group();
  table.position.set(-PIVOT[0], -PIVOT[1], -PIVOT[2]);
  turn.add(table);

  const shadow = contactShadow(t.ink);
  table.add(shadow.mesh);

  const ember = new Color(t.ember);
  const charMats: MeshStandardMaterial[] = [];
  const std = (color: string) => {
    const m = new MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, emissive: ember, emissiveIntensity: 0 });
    charMats.push(m);
    return m;
  };
  const endMat = std(t.char);
  const inkMat = std(t.ink);
  const ink2Mat = std(t.ink2);
  const inkCol = new Color(t.ink);
  const clayCol = new Color(t.mark);

  const geos: BoxGeometry[] = [];
  const tops: MeshStandardMaterial[] = [];
  const meshes = planks.map((p) => {
    const geo = new BoxGeometry(...(p.size as [number, number, number]));
    geos.push(geo);
    const side = p.kind === 'leg' && p.id % 2 ? ink2Mat : inkMat;
    let top: MeshStandardMaterial | null = null;
    if (p.kind === 'top') {
      top = new MeshStandardMaterial({ color: t.ink, roughness: 0.85, metalness: 0 });
      tops[p.id] = top;
    }
    const mats = faceSlots(p.size).map((s) => (s === 'end' ? endMat : s === 'top' && top ? top : side));
    const mesh = new Mesh(geo, mats);
    mesh.rotation.order = 'ZYX';
    table.add(mesh);
    return mesh;
  });

  // Framing matches the still: the 2:1 mobile frame sits closer than the desktop one.
  const resize = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    const scale = w / h >= 1.8 ? 0.92 : 0.62;
    camera.fov = (2 * Math.atan(Math.tan((CAMERA.fov * Math.PI) / 360) / scale) * 180) / Math.PI;
    camera.aspect = w / h;
    camera.setViewOffset(w, h, 0, h * 0.02, w, h);
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  // Pointer (window-wide, eased) and scroll progress of the hero, 0..1.
  const target = { x: 0, y: 0 };
  const eased = { x: 0, y: 0, s: 0 };
  const onPointer = (e: PointerEvent) => {
    target.x = Math.max(-1, Math.min(1, (e.clientX / window.innerWidth) * 2 - 1));
    target.y = Math.max(-1, Math.min(1, -((e.clientY / window.innerHeight) * 2 - 1)));
  };
  window.addEventListener('pointermove', onPointer, { passive: true });
  const scrollProgress = () => {
    const r = host.getBoundingClientRect();
    return Math.max(0, Math.min(1, -r.top / Math.max(1, r.height)));
  };

  // Only render while the hero is on screen and the tab is visible.
  let onScreen = true;
  const io = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen) kick();
  });
  io.observe(host);
  const onVis = () => !document.hidden && kick();
  document.addEventListener('visibilitychange', onVis);

  let raf = 0;
  let prev = 0;
  let clock = 0; // ms of visible animation time
  let ready = false;
  let slowSince = -1;
  let stopped = false;
  const fps = { frames: 0, since: 0 };

  function frame(now: number) {
    raf = 0;
    const dt = prev ? Math.min(50, now - prev) : 1000 / 60;
    prev = now;
    clock += dt;

    const k = Math.min(1, dt / 330);
    eased.x += (target.x - eased.x) * k;
    eased.y += (target.y - eased.y) * k;
    eased.s += (scrollProgress() - eased.s) * Math.min(1, dt / 160);

    const poses = pose(clock, { scroll: eased.s, px: eased.x, py: eased.y, breathe: t.breathe, period: t.breathePeriod });
    let landed = 0;
    poses.forEach((q, i) => {
      const m = meshes[i];
      m.position.set(q.pos[0], q.pos[1], q.pos[2]);
      m.rotation.set(q.rot[0], q.rot[1], q.rot[2]);
      const top = tops[q.id];
      if (top) top.color.copy(inkCol).lerp(clayCol, q.sanded);
      landed += q.landed;
    });
    const tilt = poses[0].tilt;
    turn.rotation.set(tilt[0], CAMERA.yaw + tilt[1], 0);

    // the light warms over the last 1.8s of the intro; embers show on the char while it is low
    const warm = Math.max(0, Math.min(1, (clock - DONE + 1800) / 1800));
    key.color.copy(lightDim).lerp(lightWarm, warm);
    key.intensity = (0.55 + 0.45 * warm) * Math.PI;
    for (const m of charMats) m.emissiveIntensity = 0.14 * (1 - warm);
    shadow.mat.opacity = 0.25 + 0.75 * (landed / poses.length);

    renderer.render(scene, camera);
    if (!ready) {
      ready = true;
      onReady();
    }

    // Low-power guard: below ~40fps for 2s in a row, hand back to the still.
    fps.frames++;
    if (!fps.since) fps.since = now;
    if (now - fps.since >= 500) {
      const rate = (fps.frames * 1000) / (now - fps.since);
      fps.frames = 0;
      fps.since = now;
      if (rate < 40) {
        if (slowSince < 0) slowSince = now;
        else if (now - slowSince >= 2000) {
          stopped = true;
          onFallback();
          return;
        }
      } else slowSince = -1;
    }

    if (onScreen && !document.hidden && !stopped) raf = requestAnimationFrame(frame);
  }
  function kick() {
    if (!raf && !stopped) {
      prev = 0;
      fps.frames = 0;
      fps.since = 0;
      slowSince = -1;
      raf = requestAnimationFrame(frame);
    }
  }
  kick();

  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    window.removeEventListener('pointermove', onPointer);
    document.removeEventListener('visibilitychange', onVis);
    geos.forEach((g) => g.dispose());
    charMats.forEach((m) => m.dispose());
    tops.forEach((m) => m?.dispose());
    shadow.mat.dispose();
    shadow.tex.dispose();
    shadow.mesh.geometry.dispose();
    renderer.dispose();
    canvas.remove();
  };
}
