'use client';
import { OrbitControls } from '@react-three/drei';
import { Suspense } from 'react';
import { ActiveSceneControls } from '@/src/game/controls';
import { useGame } from '@/src/game/store';
import { AREAS } from '@/src/game/world/areas/registry';
import { Dino } from '@/src/game/world/Dino';
import { Lovebirds } from '@/src/game/world/Lovebirds';
import { CloudPerch } from '@/src/game/world/props/CloudPerch';

export function World() {
  const areaId = useGame((s) => s.currentArea);
  const Area = AREAS[areaId].Component;
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight castShadow position={[5, 10, 5]} intensity={1.2} />
      <Suspense fallback={null}>
        <Area />
      </Suspense>
      <Dino />
      <Lovebirds />
      <CloudPerch />
      <ActiveSceneControls />
      <OrbitControls
        makeDefault
        enablePan={false}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={4}
        maxDistance={14}
      />
    </>
  );
}
