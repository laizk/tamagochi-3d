'use client';
import { Portal } from '@/src/game/world/Portal';
import { Ground } from '@/src/game/world/props/Ground';
import { Sky } from '@/src/game/world/props/Sky';

const ROCKS: Array<[number, number, number]> = [
  [3, 0.5, 2],
  [-2, 0.6, 3],
  [4, 0.4, -3],
  [-3, 0.5, -2],
];

export function Cave() {
  return (
    <>
      <Sky />
      <ambientLight intensity={0.15} />
      <Ground color="#3a3a40" />
      {ROCKS.map(([x, y, z], _i) => (
        <mesh key={`${x}-${z}`} position={[x, y, z]} castShadow>
          <boxGeometry args={[1, 0.9, 1]} />
          <meshStandardMaterial color="#5a5a60" />
        </mesh>
      ))}
      <Portal to="beach" position={[-8, 0.7, 0]} />
      <Portal to="forest" position={[0, 0.7, -8]} />
    </>
  );
}
