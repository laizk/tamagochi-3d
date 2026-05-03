'use client';

const STAIR_COLOR = '#C49A6C';
const STEP_RISE = 0.5;
const STEP_DEPTH = 0.6;

// Five steps rendered explicitly — no array-index key needed.
const STEP_INDICES = [0, 1, 2, 3, 4] as const;

export function Stairs() {
  return (
    <>
      {STEP_INDICES.map((i) => (
        <mesh
          key={i}
          position={[2.0, (STEP_RISE * (i + 1)) / 2, -3 + 0.3 + i * STEP_DEPTH]}
          castShadow
        >
          <boxGeometry args={[1.0, STEP_RISE * (i + 1), STEP_DEPTH]} />
          <meshStandardMaterial color={STAIR_COLOR} />
        </mesh>
      ))}
    </>
  );
}
