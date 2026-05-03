'use client';

const FLOOR_COLOR = '#D9B98A';

export function Floor() {
  return (
    <>
      {/* floor 1 (ground) */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[6, 0.05, 6]} />
        <meshStandardMaterial color={FLOOR_COLOR} />
      </mesh>
      {/* floor 2 */}
      <mesh position={[0, 2.5, 0]} receiveShadow castShadow>
        <boxGeometry args={[6, 0.05, 6]} />
        <meshStandardMaterial color={FLOOR_COLOR} />
      </mesh>
    </>
  );
}
