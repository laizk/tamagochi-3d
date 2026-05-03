'use client';

const FLOOR_COLOR = '#D9B98A';

/**
 * Floor 2 has a stair-shaped cutout at x∈[2,3], z∈[-1,5] so the staircase
 * comes up through it instead of clipping into the upper floor.
 */
export function Floor() {
  return (
    <>
      {/* floor 1 (ground) — single 10×10 slab, tagged as ground */}
      <mesh position={[0, 0, 0]} receiveShadow userData={{ kind: 'ground' }}>
        <boxGeometry args={[10, 0.05, 10]} />
        <meshStandardMaterial color={FLOOR_COLOR} />
      </mesh>
      {/* floor 2 west strip: x[-5,2] full z */}
      <mesh position={[-1.5, 2.5, 0]} receiveShadow castShadow userData={{ kind: 'ground' }}>
        <boxGeometry args={[7, 0.05, 10]} />
        <meshStandardMaterial color={FLOOR_COLOR} />
      </mesh>
      {/* floor 2 east strip: x[3,5] full z */}
      <mesh position={[4, 2.5, 0]} receiveShadow castShadow userData={{ kind: 'ground' }}>
        <boxGeometry args={[2, 0.05, 10]} />
        <meshStandardMaterial color={FLOOR_COLOR} />
      </mesh>
      {/* floor 2 stair-lane bridge: x[2,3] z[-5,-1] (north of the stair top) */}
      <mesh position={[2.5, 2.5, -3]} receiveShadow castShadow userData={{ kind: 'ground' }}>
        <boxGeometry args={[1, 0.05, 4]} />
        <meshStandardMaterial color={FLOOR_COLOR} />
      </mesh>
    </>
  );
}
