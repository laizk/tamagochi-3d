'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import type { Vector3 } from 'three';
import { useGame } from '@/src/game/store';
import { FLOOR_2_THRESHOLD } from '@/src/game/world/areas/home-interior/stair-config';
import { AREAS } from '@/src/game/world/areas/registry';
import { clampPan } from '@/src/lib/math';

type ControlsLike = { target: Vector3 } | null;

/**
 * Bounds OrbitControls' pan target to per-area extents and recenters on
 * the active pet whenever the player switches characters, areas, or floors.
 */
export function CameraRig() {
  const controls = useThree((s) => s.controls) as ControlsLike;
  const area = useGame((s) => s.currentArea);
  const active = useGame((s) => s.active);
  const [level, setLevel] = useState(1);
  const lastLevelRef = useRef(1);

  // biome-ignore lint/correctness/useExhaustiveDependencies: level/area/active triggers recenter on travel; read via getState() avoids stale closure
  useEffect(() => {
    if (!controls) return;
    const pos = useGame.getState().characters[active].position;
    controls.target.set(pos[0], pos[1] + 0.5, pos[2]);
  }, [active, area, level, controls]);

  useFrame(() => {
    if (!controls) return;
    const state = useGame.getState();
    const ext = AREAS[state.currentArea].extent;
    clampPan(controls.target, ext);
    const y = state.characters[state.active].position[1];
    const next = y > FLOOR_2_THRESHOLD ? 2 : 1;
    if (next !== lastLevelRef.current) {
      lastLevelRef.current = next;
      setLevel(next);
    }
  });

  return null;
}
