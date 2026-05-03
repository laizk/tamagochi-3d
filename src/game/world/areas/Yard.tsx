'use client';
import { Fountain } from '@/src/game/world/areas/home-decor/Fountain';
import { Pond } from '@/src/game/world/areas/home-decor/Pond';
import { Portal } from '@/src/game/world/Portal';
import { Ground } from '@/src/game/world/props/Ground';
import { Sky } from '@/src/game/world/props/Sky';

export function Yard() {
  return (
    <>
      <Sky />
      <Ground color="#a98e6a" />
      {/* cottage exterior — sized 6×2×6 to match the interior footprint */}
      <mesh position={[0, 1, -3]} castShadow>
        <boxGeometry args={[6, 2, 6]} />
        <meshStandardMaterial color="#d97a5e" />
      </mesh>
      <mesh position={[0, 2.5, -3]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[4.5, 1.5, 4]} />
        <meshStandardMaterial color="#7e3f2c" />
      </mesh>
      {/* Pond wrapped to push it 3.5u further back so it clears the bigger cottage */}
      <group position={[0, 0, -3.5]}>
        <Pond />
      </group>
      <Fountain />
      <Portal to="home" position={[0, 0.7, 0.3]} />
      <Portal to="town" position={[8, 0.7, 0]} />
    </>
  );
}
