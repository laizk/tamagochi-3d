'use client';
import { Sky } from '@/src/game/world/props/Sky';
import { Ground } from '@/src/game/world/props/Ground';
import { Dino } from '@/src/game/world/Dino';

export function Home() {
  return (
    <>
      <Sky />
      <Ground color="#a98e6a" />
      {/* Simple "house" — a box */}
      <mesh position={[0, 1, -3]} castShadow>
        <boxGeometry args={[3, 2, 2]} />
        <meshStandardMaterial color="#d97a5e" />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 2.5, -3]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[2.2, 1.2, 4]} />
        <meshStandardMaterial color="#7e3f2c" />
      </mesh>
      <Dino />
    </>
  );
}
