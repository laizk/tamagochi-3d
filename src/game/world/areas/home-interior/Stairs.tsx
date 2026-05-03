'use client';

import {
  STAIR_BASE_Z,
  STAIR_WIDTH,
  STAIR_X,
  STEP_COUNT,
  STEP_DEPTH,
  STEP_RISE,
} from './stair-config';

const STAIR_COLOR = '#C49A6C';

const STEP_INDICES = Array.from({ length: STEP_COUNT }, (_, i) => i);

export function Stairs() {
  return (
    <>
      {STEP_INDICES.map((i) => {
        const top = STEP_RISE * (i + 1);
        const z = STAIR_BASE_Z - 0.3 - i * STEP_DEPTH;
        return (
          <mesh key={i} position={[STAIR_X, top / 2, z]} castShadow receiveShadow>
            <boxGeometry args={[STAIR_WIDTH, top, STEP_DEPTH]} />
            <meshStandardMaterial color={STAIR_COLOR} />
          </mesh>
        );
      })}
    </>
  );
}
