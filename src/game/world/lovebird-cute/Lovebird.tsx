'use client';

import { useFrame } from '@react-three/fiber';
import { type RefObject, useRef } from 'react';
import type { Group } from 'three';
import type { Mood } from '@/src/game/systems/mood';
import { LovebirdEyes } from './LovebirdEyes';
import { LovebirdMouth } from './LovebirdMouth';

type Props = {
  /** Top half color (rainbow gradient top). */
  topColor: string;
  /** Bottom half color (rainbow gradient bottom). */
  bottomColor: string;
  mood: Mood;
  /** Wing flap rate in Hz (8 active, 2 perched). */
  flapHz: number;
  /** Optional outer ref so parent can drive position/rotation. */
  groupRef?: RefObject<Group | null>;
  /** Pet-spin trigger timestamp (performance.now()). NaN = no spin. */
  spinAt?: number;
  /** Click handler for tap-to-control / pet. */
  onClick?: () => void;
};

const BEAK_COLOR = '#FFD24A';

export function Lovebird({
  topColor,
  bottomColor,
  mood,
  flapHz,
  groupRef,
  spinAt = NaN,
  onClick,
}: Props) {
  const localRef = useRef<Group>(null);
  const ref = groupRef ?? localRef;
  const wingLRef = useRef<Group>(null);
  const wingRRef = useRef<Group>(null);

  useFrame(() => {
    const now = performance.now();
    // Wing flap.
    const flap = Math.sin((now / 1000) * Math.PI * 2 * flapHz) * 0.6;
    if (wingLRef.current) wingLRef.current.rotation.z = flap;
    if (wingRRef.current) wingRRef.current.rotation.z = -flap;

    // Pet-spin (one full Y rotation over 0.6s).
    if (ref.current) {
      const dt = (now - spinAt) / 1000;
      ref.current.rotation.y =
        Number.isFinite(spinAt) && dt < 0.6 ? dt * (Math.PI * 2) * (1 / 0.6) : 0;
    }
  });

  return (
    <group
      ref={ref}
      onPointerDown={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {/* body — top half */}
      <mesh position={[0, 0.13, 0]} scale={[1.0, 0.45, 1.1]} castShadow>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshStandardMaterial color={topColor} roughness={0.7} />
      </mesh>
      {/* body — bottom half */}
      <mesh position={[0, 0.05, 0]} scale={[1.0, 0.45, 1.1]} castShadow>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshStandardMaterial color={bottomColor} roughness={0.7} />
      </mesh>
      {/* head */}
      <mesh position={[0, 0.28, 0.05]} castShadow>
        <sphereGeometry args={[0.14, 24, 24]} />
        <meshStandardMaterial color={topColor} roughness={0.7} />
      </mesh>
      {/* beak */}
      <mesh position={[0, 0.25, 0.2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.04, 0.07, 8]} />
        <meshStandardMaterial color={BEAK_COLOR} roughness={0.5} />
      </mesh>
      {/* eyes */}
      <group position={[-0.06, 0.31, 0.16]}>
        <LovebirdEyes mood={mood} />
      </group>
      <group position={[0.06, 0.31, 0.16]}>
        <LovebirdEyes mood={mood} />
      </group>
      {/* mouth */}
      <group position={[0, 0.2, 0.21]}>
        <LovebirdMouth mood={mood} />
      </group>
      {/* wings */}
      <group ref={wingLRef} position={[-0.16, 0.13, 0]}>
        <mesh scale={[0.6, 0.15, 0.4]} castShadow>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color={topColor} roughness={0.7} />
        </mesh>
      </group>
      <group ref={wingRRef} position={[0.16, 0.13, 0]}>
        <mesh scale={[0.6, 0.15, 0.4]} castShadow>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color={topColor} roughness={0.7} />
        </mesh>
      </group>
      {/* tail */}
      <mesh position={[0, 0.13, -0.18]} castShadow>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color={bottomColor} roughness={0.7} />
      </mesh>
    </group>
  );
}
