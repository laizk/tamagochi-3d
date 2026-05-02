'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';

const ANCHOR: [number, number, number] = [-3, 0, -5];
const KITE_BASE: [number, number, number] = [-3, 4.5, -5];

export function Kite() {
  const ref = useRef<Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() / 1000;
    ref.current.position.x = KITE_BASE[0] + Math.sin(t * 0.6) * 0.6;
    ref.current.position.y = KITE_BASE[1] + Math.sin(t * 1.1) * 0.3;
    ref.current.position.z = KITE_BASE[2] + Math.cos(t * 0.4) * 0.4;
    ref.current.rotation.z = Math.sin(t * 1.3) * 0.2;
  });
  return (
    <>
      {/* string from anchor to kite — drawn as a thin tilted cylinder */}
      <mesh position={[(ANCHOR[0] + KITE_BASE[0]) / 2, (ANCHOR[1] + KITE_BASE[1]) / 2, (ANCHOR[2] + KITE_BASE[2]) / 2]}>
        <cylinderGeometry args={[0.005, 0.005, Math.hypot(KITE_BASE[1] - ANCHOR[1], 0.5), 4]} />
        <meshStandardMaterial color="#444" />
      </mesh>
      {/* anchor stake */}
      <mesh position={ANCHOR}>
        <cylinderGeometry args={[0.04, 0.04, 0.2, 6]} />
        <meshStandardMaterial color="#7a4a2c" />
      </mesh>
      {/* kite */}
      <group ref={ref}>
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <planeGeometry args={[0.5, 0.5]} />
          <meshStandardMaterial color="#FF7AB6" side={2} />
        </mesh>
        <mesh position={[0, -0.3, 0]}>
          <boxGeometry args={[0.05, 0.4, 0.005]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
      </group>
    </>
  );
}
