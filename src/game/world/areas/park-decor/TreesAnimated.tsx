'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';

const TREES: Array<[number, number, number]> = [
  [3, 4, 0],
  [-4, 5, 1.0],
  [5, -3, 2.1],
  [-3, -4, 3.2],
  [-6, 0, 0.5],
  [6, 1, 4.0],
  [-2, 6, 5.5],
];

export function TreesAnimated() {
  const refs = useRef<Array<Group | null>>([]);

  useFrame(() => {
    const t = performance.now() / 1000;
    refs.current.forEach((g, i) => {
      if (!g) return;
      const phase = TREES[i][2];
      g.rotation.z = Math.sin(t + phase) * 0.03;
    });
  });

  return (
    <>
      {TREES.map(([x, z], i) => (
        <group
          key={`${x}-${z}`}
          position={[x, 0, z]}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <mesh position={[0, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.2, 1, 8]} />
            <meshStandardMaterial color="#7a4a2c" />
          </mesh>
          <mesh position={[0, 1.4, 0]} castShadow>
            <coneGeometry args={[0.7, 1.4, 8]} />
            <meshStandardMaterial color="#3f8a3a" />
          </mesh>
        </group>
      ))}
    </>
  );
}
