'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh } from 'three';
import { type AreaId, useGame } from '@/src/game/store';
import { AREAS } from '@/src/game/world/areas/registry';

type Props = {
  to: AreaId;
  position: [number, number, number];
};

export function Portal({ to, position }: Props) {
  const ref = useRef<Mesh>(null);
  const setArea = useGame((s) => s.setArea);
  const setPosition = useGame((s) => s.setPosition);
  const targetLocked = AREAS[to].locked;

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.7;
  });

  useFrame(() => {
    if (targetLocked) return;
    const dino = useGame.getState().dino.position;
    const dx = dino[0] - position[0];
    const dz = dino[2] - position[2];
    if (Math.hypot(dx, dz) < 1) {
      const target = AREAS[to];
      setArea(to);
      setPosition(target.spawn);
    }
  });

  return (
    <mesh
      ref={ref}
      position={position}
      onPointerDown={() => {
        if (targetLocked) return;
        setArea(to);
        setPosition(AREAS[to].spawn);
      }}
    >
      <torusGeometry args={[0.7, 0.15, 12, 24]} />
      <meshStandardMaterial
        color={targetLocked ? '#888' : '#4ec0ff'}
        emissive={targetLocked ? '#000' : '#2280bb'}
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}
