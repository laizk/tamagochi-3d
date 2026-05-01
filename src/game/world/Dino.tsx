'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh } from 'three';
import { useGame } from '@/src/game/store';

export function Dino() {
  const ref = useRef<Mesh>(null);
  const position = useGame((s) => s.dino.position);
  const stats = useGame((s) => s.dino.stats);

  useFrame((_, _dt) => {
    if (!ref.current) return;
    // Idle bob
    const bob = Math.sin(performance.now() / 400) * 0.05;
    ref.current.position.set(position[0], position[1] + 0.5 + bob, position[2]);
    // Sad lean if any need is critical
    const sad = Math.min(stats.hunger, stats.happy, stats.energy, stats.clean) < 25;
    ref.current.rotation.x = sad ? 0.2 : 0;
  });

  return (
    <mesh ref={ref} castShadow>
      <sphereGeometry args={[0.5, 24, 24]} />
      <meshStandardMaterial color={'#6dbf6d'} roughness={0.6} />
    </mesh>
  );
}
