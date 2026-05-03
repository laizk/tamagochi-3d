'use client';

const FLOOR_COLOR = '#D9B98A';

/**
 * Floor 2 has a stair-shaped cutout at x[4,5] z[1,5] so the staircase
 * (right of the front door) emerges through the upper floor.
 */
export function Floor() {
  return (
    <>
      {/* floor 1 (ground) — single 10×10 slab, tagged as ground */}
      <mesh position={[0, 0, 0]} receiveShadow userData={{ kind: 'ground' }}>
        <boxGeometry args={[10, 0.05, 10]} />
        <meshStandardMaterial color={FLOOR_COLOR} />
      </mesh>
      {/* floor 2 main slab: x[-5,4] full z */}
      <mesh position={[-0.5, 2.5, 0]} receiveShadow castShadow userData={{ kind: 'ground' }}>
        <boxGeometry args={[9, 0.05, 10]} />
        <meshStandardMaterial color={FLOOR_COLOR} />
      </mesh>
      {/* floor 2 east strip north of stair top: x[4,5] z[-5,1] */}
      <mesh position={[4.5, 2.5, -2]} receiveShadow castShadow userData={{ kind: 'ground' }}>
        <boxGeometry args={[1, 0.05, 6]} />
        <meshStandardMaterial color={FLOOR_COLOR} />
      </mesh>
    </>
  );
}
