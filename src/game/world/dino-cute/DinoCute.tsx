'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import type { Group, Mesh } from 'three';
import { useGame } from '@/src/game/store';
import { onPet } from '@/src/game/systems/interactions';
import { getMood, type Mood } from '@/src/game/systems/mood';
import { useDinoMotion } from '@/src/game/world/useDinoMotion';
import { DinoEyes } from './DinoEyes';
import { DinoMouth } from './DinoMouth';

const BODY_COLOR = '#7FE0B0';
const BELLY_COLOR = '#FFF6E0';
const CHEEK_COLOR = '#FF9CB8';

const NEVER_PETTED = Number.POSITIVE_INFINITY;

export function DinoCute() {
  const groupRef = useRef<Group>(null);
  const armLRef = useRef<Mesh>(null);
  const armRRef = useRef<Mesh>(null);
  const tailTipRef = useRef<Mesh>(null);

  // Track the most recent pet timestamp via a ref so the useFrame loop reads
  // the latest value without retriggering frame-effect registration.
  const lastPetAtRef = useRef<number>(NEVER_PETTED);

  useEffect(() => {
    const unsub = onPet(() => {
      lastPetAtRef.current = performance.now();
    });
    return () => {
      unsub();
    };
  }, []);

  // Mood is React state so eye/mouth subtrees rerender only on transition.
  const [mood, setMood] = useState<Mood>('happy');

  useFrame(() => {
    // --- mood derivation (called every frame; setState only on change) ---
    const stats = useGame.getState().dino.stats;
    const last = lastPetAtRef.current;
    const secondsSincePet =
      last === NEVER_PETTED ? Number.POSITIVE_INFINITY : (performance.now() - last) / 1000;
    const next = getMood({ stats, secondsSincePet });
    if (next !== mood) setMood(next);

    // --- limb wiggle (always runs; tiny rotations) ---
    const now = performance.now();
    if (armLRef.current) armLRef.current.rotation.z = Math.sin(now / 500) * 0.05;
    if (armRRef.current) armRRef.current.rotation.z = -Math.sin(now / 500) * 0.05;
    if (tailTipRef.current) tailTipRef.current.rotation.y = Math.sin(now / 600) * 0.08;
  });

  // Drive global bob, pet-bounce, and sad-lean. baseY=0 because this group is feet-origin.
  useDinoMotion(groupRef, 0);

  return (
    <group ref={groupRef}>
      {/* body */}
      <mesh position={[0, 0.55, 0]} scale={[1.0, 0.85, 1.1]} castShadow>
        <sphereGeometry args={[0.45, 24, 24]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
      </mesh>

      {/* belly patch */}
      <mesh position={[0, 0.5, 0.18]} scale={[1, 0.9, 0.4]}>
        <sphereGeometry args={[0.32, 20, 20]} />
        <meshStandardMaterial color={BELLY_COLOR} roughness={0.7} />
      </mesh>

      {/* head */}
      <mesh position={[0, 1.05, 0.25]} castShadow>
        <sphereGeometry args={[0.32, 24, 24]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
      </mesh>

      {/* cheeks */}
      <mesh position={[-0.22, 1.0, 0.32]} scale={[1, 0.6, 0.4]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color={CHEEK_COLOR} roughness={0.6} />
      </mesh>
      <mesh position={[0.22, 1.0, 0.32]} scale={[1, 0.6, 0.4]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color={CHEEK_COLOR} roughness={0.6} />
      </mesh>

      {/* eyes */}
      <group position={[-0.12, 1.13, 0.45]}>
        <DinoEyes mood={mood} />
      </group>
      <group position={[0.12, 1.13, 0.45]}>
        <DinoEyes mood={mood} />
      </group>

      {/* mouth */}
      <group position={[0, 0.95, 0.5]}>
        <DinoMouth mood={mood} />
      </group>

      {/* arms (wiggle) */}
      <mesh ref={armLRef} position={[-0.42, 0.55, 0.05]} castShadow>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
      </mesh>
      <mesh ref={armRRef} position={[0.42, 0.55, 0.05]} castShadow>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
      </mesh>

      {/* legs — capsule center at y=0.2 puts feet at y=0 (radius 0.1 + half-length 0.1) */}
      <mesh position={[-0.18, 0.2, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.2, 8, 16]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
      </mesh>
      <mesh position={[0.18, 0.2, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.2, 8, 16]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
      </mesh>

      {/* tail */}
      <mesh position={[0, 0.5, -0.45]} castShadow>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.45, -0.65]} castShadow>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
      </mesh>
      <mesh ref={tailTipRef} position={[0, 0.4, -0.8]} castShadow>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
      </mesh>

      {/* back bumps */}
      <mesh position={[0, 0.95, -0.1]} castShadow>
        <coneGeometry args={[0.06, 0.1, 12]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.95, -0.3]} castShadow>
        <coneGeometry args={[0.07, 0.12, 12]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.7, -0.5]} castShadow>
        <coneGeometry args={[0.05, 0.08, 12]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
      </mesh>
    </group>
  );
}
