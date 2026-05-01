'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import type { Mesh } from 'three';
import { useGame } from '@/src/game/store';
import { onPet } from '@/src/game/systems/interactions';

export function Dino() {
  const ref = useRef<Mesh>(null);
  const position = useGame((s) => s.dino.position);
  const stats = useGame((s) => s.dino.stats);
  const [bounce, setBounce] = useState(0);

  useEffect(() => {
    const unsub = onPet(() => setBounce(performance.now()));
    return () => {
      unsub();
    };
  }, []);

  useFrame((_, _dt) => {
    if (!ref.current) return;
    const bob = Math.sin(performance.now() / 400) * 0.05;
    const bouncePhase = (performance.now() - bounce) / 1000;
    const bounceY = bouncePhase < 0.6 ? Math.sin((bouncePhase * Math.PI) / 0.6) * 0.4 : 0;
    ref.current.position.set(position[0], position[1] + 0.5 + bob + bounceY, position[2]);
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
