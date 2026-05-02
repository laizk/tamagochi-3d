'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group } from 'three';

const PETAL_COLORS = ['#ff6eb4', '#ffd700', '#ff8c00', '#ff4444', '#cc66ff'];

type FlowerProps = {
  position: [number, number, number];
  colorIndex: number;
  seed: number;
};

function Flower({ position, colorIndex, seed }: FlowerProps) {
  const stemRef = useRef<Group>(null);
  const phase = useMemo(() => seed * 2.1, [seed]);

  useFrame(({ clock }) => {
    if (!stemRef.current) return;
    stemRef.current.rotation.z = Math.sin(clock.elapsedTime * 1.2 + phase) * 0.06;
  });

  const color = PETAL_COLORS[colorIndex % PETAL_COLORS.length];

  return (
    <group position={position}>
      <group ref={stemRef}>
        {/* stem */}
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.02, 0.025, 0.24, 6]} />
          <meshStandardMaterial color="#4caf50" roughness={0.9} />
        </mesh>
        {/* petals */}
        {(['p0', 'p1', 'p2', 'p3', 'p4'] as const).map((pid, i) => (
          <mesh
            key={pid}
            position={[
              Math.cos((i / 5) * Math.PI * 2) * 0.07,
              0.26,
              Math.sin((i / 5) * Math.PI * 2) * 0.07,
            ]}
          >
            <sphereGeometry args={[0.045, 8, 8]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
        ))}
        {/* center */}
        <mesh position={[0, 0.27, 0]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#ffd700" roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

const FLOWERS: Array<{ id: string; pos: [number, number, number]; ci: number; seed: number }> = [
  { id: 'f1', pos: [1.0, 0, 2.0], ci: 0, seed: 1 },
  { id: 'f2', pos: [1.4, 0, 2.3], ci: 1, seed: 2 },
  { id: 'f3', pos: [0.7, 0, 2.5], ci: 2, seed: 3 },
  { id: 'f4', pos: [-1.0, 0, 1.5], ci: 3, seed: 4 },
  { id: 'f5', pos: [-1.5, 0, 1.8], ci: 4, seed: 5 },
  { id: 'f6', pos: [-0.8, 0, 2.0], ci: 0, seed: 6 },
  { id: 'f7', pos: [2.5, 0, -1.0], ci: 1, seed: 7 },
  { id: 'f8', pos: [2.8, 0, -0.6], ci: 2, seed: 8 },
  { id: 'f9', pos: [-2.0, 0, -2.0], ci: 3, seed: 9 },
  { id: 'f10', pos: [-2.4, 0, -1.6], ci: 4, seed: 10 },
  { id: 'f11', pos: [0.5, 0, -2.5], ci: 0, seed: 11 },
  { id: 'f12', pos: [-0.5, 0, -2.8], ci: 1, seed: 12 },
];

export function Flowers() {
  return (
    <>
      {FLOWERS.map(({ id, pos, ci, seed }) => (
        <Flower key={id} position={pos} colorIndex={ci} seed={seed} />
      ))}
    </>
  );
}
