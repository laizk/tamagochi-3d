'use client';

import { useFrame } from '@react-three/fiber';
import { type RefObject, useRef } from 'react';
import type { Group } from 'three';
import { useGame } from '@/src/game/store';
import { pickWanderTarget } from '@/src/game/systems/wander';

const RADIUS = 3;
const REPLAN_AFTER_MS = 6000;
const ARRIVE_DIST = 0.2;
const FLY_SPEED = 1.5;

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
) {
  if (!ref.current) return;
  if (active === 'lovebirds') {
    // active mode handled by useLovebirdMotion; just remember position for next anchor capture
    if (!state.anchor) state.anchor = [0, 0, 0];
    state.anchor[0] = ref.current.position.x;
    state.anchor[1] = ref.current.position.y;
    state.anchor[2] = ref.current.position.z;
    state.target = null;
    state.pickedAt = 0;
    return;
  }
  // entering NPC mode this frame OR first NPC frame
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
  ref.current.position.x += (tx - cur.x) * factor;
  ref.current.position.y += (ty - cur.y) * factor;
  ref.current.position.z += (tz - cur.z) * factor;
}

/**
 * Drives both lovebirds in NPC mode (active !== 'lovebirds') with independent
 * wandering around per-bird anchors. Anchor captured when the player switches
 * away from the lovebirds (or on first mount in NPC mode).
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
    const prevWasBirds = prevActive.current === 'lovebirds';
    update(leaderRef, leaderState.current, active, prevWasBirds, dt);
    update(partnerRef, partnerState.current, active, prevWasBirds, dt);
    prevActive.current = active;
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
