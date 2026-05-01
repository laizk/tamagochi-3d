'use client';
import { Portal } from '@/src/game/world/Portal';
import { Ground } from '@/src/game/world/props/Ground';
import { Sky } from '@/src/game/world/props/Sky';

export function Beach() {
  return (
    <>
      <Sky />
      <Ground color="#f6e2a3" />
      <mesh position={[0, 0.01, 8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 12]} />
        <meshStandardMaterial color="#3da9c7" transparent opacity={0.8} />
      </mesh>
      <Portal to="town" position={[-8, 0.7, 0]} />
      <Portal to="cave" position={[8, 0.7, 0]} />
    </>
  );
}
