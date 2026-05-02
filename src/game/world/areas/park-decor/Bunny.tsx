'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group, Mesh } from 'three';

const BUNNY_COLOR = '#f5f0eb';
const EAR_INNER = '#ffb3c6';

export function Bunny() {
  const groupRef = useRef<Group>(null);
  const earLRef = useRef<Mesh>(null);
  const earRRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    // gentle idle bob
    groupRef.current.position.y = Math.abs(Math.sin(clock.elapsedTime * 1.5)) * 0.08;

    // ear twitch
    const twitch = Math.sin(clock.elapsedTime * 2.5) * 0.1;
    if (earLRef.current) earLRef.current.rotation.z = 0.15 + twitch;
    if (earRRef.current) earRRef.current.rotation.z = -0.15 - twitch;
  });

  return (
    <group ref={groupRef} position={[-3.5, 0, -2]}>
      {/* body */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color={BUNNY_COLOR} roughness={0.9} />
      </mesh>
      {/* head */}
      <mesh position={[0, 0.56, 0.05]} castShadow>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color={BUNNY_COLOR} roughness={0.9} />
      </mesh>
      {/* left ear */}
      <mesh ref={earLRef} position={[-0.08, 0.82, 0.05]} castShadow>
        <capsuleGeometry args={[0.04, 0.22, 4, 8]} />
        <meshStandardMaterial color={BUNNY_COLOR} roughness={0.9} />
      </mesh>
      <mesh position={[-0.08, 0.82, 0.07]}>
        <capsuleGeometry args={[0.025, 0.16, 4, 8]} />
        <meshStandardMaterial color={EAR_INNER} roughness={0.8} />
      </mesh>
      {/* right ear */}
      <mesh ref={earRRef} position={[0.08, 0.82, 0.05]} castShadow>
        <capsuleGeometry args={[0.04, 0.22, 4, 8]} />
        <meshStandardMaterial color={BUNNY_COLOR} roughness={0.9} />
      </mesh>
      <mesh position={[0.08, 0.82, 0.07]}>
        <capsuleGeometry args={[0.025, 0.16, 4, 8]} />
        <meshStandardMaterial color={EAR_INNER} roughness={0.8} />
      </mesh>
      {/* eyes */}
      <mesh position={[-0.06, 0.59, 0.14]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#111111" roughness={0.5} />
      </mesh>
      <mesh position={[0.06, 0.59, 0.14]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#111111" roughness={0.5} />
      </mesh>
      {/* nose */}
      <mesh position={[0, 0.55, 0.17]}>
        <sphereGeometry args={[0.018, 6, 6]} />
        <meshStandardMaterial color="#ffb3c6" roughness={0.7} />
      </mesh>
      {/* tail */}
      <mesh position={[0, 0.22, -0.22]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
    </group>
  );
}
