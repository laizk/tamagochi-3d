'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import type { Group } from 'three';
import { useGame } from '@/src/game/store';
import { onPet, pet } from '@/src/game/systems/interactions';
import { getMood, type Mood } from '@/src/game/systems/mood';
import { Lovebird } from '@/src/game/world/lovebird-cute/Lovebird';
import { useFacing } from '@/src/game/world/useFacing';
import { getLovebirdsStorePos, useLovebirdMotion } from '@/src/game/world/useLovebirdMotion';
import { makePositionFromGroup, useLovebirdWander } from '@/src/game/world/useLovebirdWander';

const NEVER = Number.POSITIVE_INFINITY;
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
      const ts = performance.now();
      setSpinAtLeader(ts);
      setSpinAtPartner(ts);
    });
    return () => {
      unsub();
    };
  }, []);

  useFrame(() => {
    const stats = useGame.getState().characters.lovebirds.stats;
    const next = getMood({ stats, secondsSincePet: NEVER });
    if (next !== mood) setMood(next);
  });

  // Active mode: leader follows store, partner trails
  useLovebirdMotion(leaderRef, partnerRef);
  // NPC mode: each bird wanders independently around its anchor
  useLovebirdWander(leaderRef, partnerRef);

  // Facing — leader uses store position in active mode and own velocity in NPC mode.
  // Single hook switching getter based on active.
  const leaderPosGetter = makePositionFromGroup(leaderRef);
  useFacing(leaderRef, () =>
    useGame.getState().active === 'lovebirds' ? getLovebirdsStorePos() : leaderPosGetter(),
  );
  useFacing(partnerRef, makePositionFromGroup(partnerRef));

  const onLeaderClick = () => {
    const a = useGame.getState().characters.lovebirds.action;
    if (a !== null) return;
    if (active !== 'lovebirds') {
      useGame.getState().setActive('lovebirds');
      return;
    }
    setSpinAtLeader(performance.now());
    pet('lovebirds');
  };
  const onPartnerClick = () => {
    const a = useGame.getState().characters.lovebirds.action;
    if (a !== null) return;
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
      {/* TODO: extend Lovebird face to Expression so action states (eat/bath/sleep/play) show up. For now action only locks input. */}
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
