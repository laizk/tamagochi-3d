'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';

const CLOUDS: Array<{ y: number; z: number; speed: number; offset: number }> = [
  { y: 6, z: -4, speed: 0.3, offset: 0 },
  { y: 7, z: -8, speed: 0.2, offset: 5 },
  { y: 5.5, z: 4, speed: 0.25, offset: 10 },
  { y: 6.5, z: 8, speed: 0.18, offset: 2 },
];

const X_RANGE = 20;

export function Clouds() {
  const refs = useRef<Array<Group | null>>([]);

  useFrame(() => {
    const t = performance.now() / 1000;
    refs.current.forEach((g, i) => {
      if (!g) return;
      const c = CLOUDS[i];
      const x = ((t * c.speed + c.offset + X_RANGE / 2) % X_RANGE) - X_RANGE / 2;
      g.position.x = x;
    });
  });

  return (
    <>
      {CLOUDS.map((c, i) => (
        <group
          key={`${c.y}-${c.z}`}
          position={[0, c.y, c.z]}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <mesh position={[-0.4, 0, 0]}>
            <sphereGeometry args={[0.5, 12, 12]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[0, 0.1, 0]}>
            <sphereGeometry args={[0.55, 12, 12]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[0.4, 0, 0]}>
            <sphereGeometry args={[0.45, 12, 12]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
        </group>
      ))}
    </>
  );
}
