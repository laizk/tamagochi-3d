'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group } from 'three';

type TreeProps = {
  position: [number, number, number];
  seed: number;
};

function Tree({ position, seed }: TreeProps) {
  const topRef = useRef<Group>(null);

  const phase = useMemo(() => seed * 1.3, [seed]);
  const speed = useMemo(() => 0.8 + (seed % 5) * 0.1, [seed]);
  const amplitude = useMemo(() => 0.04 + (seed % 3) * 0.01, [seed]);

  useFrame(({ clock }) => {
    if (!topRef.current) return;
    topRef.current.rotation.z = Math.sin(clock.elapsedTime * speed + phase) * amplitude;
  });

  return (
    <group position={position}>
      {/* trunk */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 1, 8]} />
        <meshStandardMaterial color="#7a4a2c" roughness={0.9} />
      </mesh>
      {/* canopy sways */}
      <group ref={topRef} position={[0, 1.4, 0]}>
        <mesh castShadow>
          <coneGeometry args={[0.7, 1.4, 8]} />
          <meshStandardMaterial color="#3f8a3a" roughness={0.8} />
        </mesh>
        {/* second tier */}
        <mesh position={[0, 0.6, 0]} castShadow>
          <coneGeometry args={[0.5, 1.0, 8]} />
          <meshStandardMaterial color="#4a9e40" roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}

const TREES_DATA: Array<{ id: string; pos: [number, number, number]; seed: number }> = [
  { id: 't1', pos: [3, 0, 4], seed: 1 },
  { id: 't2', pos: [-4, 0, 5], seed: 2 },
  { id: 't3', pos: [5, 0, -3], seed: 3 },
  { id: 't4', pos: [-3, 0, -4], seed: 4 },
  { id: 't5', pos: [-6, 0, 0], seed: 5 },
];

export function TreesAnimated() {
  return (
    <>
      {TREES_DATA.map(({ id, pos, seed }) => (
        <Tree key={id} position={pos} seed={seed} />
      ))}
    </>
  );
}
