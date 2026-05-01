'use client';
import { Portal } from '@/src/game/world/Portal';
import { Ground } from '@/src/game/world/props/Ground';
import { Sky } from '@/src/game/world/props/Sky';

export function SkyIsland() {
  return (
    <>
      <Sky />
      <Ground color="#e0d6ff" />
      <Portal to="town" position={[0, 0.7, 8]} />
    </>
  );
}
