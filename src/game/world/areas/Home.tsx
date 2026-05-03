'use client';
import { Fountain } from '@/src/game/world/areas/home-decor/Fountain';
import { Pond } from '@/src/game/world/areas/home-decor/Pond';
import { Portal } from '@/src/game/world/Portal';
import { Ground } from '@/src/game/world/props/Ground';
import { Sky } from '@/src/game/world/props/Sky';

export function Home() {
  return (
    <>
      <Sky />
      <Ground color="#a98e6a" />
      <mesh position={[0, 1, -3]} castShadow>
        <boxGeometry args={[3, 2, 2]} />
        <meshStandardMaterial color="#d97a5e" />
      </mesh>
      <mesh position={[0, 2.5, -3]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[2.2, 1.2, 4]} />
        <meshStandardMaterial color="#7e3f2c" />
      </mesh>
      <Pond />
      <Fountain />
      <Portal to="town" position={[6, 0.7, 0]} />
    </>
  );
}
