'use client';
import { OrbitControls } from '@react-three/drei';
import { ActiveSceneControls } from '@/src/game/controls';
import { Home } from '@/src/game/world/areas/Home';

export function World() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight castShadow position={[5, 10, 5]} intensity={1.2} />
      <Home />
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
