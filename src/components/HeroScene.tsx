import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Icosahedron, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Placeholder scene for the scaffold: a wireframe shape inside a quiet field of points
// that leans toward the cursor. Colours come from the CSS brand tokens, so a new
// direction re-colours it without touching this file.
function token(name: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function Field({ color }: { color: string }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const n = 900;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 2.2 + Math.random() * 1.6;
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(p) * Math.cos(t);
      arr[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
      arr[i * 3 + 2] = r * Math.cos(p);
    }
    return arr;
  }, []);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.03;
    ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, state.pointer.y * 0.25, 0.04);
    ref.current.rotation.z = THREE.MathUtils.lerp(ref.current.rotation.z, -state.pointer.x * 0.25, 0.04);
  });

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial transparent color={color} size={0.025} sizeAttenuation depthWrite={false} opacity={0.7} />
    </Points>
  );
}

function Core({ color, accent }: { color: string; accent: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.15;
  });
  return (
    <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.6}>
      <group ref={ref}>
        <Icosahedron args={[1.35, 1]}>
          <meshBasicMaterial color={color} wireframe transparent opacity={0.9} />
        </Icosahedron>
        <mesh>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color={accent} />
        </mesh>
      </group>
    </Float>
  );
}

export default function HeroScene() {
  const accent = token('--color-accent', '#4fd1c5');
  const accent2 = token('--color-accent-2', '#f6ad55');
  const ink = token('--color-ink', '#e9edf2');
  return (
    <Canvas
      className="hero-canvas"
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 5.5], fov: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      aria-hidden="true"
    >
      <Field color={ink} />
      <Core color={accent} accent={accent2} />
    </Canvas>
  );
}
