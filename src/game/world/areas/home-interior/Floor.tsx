'use client';

const FLOOR_COLOR = '#D9B98A';

export function Floor() {
  return (
    <>
      {/* floor 1 (ground) — tagged so TapControls raycast registers taps */}
      <mesh position={[0, 0, 0]} receiveShadow userData={{ kind: 'ground' }}>
        <boxGeometry args={[10, 0.05, 10]} />
        <meshStandardMaterial color={FLOOR_COLOR} />
      </mesh>
      {/* floor 2 — also tagged so taps land dino/lovebirds upstairs */}
      <mesh position={[0, 2.5, 0]} receiveShadow castShadow userData={{ kind: 'ground' }}>
        <boxGeometry args={[10, 0.05, 10]} />
        <meshStandardMaterial color={FLOOR_COLOR} />
      </mesh>
    </>
  );
}
