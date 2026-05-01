'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect } from 'react';
import { StatsBar } from '@/src/game/HUD/StatsBar';
import { useGame } from '@/src/game/store';
import { tick } from '@/src/game/systems/tick';
import { World } from '@/src/game/world/World';
import { load, scheduleSave } from '@/src/lib/persistence';
import { applyOfflineDrain } from '@/src/lib/time';

export function Game() {
  useEffect(() => {
    const loaded = load();
    if (loaded) {
      useGame.getState().hydrate(loaded);
      applyOfflineDrain(loaded.lastSeenAt);
    }
    useGame.getState().touchSeenAt();
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      tick(1);
      scheduleSave();
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') scheduleSave(0);
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('beforeunload', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('beforeunload', onHide);
    };
  }, []);

  return (
    <div className="relative h-dvh w-dvw">
      <Canvas
        shadows
        camera={{ position: [0, 4, 8], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <World />
        </Suspense>
      </Canvas>
      <StatsBar />
    </div>
  );
}
