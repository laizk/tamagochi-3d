'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group, Mesh } from 'three';

type ButterflyProps = {
  position: [number, number, number];
  wingColor: string;
  seed: number;
};

export function Butterfly({ position, wingColor, seed }: ButterflyProps) {
  const groupRef = useRef<Group>(null);
  const wingLRef = useRef<Mesh>(null);
  const wingRRef = useRef<Mesh>(null);

  const phase = useMemo(() => seed * 1.7, [seed]);
  const orbitRadius = useMemo(() => 0.6 + (seed % 4) * 0.2, [seed]);
  const orbitSpeed = useMemo(() => 0.5 + (seed % 3) * 0.15, [seed]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.position.x = position[0] + Math.cos(t * orbitSpeed + phase) * orbitRadius;
      groupRef.current.position.y = position[1] + Math.sin(t * 0.6 + phase) * 0.3;
      groupRef.current.position.z = position[2] + Math.sin(t * orbitSpeed + phase) * orbitRadius;
      // face direction of travel
      groupRef.current.rotation.y = -Math.atan2(
        Math.cos(t * orbitSpeed + phase) * orbitRadius,
        Math.cos(t * orbitSpeed + phase + 0.01) * orbitRadius -
          Math.cos(t * orbitSpeed + phase) * orbitRadius,
      );
    }
    // flap wings
    const flap = Math.abs(Math.sin(t * 7 + phase));
    if (wingLRef.current) wingLRef.current.rotation.y = flap * 0.8;
    if (wingRRef.current) wingRRef.current.rotation.y = -flap * 0.8;
  });

  return (
    <group ref={groupRef} position={position}>
      {/* body */}
      <mesh>
        <capsuleGeometry args={[0.03, 0.1, 4, 8]} />
        <meshStandardMaterial color="#333333" roughness={0.8} />
      </mesh>
      {/* left wings */}
      <mesh ref={wingLRef} position={[-0.07, 0, 0]}>
        <planeGeometry args={[0.2, 0.16]} />
        <meshStandardMaterial
          color={wingColor}
          side={2}
          transparent
          opacity={0.85}
          roughness={0.5}
        />
      </mesh>
      {/* right wings */}
      <mesh ref={wingRRef} position={[0.07, 0, 0]}>
        <planeGeometry args={[0.2, 0.16]} />
        <meshStandardMaterial
          color={wingColor}
          side={2}
          transparent
          opacity={0.85}
          roughness={0.5}
        />
      </mesh>
    </group>
  );
}

const BUTTERFLY_CONFIGS: Array<{
  id: string;
  pos: [number, number, number];
  color: string;
  seed: number;
}> = [
  { id: 'b1', pos: [1.0, 1.0, 1.0], color: '#ff69b4', seed: 1 },
  { id: 'b2', pos: [-1.5, 0.8, 0.5], color: '#ffa500', seed: 2 },
  { id: 'b3', pos: [0.5, 1.2, -1.0], color: '#9b59b6', seed: 3 },
];

export function Butterflies() {
  return (
    <>
      {BUTTERFLY_CONFIGS.map(({ id, pos, color, seed }) => (
        <Butterfly key={id} position={pos} wingColor={color} seed={seed} />
      ))}
    </>
  );
}
