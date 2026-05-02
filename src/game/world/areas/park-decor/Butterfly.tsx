'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group, Mesh } from 'three';

const BUTTERFLIES: Array<{ center: [number, number, number]; color: string; offset: number }> = [
  { center: [2, 1.5, 1], color: '#FF7AB6', offset: 0 },
  { center: [-3, 1.8, 0], color: '#FFD86B', offset: 1.5 },
  { center: [4, 1.3, -2], color: '#A4E0FF', offset: 3.0 },
  { center: [-1, 2, 4], color: '#C8A4FF', offset: 4.5 },
];

const FLAP_HZ = 8;

function Wing({ side, color, flapRef }: { side: 1 | -1; color: string; flapRef: React.RefObject<Mesh | null> }) {
  return (
    <mesh ref={flapRef} position={[0.05 * side, 0, 0]}>
      <planeGeometry args={[0.18, 0.14]} />
      <meshStandardMaterial color={color} side={2} roughness={0.5} />
    </mesh>
  );
}

export function Butterfly({ idx }: { idx: number }) {
  const groupRef = useRef<Group>(null);
  const wingL = useRef<Mesh>(null);
  const wingR = useRef<Mesh>(null);
  const cfg = BUTTERFLIES[idx];

  useFrame(() => {
    if (!groupRef.current) return;
    const t = performance.now() / 1000 + cfg.offset;
    groupRef.current.position.x = cfg.center[0] + Math.sin(t * 0.6) * 1.5;
    groupRef.current.position.y = cfg.center[1] + Math.sin(t * 0.9) * 0.4;
    groupRef.current.position.z = cfg.center[2] + Math.cos(t * 0.7) * 1.5;
    const flap = Math.sin(t * FLAP_HZ * Math.PI * 2);
    if (wingL.current) wingL.current.rotation.y = flap * 0.8;
    if (wingR.current) wingR.current.rotation.y = -flap * 0.8;
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <boxGeometry args={[0.02, 0.05, 0.02]} />
        <meshStandardMaterial color="#1A1A24" />
      </mesh>
      <Wing side={-1} color={cfg.color} flapRef={wingL} />
      <Wing side={1} color={cfg.color} flapRef={wingR} />
    </group>
  );
}

export function Butterflies() {
  return (
    <>
      {BUTTERFLIES.map((_, i) => (
        <Butterfly key={i} idx={i} />
      ))}
    </>
  );
}
