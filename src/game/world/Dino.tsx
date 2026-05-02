'use client';

import { useRef } from 'react';
import type { Mesh } from 'three';
import { useGame } from '@/src/game/store';
import { DinoCute } from '@/src/game/world/dino-cute/DinoCute';
import { useDinoMotion } from '@/src/game/world/useDinoMotion';

function DinoEgg() {
  const ref = useRef<Mesh>(null);
  // Sphere is center-origin, so baseY is sphere radius (0.5).
  useDinoMotion(ref, 0.5);
  return (
    <mesh ref={ref} castShadow>
      <sphereGeometry args={[0.5, 24, 24]} />
      <meshStandardMaterial color="#6dbf6d" roughness={0.6} />
    </mesh>
  );
}

export function Dino() {
  const stage = useGame((s) => s.dino.stage);
  if (stage === 'egg') return <DinoEgg />;
  return <DinoCute />;
}
