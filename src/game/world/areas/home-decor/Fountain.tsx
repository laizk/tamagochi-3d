'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh } from 'three';

const FOUNTAIN_POS: [number, number, number] = [2.5, 0, 1.5];
const STONE_COLOR = '#B8B0A6';
const WATER_COLOR = '#5BA8C8';
const JET_PERIOD_S = 1.2;
const JET_MIN = 0.85;
const JET_MAX = 1.15;

export function Fountain() {
  const jet = useRef<Mesh>(null);

  useFrame(() => {
    const t = performance.now() / 1000;
    if (jet.current) {
      const phase = (Math.sin((t / JET_PERIOD_S) * Math.PI * 2) + 1) / 2; // 0..1
      jet.current.scale.y = JET_MIN + (JET_MAX - JET_MIN) * phase;
    }
  });

  return (
    <group position={FOUNTAIN_POS}>
      {/* base bowl */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[1.0, 1.0, 0.2, 24]} />
        <meshStandardMaterial color={STONE_COLOR} roughness={0.8} />
      </mesh>
      {/* base water */}
      <mesh position={[0, 0.21, 0]}>
        <cylinderGeometry args={[0.92, 0.92, 0.02, 24]} />
        <meshStandardMaterial color={WATER_COLOR} roughness={0.2} />
      </mesh>

      {/* mid pillar */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.7, 16]} />
        <meshStandardMaterial color={STONE_COLOR} roughness={0.8} />
      </mesh>
      {/* mid bowl */}
      <mesh position={[0, 0.97, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.15, 24]} />
        <meshStandardMaterial color={STONE_COLOR} roughness={0.8} />
      </mesh>
      {/* mid water */}
      <mesh position={[0, 1.05, 0]}>
        <cylinderGeometry args={[0.45, 0.45, 0.02, 24]} />
        <meshStandardMaterial color={WATER_COLOR} roughness={0.2} />
      </mesh>

      {/* top pillar */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.4, 16]} />
        <meshStandardMaterial color={STONE_COLOR} roughness={0.8} />
      </mesh>
      {/* top bowl */}
      <mesh position={[0, 1.55, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.1, 16]} />
        <meshStandardMaterial color={STONE_COLOR} roughness={0.8} />
      </mesh>
      {/* top water */}
      <mesh position={[0, 1.61, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.02, 16]} />
        <meshStandardMaterial color={WATER_COLOR} roughness={0.2} />
      </mesh>

      {/* center jet (animated scale.y) */}
      <mesh ref={jet} position={[0, 1.86, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 0.5, 12]} />
        <meshStandardMaterial color={WATER_COLOR} roughness={0.2} />
      </mesh>
    </group>
  );
}
