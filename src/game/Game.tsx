'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useState } from 'react';
import { ActionBar } from '@/src/game/HUD/ActionBar';
import { AreaName } from '@/src/game/HUD/AreaName';
import { MiniMap } from '@/src/game/HUD/MiniMap';
import { Onboarding } from '@/src/game/HUD/Onboarding';
import { SettingsMenu } from '@/src/game/HUD/SettingsMenu';
import { StatsBar } from '@/src/game/HUD/StatsBar';
import { ThoughtBubble } from '@/src/game/HUD/ThoughtBubble';
import { Welcome } from '@/src/game/HUD/Welcome';
import { useGame } from '@/src/game/store';
import { tick } from '@/src/game/systems/tick';
import { World } from '@/src/game/world/World';
import { load, scheduleSave } from '@/src/lib/persistence';
import { applyOfflineDrain } from '@/src/lib/time';

export function Game() {
  const [welcome, setWelcome] = useState<string | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    const loaded = load();
    if (loaded) {
      useGame.getState().hydrate(loaded);
      const summary = applyOfflineDrain(loaded.lastSeenAt);
      if (summary.biggestDrop !== 'okay') {
        setWelcome(`Dino is ${summary.biggestDrop}!`);
      } else {
        setWelcome('Dino missed you! 🦕');
      }
    } else {
      setWelcome("It's an egg! Tap to hatch.");
      setNeedsOnboarding(true);
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
      <AreaName />
      <Welcome message={welcome} />
      <MiniMap />
      <ActionBar />
      <SettingsMenu />
      <ThoughtBubble />
      {needsOnboarding && <Onboarding onDone={() => setNeedsOnboarding(false)} />}
    </div>
  );
}
