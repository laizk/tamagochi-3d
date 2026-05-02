'use client';
import { Portal } from '@/src/game/world/Portal';
import { Ground } from '@/src/game/world/props/Ground';
import { Sky } from '@/src/game/world/props/Sky';

const TREES: Array<[number, number]> = [
  [3, 4],
  [-4, 5],
  [5, -3],
  [-3, -4],
  [-6, 0],
];

export function Park() {
  return (
    <>
      <Sky />
      <Ground color="#88c47a" />
      {TREES.map(([x, z], _i) => (
        <group key={`${x}-${z}`} position={[x, 0, z]}>
          <mesh position={[0, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.2, 1, 8]} />
            <meshStandardMaterial color="#7a4a2c" />
          </mesh>
          <mesh position={[0, 1.4, 0]} castShadow>
            <coneGeometry args={[0.7, 1.4, 8]} />
            <meshStandardMaterial color="#3f8a3a" />
          </mesh>
        </group>
      ))}
      <Portal to="town" position={[0, 0.7, 8]} />
    </>
  );
}
