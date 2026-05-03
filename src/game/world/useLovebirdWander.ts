'use client';

import { useFrame } from '@react-three/fiber';
import { type RefObject, useRef } from 'react';
import type { Group } from 'three';
import { useGame } from '@/src/game/store';
import { type Obstacle, PET_R, separatePets, tryStep } from '@/src/game/systems/collision';
import { pickWanderTarget } from '@/src/game/systems/wander';
import { HOME_OBSTACLES } from '@/src/game/world/areas/home-interior/obstacles';
import { readRuntimePos, writeRuntimePos } from '@/src/game/world/runtimePositions';

const RADIUS = 3;
const REPLAN_AFTER_MS = 6000;
const ARRIVE_DIST = 0.2;
const FLY_SPEED = 1.5;

const NO_OBSTACLES: Obstacle[] = [];

function obstaclesFor(area: string): Obstacle[] {
  return area === 'home' ? HOME_OBSTACLES : NO_OBSTACLES;
}

type BirdState = {
  anchor: [number, number, number] | null;
  target: [number, number, number] | null;
  pickedAt: number;
};

function freshBird(): BirdState {
  return { anchor: null, target: null, pickedAt: 0 };
}

function update(
  ref: RefObject<Group | null>,
  state: BirdState,
  active: 'lovebirds' | 'dino',
  prevActiveWasBirds: boolean,
  dt: number,
  area: string,
  avoidId: string | null,
) {
  if (!ref.current) return;
  if (active === 'lovebirds') {
    if (!state.anchor) state.anchor = [0, 0, 0];
    state.anchor[0] = ref.current.position.x;
    state.anchor[1] = ref.current.position.y;
    state.anchor[2] = ref.current.position.z;
    state.target = null;
    state.pickedAt = 0;
    return;
  }
  if (state.anchor === null || prevActiveWasBirds) {
    state.anchor = [ref.current.position.x, ref.current.position.y, ref.current.position.z];
  }
  const now = performance.now();
  const cur = ref.current.position;
  const needNew =
    state.target === null ||
    Math.hypot(cur.x - state.target[0], cur.z - state.target[2]) < ARRIVE_DIST ||
    now - state.pickedAt > REPLAN_AFTER_MS;
  if (needNew && state.anchor) {
    state.target = pickWanderTarget(state.anchor, RADIUS);
    state.pickedAt = now;
  }
  if (!state.target) return;
  const tx = state.target[0];
  const ty = state.target[1];
  const tz = state.target[2];
  const factor = Math.min(1, dt * FLY_SPEED);
  const dxStep = (tx - cur.x) * factor;
  const dzStep = (tz - cur.z) * factor;
  const obstacles = obstaclesFor(area);
  const stepped = tryStep(cur.x, cur.z, cur.y, dxStep, dzStep, PET_R, obstacles);
  let nx = stepped.x;
  let nz = stepped.z;
  if (avoidId) {
    const other = readRuntimePos(avoidId);
    const adj = separatePets(nx, nz, cur.y, other[0], other[2], other[1], PET_R);
    nx = adj.x;
    nz = adj.z;
  }
  cur.x = nx;
  cur.y += (ty - cur.y) * factor;
  cur.z = nz;
}

/**
 * Drives both lovebirds in NPC mode (active !== 'lovebirds') with independent
 * wandering around per-bird anchors. Anchor captured when the player switches
 * away from the lovebirds (or on first mount in NPC mode).
 *
 * Always syncs the leader position to the runtime cache so other pets can
 * avoid it via separatePets.
 */
export function useLovebirdWander(
  leaderRef: RefObject<Group | null>,
  partnerRef: RefObject<Group | null>,
) {
  const leaderState = useRef<BirdState>(freshBird());
  const partnerState = useRef<BirdState>(freshBird());
  const prevActive = useRef<'lovebirds' | 'dino'>('dino');

  useFrame((_state, dt) => {
    const active = useGame.getState().active;
    const area = useGame.getState().currentArea;
    const prevWasBirds = prevActive.current === 'lovebirds';
    update(leaderRef, leaderState.current, active, prevWasBirds, dt, area, 'dino');
    // partner trails the leader, no need to avoid the same pet twice
    update(partnerRef, partnerState.current, active, prevWasBirds, dt, area, null);
    prevActive.current = active;
    // publish leader pos for cross-pet avoidance
    if (leaderRef.current) {
      const p = leaderRef.current.position;
      writeRuntimePos('lovebirds', p.x, p.y, p.z);
    }
  });
}

/**
 * Returns a position getter for a Group ref.
 * useFacing calls this getter each frame and derives velocity itself via frame-to-frame delta.
 */
export function makePositionFromGroup(
  ref: RefObject<Group | null>,
): () => readonly [number, number, number] {
  return () => {
    const p = ref.current?.position;
    return p ? ([p.x, p.y, p.z] as const) : ([0, 0, 0] as const);
  };
}
