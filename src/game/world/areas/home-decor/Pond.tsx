'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh } from 'three';

const POND_POS: [number, number, number] = [0, 0.01, -6];
const POND_RADIUS = 1.6;
const RIM_RADIUS = 1.7;
const RIPPLE_TORUS_R = 1.2;
const STONE_COUNT = 8;
const RIPPLE_PERIOD_S = 2.0;
const RIPPLE_MIN = 0.55;
const RIPPLE_MAX = 1.05;

const stones = Array.from({ length: STONE_COUNT }, (_, i) => {
  const angle = (i * Math.PI * 2) / STONE_COUNT;
  return {
    key: i,
    pos: [Math.cos(angle) * RIM_RADIUS, 0.04, Math.sin(angle) * RIM_RADIUS] as [
      number,
      number,
      number,
    ],
  };
});

export function Pond() {
  const lily1 = useRef<Mesh>(null);
  const lily2 = useRef<Mesh>(null);
  const ripple = useRef<Mesh>(null);

  useFrame(() => {
    const t = performance.now() / 1000;
    if (lily1.current) lily1.current.rotation.y = t * 0.3;
    if (lily2.current) lily2.current.rotation.y = -t * 0.25;
    if (ripple.current) {
      const phase = (t % RIPPLE_PERIOD_S) / RIPPLE_PERIOD_S; // 0..1
      const scale = RIPPLE_MIN + (RIPPLE_MAX - RIPPLE_MIN) * phase;
      ripple.current.scale.setScalar(scale);
    }
  });

  return (
    <group position={POND_POS}>
      {/* water disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[POND_RADIUS, 32]} />
        <meshStandardMaterial color="#5BA8C8" roughness={0.2} />
      </mesh>

      {/* lily pads */}
      <mesh ref={lily1} position={[0.45, 0.02, 0.25]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.2, 16]} />
        <meshStandardMaterial color="#3f8a3a" />
      </mesh>
      <mesh ref={lily2} position={[-0.55, 0.02, -0.45]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.16, 16]} />
        <meshStandardMaterial color="#3f8a3a" />
      </mesh>

      {/* ripple ring (expanding torus) */}
      <mesh ref={ripple} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[RIPPLE_TORUS_R, 0.015, 8, 64]} />
        <meshStandardMaterial color="#FFFFFF" transparent opacity={0.35} />
      </mesh>

      {/* stone rim */}
      {stones.map((s) => (
        <mesh key={s.key} position={s.pos} castShadow>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#5C5854" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}
