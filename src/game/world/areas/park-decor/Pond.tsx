'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh } from 'three';

export function Pond() {
  const lily1 = useRef<Mesh>(null);
  const lily2 = useRef<Mesh>(null);

  useFrame(() => {
    const t = performance.now() / 1000;
    if (lily1.current) lily1.current.rotation.y = t * 0.3;
    if (lily2.current) lily2.current.rotation.y = -t * 0.25;
  });

  return (
    <group position={[5, 0.01, 5]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.4, 32]} />
        <meshStandardMaterial color="#5BA8C8" roughness={0.2} />
      </mesh>
      <mesh ref={lily1} position={[0.4, 0.02, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.18, 16]} />
        <meshStandardMaterial color="#3f8a3a" />
      </mesh>
      <mesh ref={lily2} position={[-0.5, 0.02, -0.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.15, 16]} />
        <meshStandardMaterial color="#3f8a3a" />
      </mesh>
    </group>
  );
}
