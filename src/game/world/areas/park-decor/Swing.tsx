'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';

export function Swing() {
  const seatRef = useRef<Group>(null);
  useFrame(() => {
    if (!seatRef.current) return;
    const t = performance.now() / 1000;
    seatRef.current.rotation.x = Math.sin(t * 1.5) * 0.4;
  });
  return (
    <group position={[-5, 0, 5]}>
      {/* posts */}
      <mesh position={[-0.6, 1.0, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 2, 8]} />
        <meshStandardMaterial color="#a06a3a" />
      </mesh>
      <mesh position={[0.6, 1.0, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 2, 8]} />
        <meshStandardMaterial color="#a06a3a" />
      </mesh>
      {/* crossbar */}
      <mesh position={[0, 2.0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 1.4, 8]} />
        <meshStandardMaterial color="#a06a3a" />
      </mesh>
      {/* swing seat (rotates around y=2) */}
      <group ref={seatRef} position={[0, 2.0, 0]}>
        <mesh position={[-0.3, -0.6, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 1.2, 6]} />
          <meshStandardMaterial color="#444" />
        </mesh>
        <mesh position={[0.3, -0.6, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 1.2, 6]} />
          <meshStandardMaterial color="#444" />
        </mesh>
        <mesh position={[0, -1.2, 0]} castShadow>
          <boxGeometry args={[0.7, 0.05, 0.2]} />
          <meshStandardMaterial color="#FF9C6B" />
        </mesh>
      </group>
    </group>
  );
}
