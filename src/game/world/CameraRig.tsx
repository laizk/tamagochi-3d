'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import type { Vector3 } from 'three';
import { useGame } from '@/src/game/store';
import { AREAS } from '@/src/game/world/areas/registry';
import { clampPan } from '@/src/lib/math';

type ControlsLike = { target: Vector3 } | null;

/**
 * Bounds OrbitControls' pan target to per-area extents and recenters on
 * the active pet whenever the player switches characters or areas.
 */
export function CameraRig() {
  const controls = useThree((s) => s.controls) as ControlsLike;
  const area = useGame((s) => s.currentArea);
  const active = useGame((s) => s.active);

  // biome-ignore lint/correctness/useExhaustiveDependencies: area triggers recenter on travel; read via getState() avoids stale closure
  useEffect(() => {
    if (!controls) return;
    const pos = useGame.getState().characters[active].position;
    controls.target.set(pos[0], pos[1] + 0.5, pos[2]);
  }, [active, area, controls]);

  useFrame(() => {
    if (!controls) return;
    const ext = AREAS[useGame.getState().currentArea].extent;
    clampPan(controls.target, ext);
  });

  return null;
}
