import { Matrix4, Quaternion, Vector3 } from 'three';
import { R, rand, type Piece } from './layout';
import type { HeroTokens } from './tokens';

// The motion: pieces start scattered and turned, then fly in bottom first and settle
// into the whole. The mark lands last. Afterwards the form turns slowly, leans a little
// towards the pointer, and the pieces nearest the pointer lift off the surface.

const easeOut = (u: number) => 1 - Math.pow(1 - u, 3);
const clamp01 = (u: number) => Math.min(1, Math.max(0, u));

const DUR = 1.1;
const RISE = 0.9;
const JITTER = 0.35;
/** seconds of assembly at speed 1, mark included */
export const ASSEMBLE_SECONDS = RISE + JITTER + DUR + 0.5;

export class Assembly {
  readonly count: number;
  private target: Vector3[] = [];
  private start: Vector3[] = [];
  private normal: Vector3[] = [];
  private qEnd: Quaternion[] = [];
  private qStart: Quaternion[] = [];
  private delay: number[] = [];
  private push: Float32Array;
  private tmpP = new Vector3();
  private tmpQ = new Quaternion();
  private one = new Vector3(1, 1, 1);
  private basis = new Matrix4();

  constructor(pieces: Piece[], private t: HeroTokens) {
    this.count = pieces.length;
    this.push = new Float32Array(pieces.length);
    pieces.forEach((pc, i) => {
      const p = new Vector3(...pc.p);
      const o = new Vector3(...pc.o);
      this.target.push(p);
      this.normal.push(o);
      this.basis.makeBasis(new Vector3(...pc.e), new Vector3(...pc.n), o);
      this.qEnd.push(new Quaternion().setFromRotationMatrix(this.basis));
      const far = (1.5 + pc.seed * 1.8) * t.scatter;
      const jitter = new Vector3(rand(i + 7) - 0.5, rand(i + 13) - 0.5, rand(i + 29) - 0.5).multiplyScalar(2.4 * t.scatter);
      this.start.push(p.clone().multiplyScalar(far).add(jitter));
      this.qStart.push(
        new Quaternion().setFromAxisAngle(
          new Vector3(rand(i + 3) - 0.5, rand(i + 5) - 0.5, rand(i + 11) - 0.5).normalize(),
          (rand(i + 17) - 0.5) * Math.PI * 3,
        ),
      );
      this.delay.push(pc.rise * RISE + pc.seed * JITTER);
    });
  }

  /** progress 0..1 of piece i at assembly time `at` (seconds, already scaled by speed) */
  private progress(i: number, at: number) {
    let e = easeOut(clamp01((at - this.delay[i]) / DUR));
    if (this.t.snap > 0 && e < 1) e = Math.floor(e * this.t.snap) / this.t.snap;
    return e;
  }

  /**
   * Write piece i's local matrix at assembly time `at`.
   * `lift` is a point on the form in local space (or null) that pushes nearby pieces outward.
   */
  pose(i: number, at: number, lift: Vector3 | null, dt: number, out: Matrix4) {
    const e = this.progress(i, at);
    let want = 0;
    if (lift && e === 1) {
      const d = this.target[i].distanceTo(lift);
      if (d < 0.7) want = this.t.tilt * 1.1 * Math.pow(1 - d / 0.7, 2);
    }
    this.push[i] += (want - this.push[i]) * Math.min(1, dt * 6);
    this.tmpP.lerpVectors(this.start[i], this.target[i], e).addScaledVector(this.normal[i], this.push[i]);
    this.tmpQ.slerpQuaternions(this.qStart[i], this.qEnd[i], e);
    return out.compose(this.tmpP, this.tmpQ, this.one);
  }

  /** mark: grows in at its spot once the form is nearly whole */
  markScale(at: number) {
    return easeOut(clamp01((at - (RISE + JITTER + DUR * 0.8)) / 0.5));
  }
}

/** pointer on the front of the form, in the form's local space */
export function liftPoint(px: number, py: number, inverse: Quaternion, out: Vector3) {
  const x = px * R * 1.1;
  const y = py * R * 1.1;
  const z = Math.sqrt(Math.max(0, R * R - x * x - y * y));
  return out.set(x, y, z).applyQuaternion(inverse);
}
