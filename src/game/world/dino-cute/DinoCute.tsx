'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import type { Group, Mesh } from 'three';
import { useGame } from '@/src/game/store';
import { chooseExpression } from '@/src/game/systems/expression';
import { onPet, pet } from '@/src/game/systems/interactions';
import { getMood, type Mood } from '@/src/game/systems/mood';
import { useDinoMotion } from '@/src/game/world/useDinoMotion';
import { useDinoWalkCycle } from '@/src/game/world/useDinoWalkCycle';
import { useFacing } from '@/src/game/world/useFacing';
import { Claws } from './Claws';
import { DinoFace } from './face';
import { Mane } from './Mane';
import { PlayBall } from './PlayBall';
import { Spikes } from './Spikes';
import { TRexArm } from './TRexArm';

const BODY_COLOR = '#A8D5EE'; // light blue
const BELLY_COLOR = '#FFF6E0'; // cream
const CHEEK_COLOR = '#FF9CB8'; // pink
const LEG_COLOR = '#5E8FB5'; // darker blue
const MANE_COLOR = '#F5B83A'; // orange
const SPIKE_COLOR = '#3D6F94'; // dark blue
const CLAW_COLOR = '#1A1A1A'; // near-black

const TORSO_LEAN_X = 0.12; // ~7° forward lean

const NEVER_PETTED = Number.POSITIVE_INFINITY;

export function DinoCute() {
  const groupRef = useRef<Group>(null);
  const armLRef = useRef<Mesh>(null);
  const armRRef = useRef<Mesh>(null);
  const legLRef = useRef<Mesh>(null);
  const legRRef = useRef<Mesh>(null);
  const tailRef = useRef<Mesh>(null);

  const lastPetAtRef = useRef<number>(NEVER_PETTED);

  useEffect(() => {
    const unsub = onPet((charId) => {
      if (charId === 'dino') lastPetAtRef.current = performance.now();
    });
    return () => {
      unsub();
    };
  }, []);

  useEffect(() => {
    // E2E hook: read-only rotation accessor for tests asserting facing.
    (window as unknown as Record<string, unknown>).__getDinoRotationY = () =>
      groupRef.current?.rotation.y ?? null;
  }, []);

  const [mood, setMood] = useState<Mood>('happy');

  useFrame(() => {
    const stats = useGame.getState().characters.dino.stats;
    const last = lastPetAtRef.current;
    const secondsSincePet =
      last === NEVER_PETTED ? Number.POSITIVE_INFINITY : (performance.now() - last) / 1000;
    const next = getMood({ stats, secondsSincePet });
    if (next !== mood) setMood(next);
  });

  const action = useGame((s) => s.characters.dino.action);
  const expression = chooseExpression(mood, action?.kind ?? null);

  useDinoMotion(groupRef, 0);
  useDinoWalkCycle({
    armL: armLRef,
    armR: armRRef,
    legL: legLRef,
    legR: legRRef,
    tail: tailRef,
  });
  useFacing(groupRef, () => useGame.getState().characters.dino.position);

  return (
    <group
      ref={groupRef}
      onPointerDown={(e) => {
        e.stopPropagation();
        const a = useGame.getState().characters.dino.action;
        if (a !== null) return;
        const active = useGame.getState().active;
        if (active !== 'dino') useGame.getState().setActive('dino');
        else pet('dino');
      }}
    >
      {/* torso lean — body, belly, head+mane, cheeks, face wrapper, spikes, arms */}
      <group rotation={[TORSO_LEAN_X, 0, 0]}>
        {/* body — upright */}
        <mesh position={[0, 0.55, 0]} scale={[1.0, 1.0, 1.1]} castShadow>
          <sphereGeometry args={[0.45, 24, 24]} />
          <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
        </mesh>

        {/* belly patch */}
        <mesh position={[0, 0.5, 0.18]} scale={[1, 0.9, 0.4]}>
          <sphereGeometry args={[0.32, 20, 20]} />
          <meshStandardMaterial color={BELLY_COLOR} roughness={0.7} />
        </mesh>

        {/* head + mane (shared origin) */}
        <group position={[0, 1.05, 0.3]}>
          <mesh castShadow>
            <sphereGeometry args={[0.32, 24, 24]} />
            <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
          </mesh>
          <Mane color={MANE_COLOR} />
        </group>

        {/* cheeks (head-relative absolute coords) */}
        <mesh position={[-0.22, 1.0, 0.37]} scale={[1, 0.6, 0.4]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color={CHEEK_COLOR} roughness={0.6} />
        </mesh>
        <mesh position={[0.22, 1.0, 0.37]} scale={[1, 0.6, 0.4]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color={CHEEK_COLOR} roughness={0.6} />
        </mesh>

        {/* face — wrapped to track new head position (was [0, 0.85, 0.55], now [0, 1.05, 0.30]) */}
        <group position={[0, 0, 0.05]}>
          <DinoFace expression={expression} />
        </group>

        {/* spikes — body-relative, follow torso lean */}
        <Spikes color={SPIKE_COLOR} />

        {/* T-rex arms — chest-side, forearm refs driven by walk cycle */}
        <TRexArm x={-0.3} color={BODY_COLOR} clawColor={CLAW_COLOR} forearmRef={armLRef} />
        <TRexArm x={0.3} color={BODY_COLOR} clawColor={CLAW_COLOR} forearmRef={armRRef} />
      </group>

      {/* legs — vertical, NOT leaned. y must match LEG_BASE_Y in useDinoWalkCycle.ts */}
      <mesh ref={legLRef} position={[-0.18, 0.2, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.2, 8, 16]} />
        <meshStandardMaterial color={LEG_COLOR} roughness={0.7} />
      </mesh>
      <mesh ref={legRRef} position={[0.18, 0.2, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.2, 8, 16]} />
        <meshStandardMaterial color={LEG_COLOR} roughness={0.7} />
      </mesh>

      {/* claw dots on feet */}
      <Claws x={-0.18} color={CLAW_COLOR} />
      <Claws x={0.18} color={CLAW_COLOR} />

      {/* tail — ground-anchored, NOT leaned */}
      <mesh position={[0, 0.5, -0.45]} castShadow>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.45, -0.65]} castShadow>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
      </mesh>
      <mesh ref={tailRef} position={[0, 0.4, -0.8]} castShadow>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
      </mesh>

      <PlayBall />
    </group>
  );
}
