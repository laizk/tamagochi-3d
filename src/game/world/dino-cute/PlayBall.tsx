'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import { useGame } from '@/src/game/store';

const BALL_COLOR = '#FF7A6B';
const STRIPE_COLOR = '#FFFFFF';

export function PlayBall() {
  const ref = useRef<Group>(null);
  const action = useGame((s) => s.characters.dino.action);

  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() / 1000;
    // Local coords — parent dino group provides world position + facing rotation.
    ref.current.position.x = 0;
    ref.current.position.z = 0.7;
    ref.current.position.y = 0.15 + Math.abs(Math.sin(t * 6)) * 0.4;
    ref.current.rotation.x = t * 4;
    ref.current.rotation.z = t * 2;
  });

  if (!action || action.kind !== 'play') return null;
  return (
    <group ref={ref}>
      <mesh castShadow>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color={BALL_COLOR} roughness={0.4} />
      </mesh>
      <mesh>
        <torusGeometry args={[0.151, 0.012, 8, 24]} />
        <meshStandardMaterial color={STRIPE_COLOR} roughness={0.4} />
      </mesh>
    </group>
  );
}
