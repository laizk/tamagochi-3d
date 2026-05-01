'use client';
import { Portal } from '@/src/game/world/Portal';
import { Ground } from '@/src/game/world/props/Ground';
import { Sky } from '@/src/game/world/props/Sky';

const TREES: Array<[number, number]> = [
  [2, 2],
  [-3, 1],
  [4, -2],
  [-2, -3],
  [5, 4],
  [-5, 4],
  [3, -5],
  [-4, -2],
  [6, 1],
  [0, 5],
  [-6, -3],
  [1, -4],
];

export function Forest() {
  return (
    <>
      <Sky />
      <Ground color="#4a7a3c" />
      {TREES.map(([x, z], _i) => (
        <group key={`${x}-${z}`} position={[x, 0, z]}>
          <mesh position={[0, 0.6, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.24, 1.2, 8]} />
            <meshStandardMaterial color="#5a3a22" />
          </mesh>
          <mesh position={[0, 1.7, 0]} castShadow>
            <coneGeometry args={[0.85, 1.7, 8]} />
            <meshStandardMaterial color="#2f6a2f" />
          </mesh>
        </group>
      ))}
      <Portal to="town" position={[0, 0.7, 8]} />
      <Portal to="cave" position={[0, 0.7, -8]} />
    </>
  );
}
