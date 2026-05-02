'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';

export function Swing() {
  const seatRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!seatRef.current) return;
    seatRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.9) * 0.35;
  });

  return (
    <group position={[-4, 0, 2]}>
      {/* left post */}
      <mesh position={[-0.6, 1.0, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 2.0, 8]} />
        <meshStandardMaterial color="#8B5E3C" roughness={0.9} />
      </mesh>
      {/* right post */}
      <mesh position={[0.6, 1.0, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 2.0, 8]} />
        <meshStandardMaterial color="#8B5E3C" roughness={0.9} />
      </mesh>
      {/* crossbar */}
      <mesh position={[0, 2.1, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 1.4, 8]} />
        <meshStandardMaterial color="#8B5E3C" roughness={0.9} />
      </mesh>
      {/* swinging seat group — pivots from top */}
      <group ref={seatRef} position={[0, 2.0, 0]}>
        {/* left rope */}
        <mesh position={[-0.22, -0.6, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 1.2, 6]} />
          <meshStandardMaterial color="#d4a96a" roughness={0.9} />
        </mesh>
        {/* right rope */}
        <mesh position={[0.22, -0.6, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 1.2, 6]} />
          <meshStandardMaterial color="#d4a96a" roughness={0.9} />
        </mesh>
        {/* seat */}
        <mesh position={[0, -1.25, 0]} castShadow>
          <boxGeometry args={[0.55, 0.06, 0.24]} />
          <meshStandardMaterial color="#8B5E3C" roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}
