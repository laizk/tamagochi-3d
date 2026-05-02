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
import { DinoFace } from './face';
import { PlayBall } from './PlayBall';

const BODY_COLOR = '#7FE0B0';
const BELLY_COLOR = '#FFF6E0';
const CHEEK_COLOR = '#FF9CB8';

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

      {/* face — snout, jaw, eyes, brows, tongue, extras */}
      <DinoFace expression={expression} />

      {/* arms (walk cycle) */}
      <mesh ref={armLRef} position={[-0.42, 0.55, 0.05]} castShadow>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
      </mesh>
      <mesh ref={armRRef} position={[0.42, 0.55, 0.05]} castShadow>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
      </mesh>

      {/* legs (walk cycle) */}
      <mesh ref={legLRef} position={[-0.18, 0.2, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.2, 8, 16]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
      </mesh>
      <mesh ref={legRRef} position={[0.18, 0.2, 0]} castShadow>
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
      <mesh ref={tailRef} position={[0, 0.4, -0.8]} castShadow>
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
      <PlayBall />
    </group>
  );
}
