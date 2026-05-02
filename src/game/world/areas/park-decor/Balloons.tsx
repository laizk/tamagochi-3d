'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group } from 'three';

const BALLOON_COLORS = ['#e74c3c', '#f39c12', '#2ecc71', '#3498db', '#9b59b6'];

type BalloonProps = {
  position: [number, number, number];
  color: string;
  seed: number;
};

function Balloon({ position, color, seed }: BalloonProps) {
  const ref = useRef<Group>(null);
  const phase = useMemo(() => seed * 1.9, [seed]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 0.8 + phase) * 0.15;
    ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.5 + phase) * 0.08;
  });

  return (
    <group ref={ref} position={position}>
      {/* balloon */}
      <mesh castShadow position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
      </mesh>
      {/* knot */}
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* string */}
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.4, 4]} />
        <meshStandardMaterial color="#cccccc" roughness={0.9} />
      </mesh>
    </group>
  );
}

const CONFIGS: Array<{ id: string; pos: [number, number, number]; ci: number; seed: number }> = [
  { id: 'bl1', pos: [-1, 1.8, 3], ci: 0, seed: 1 },
  { id: 'bl2', pos: [-0.6, 2.0, 3.1], ci: 1, seed: 2 },
  { id: 'bl3', pos: [-1.3, 2.2, 3.2], ci: 2, seed: 3 },
  { id: 'bl4', pos: [2.5, 1.9, 2.5], ci: 3, seed: 4 },
  { id: 'bl5', pos: [2.9, 2.1, 2.6], ci: 4, seed: 5 },
];

export function Balloons() {
  return (
    <>
      {CONFIGS.map(({ id, pos, ci, seed }) => (
        <Balloon key={id} position={pos} color={BALLOON_COLORS[ci]} seed={seed} />
      ))}
    </>
  );
}
