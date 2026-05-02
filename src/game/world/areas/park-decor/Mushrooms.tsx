'use client';

import { useMemo } from 'react';

type MushroomProps = {
  position: [number, number, number];
  scale?: number;
  capColor?: string;
};

function Mushroom({ position, scale = 1, capColor = '#e84545' }: MushroomProps) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* stalk */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.2, 8]} />
        <meshStandardMaterial color="#f5e6c8" roughness={0.9} />
      </mesh>
      {/* cap */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <sphereGeometry args={[0.16, 12, 8]} />
        <meshStandardMaterial color={capColor} roughness={0.7} />
      </mesh>
      {/* spots */}
      <mesh position={[0.07, 0.28, 0.12]}>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshStandardMaterial color="#ffffff" roughness={0.8} />
      </mesh>
      <mesh position={[-0.06, 0.3, 0.1]}>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshStandardMaterial color="#ffffff" roughness={0.8} />
      </mesh>
    </group>
  );
}

const MUSHROOMS: Array<{
  id: string;
  pos: [number, number, number];
  scale: number;
  capColor: string;
}> = [
  { id: 'm1', pos: [-2.0, 0, 2.5], scale: 1.0, capColor: '#e84545' },
  { id: 'm2', pos: [-2.3, 0, 2.7], scale: 0.7, capColor: '#ff8c42' },
  { id: 'm3', pos: [4.0, 0, 2.0], scale: 0.85, capColor: '#e84545' },
  { id: 'm4', pos: [-4.5, 0, -1.5], scale: 1.1, capColor: '#cc3333' },
  { id: 'm5', pos: [2.0, 0, -3.5], scale: 0.75, capColor: '#ff8c42' },
];

export function Mushrooms() {
  const items = useMemo(() => MUSHROOMS, []);
  return (
    <>
      {items.map(({ id, pos, scale, capColor }) => (
        <Mushroom key={id} position={pos} scale={scale} capColor={capColor} />
      ))}
    </>
  );
}
