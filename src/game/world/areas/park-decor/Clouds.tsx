'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group } from 'three';

type CloudProps = {
  id: string;
  position: [number, number, number];
  speed: number;
  scale: number;
  xRange: number;
};

function Cloud({ position, speed, scale, xRange }: Omit<CloudProps, 'id'>) {
  const ref = useRef<Group>(null);
  const startX = useMemo(() => position[0], [position]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * speed;
    ref.current.position.x = startX + Math.sin(t) * xRange;
    ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 0.4) * 0.15;
  });

  return (
    <group ref={ref} position={position} scale={[scale, scale, scale]}>
      <mesh castShadow>
        <sphereGeometry args={[0.45, 10, 10]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
      <mesh position={[-0.35, -0.08, 0]}>
        <sphereGeometry args={[0.3, 10, 10]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
      <mesh position={[0.35, -0.08, 0]}>
        <sphereGeometry args={[0.3, 10, 10]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
      <mesh position={[0.0, -0.05, 0.22]}>
        <sphereGeometry args={[0.28, 10, 10]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
    </group>
  );
}

const CLOUDS: CloudProps[] = [
  { id: 'c1', position: [-3, 4.5, -4], speed: 0.12, scale: 1.0, xRange: 2.5 },
  { id: 'c2', position: [4, 5.0, -5], speed: 0.09, scale: 0.75, xRange: 2.0 },
  { id: 'c3', position: [0, 4.2, -6], speed: 0.15, scale: 1.2, xRange: 3.0 },
];

export function Clouds() {
  return (
    <>
      {CLOUDS.map(({ id, ...props }) => (
        <Cloud key={id} {...props} />
      ))}
    </>
  );
}
