'use client';
import { Portal } from '@/src/game/world/Portal';
import { Ground } from '@/src/game/world/props/Ground';
import { Sky } from '@/src/game/world/props/Sky';

export function Town() {
  return (
    <>
      <Sky />
      <Ground color="#c8c2a6" size={40} />
      {/* central plaza fountain */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[1.5, 1.5, 1, 16]} />
        <meshStandardMaterial color="#9aa9b6" />
      </mesh>
      <Portal to="yard" position={[-8, 0.7, 0]} />
      <Portal to="park" position={[0, 0.7, -8]} />
      <Portal to="beach" position={[8, 0.7, 0]} />
      <Portal to="forest" position={[0, 0.7, 8]} />
    </>
  );
}
