'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh } from 'three';

export function Pond() {
  const waterRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (!waterRef.current) return;
    const mat = waterRef.current.material as { opacity: number };
    mat.opacity = 0.72 + Math.sin(clock.elapsedTime * 0.8) * 0.06;
  });

  return (
    <group position={[1.5, 0.01, -1.5]}>
      {/* water surface — scaled circle approximates an ellipse */}
      <mesh ref={waterRef} rotation={[-Math.PI / 2, 0, 0]} scale={[1.4, 1.0, 1.0]}>
        <circleGeometry args={[1.0, 32]} />
        <meshStandardMaterial
          color="#4db8e8"
          transparent
          opacity={0.75}
          roughness={0.1}
          metalness={0.2}
        />
      </mesh>
      {/* lily pad 1 */}
      <mesh rotation={[-Math.PI / 2, 0, 0.3]} position={[-0.3, 0.012, 0.2]}>
        <circleGeometry args={[0.2, 12]} />
        <meshStandardMaterial color="#3a8a3a" roughness={0.8} />
      </mesh>
      {/* lily pad 2 */}
      <mesh rotation={[-Math.PI / 2, 0, -0.5]} position={[0.4, 0.012, -0.1]}>
        <circleGeometry args={[0.15, 12]} />
        <meshStandardMaterial color="#4a9e40" roughness={0.8} />
      </mesh>
      {/* pond rim stones */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const angle = (i / 8) * Math.PI * 2;
        const rx = Math.cos(angle) * 1.5;
        const rz = Math.sin(angle) * 1.1;
        return (
          <mesh key={i} position={[rx, 0.02, rz]}>
            <sphereGeometry args={[0.1, 6, 6]} />
            <meshStandardMaterial color="#aaaaaa" roughness={0.95} />
          </mesh>
        );
      })}
    </group>
  );
}
