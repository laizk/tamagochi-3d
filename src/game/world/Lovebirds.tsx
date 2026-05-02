'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import type { Group } from 'three';
import { useGame } from '@/src/game/store';
import { onPet, pet } from '@/src/game/systems/interactions';
import { getMood, type Mood } from '@/src/game/systems/mood';
import { Lovebird } from '@/src/game/world/lovebird-cute/Lovebird';
import { useLovebirdMotion } from '@/src/game/world/useLovebirdMotion';

const NEVER = Number.POSITIVE_INFINITY;
const PERCH: [number, number, number] = [3, 2.5, -2];
const ORBIT_R = 0.6;

const BIRD1 = { top: '#FF7AB6', bottom: '#FFD86B' };
const BIRD2 = { top: '#7AD3FF', bottom: '#9CFF7A' };

export function Lovebirds() {
  const active = useGame((s) => s.active);
  const leaderRef = useRef<Group>(null);
  const partnerRef = useRef<Group>(null);
  const [spinAtLeader, setSpinAtLeader] = useState<number>(NaN);
  const [spinAtPartner, setSpinAtPartner] = useState<number>(NaN);
  const [mood, setMood] = useState<Mood>('happy');

  useEffect(() => {
    const unsub = onPet((charId) => {
      if (charId !== 'lovebirds') return;
      // ActionBar pet button: spin both birds.
      const ts = performance.now();
      setSpinAtLeader(ts);
      setSpinAtPartner(ts);
    });
    return () => {
      unsub();
    };
  }, []);

  // Mood update.
  useFrame(() => {
    const stats = useGame.getState().characters.lovebirds.stats;
    const next = getMood({ stats, secondsSincePet: NEVER });
    if (next !== mood) setMood(next);
  });

  // Active mode: leader controlled by pos; partner trails.
  useLovebirdMotion(leaderRef, partnerRef);

  // NPC mode: orbit cloud perch when not active.
  useFrame(() => {
    if (active === 'lovebirds') return;
    const t = performance.now() / 1000;
    if (leaderRef.current) {
      leaderRef.current.position.x = PERCH[0] + Math.cos(t * 0.7) * ORBIT_R;
      leaderRef.current.position.y = PERCH[1] + Math.sin(t * 0.5) * 0.08;
      leaderRef.current.position.z = PERCH[2] + Math.sin(t * 0.7) * ORBIT_R;
    }
    if (partnerRef.current) {
      partnerRef.current.position.x = PERCH[0] + Math.cos(t * 0.7 + Math.PI) * ORBIT_R;
      partnerRef.current.position.y = PERCH[1] + Math.sin(t * 0.5 + Math.PI) * 0.08;
      partnerRef.current.position.z = PERCH[2] + Math.sin(t * 0.7 + Math.PI) * ORBIT_R;
    }
  });

  const onLeaderClick = () => {
    if (active !== 'lovebirds') {
      useGame.getState().setActive('lovebirds');
      return;
    }
    setSpinAtLeader(performance.now());
    pet('lovebirds');
  };
  const onPartnerClick = () => {
    if (active !== 'lovebirds') {
      useGame.getState().setActive('lovebirds');
      return;
    }
    setSpinAtPartner(performance.now());
    pet('lovebirds');
  };

  const flapHz = active === 'lovebirds' ? 8 : 4;

  return (
    <>
      <Lovebird
        groupRef={leaderRef}
        topColor={BIRD1.top}
        bottomColor={BIRD1.bottom}
        mood={mood}
        flapHz={flapHz}
        spinAt={spinAtLeader}
        onClick={onLeaderClick}
      />
      <Lovebird
        groupRef={partnerRef}
        topColor={BIRD2.top}
        bottomColor={BIRD2.bottom}
        mood={mood}
        flapHz={flapHz}
        spinAt={spinAtPartner}
        onClick={onPartnerClick}
      />
    </>
  );
}
