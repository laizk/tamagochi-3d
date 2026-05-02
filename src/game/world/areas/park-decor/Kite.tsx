'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';

export function Kite() {
  const kiteRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!kiteRef.current) return;
    const t = clock.elapsedTime;
    kiteRef.current.position.x = 3.5 + Math.sin(t * 0.5) * 1.2;
    kiteRef.current.position.y = 3.8 + Math.sin(t * 0.7 + 1) * 0.5;
    kiteRef.current.position.z = -3.0 + Math.cos(t * 0.4) * 0.8;
    kiteRef.current.rotation.z = Math.sin(t * 0.6) * 0.2;
    kiteRef.current.rotation.x = Math.sin(t * 0.5 + 0.5) * 0.1;
  });

  return (
    <group ref={kiteRef} position={[3.5, 3.8, -3.0]}>
      {/* kite diamond */}
      <mesh rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[0.5, 0.65]} />
        <meshStandardMaterial color="#e74c3c" side={2} roughness={0.6} />
      </mesh>
      {/* cross braces */}
      <mesh position={[0, 0, 0.01]} rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[0.5, 0.01]} />
        <meshStandardMaterial color="#ffffff" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0, 0.01]} rotation={[0, 0, -Math.PI / 4]}>
        <planeGeometry args={[0.65, 0.01]} />
        <meshStandardMaterial color="#ffffff" roughness={0.8} />
      </mesh>
      {/* tail bow 1 */}
      <mesh position={[0, -0.5, 0]}>
        <sphereGeometry args={[0.05, 6, 6]} />
        <meshStandardMaterial color="#f39c12" roughness={0.7} />
      </mesh>
      {/* tail bow 2 */}
      <mesh position={[0, -0.8, 0]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial color="#3498db" roughness={0.7} />
      </mesh>
      {/* tail bow 3 */}
      <mesh position={[0, -1.1, 0]}>
        <sphereGeometry args={[0.035, 6, 6]} />
        <meshStandardMaterial color="#e74c3c" roughness={0.7} />
      </mesh>
    </group>
  );
}
