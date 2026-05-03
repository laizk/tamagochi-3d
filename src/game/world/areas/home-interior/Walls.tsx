'use client';

const WALL_COLOR = '#F5E8D6';
const FULL_HEIGHT = 5;
const HALF_HEIGHT = 1.25;

export function Walls() {
  return (
    <>
      {/* north (back) wall */}
      <mesh position={[0, FULL_HEIGHT / 2, -3]} castShadow>
        <boxGeometry args={[6, FULL_HEIGHT, 0.1]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      {/* west wall */}
      <mesh position={[-3, FULL_HEIGHT / 2, 0]} castShadow>
        <boxGeometry args={[0.1, FULL_HEIGHT, 6]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      {/* east wall */}
      <mesh position={[3, FULL_HEIGHT / 2, 0]} castShadow>
        <boxGeometry args={[0.1, FULL_HEIGHT, 6]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      {/* south wall — split with 1.5u doorway gap centered on x=0 */}
      <mesh position={[-1.875, FULL_HEIGHT / 2, 3]} castShadow>
        <boxGeometry args={[2.25, FULL_HEIGHT, 0.1]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      <mesh position={[1.875, FULL_HEIGHT / 2, 3]} castShadow>
        <boxGeometry args={[2.25, FULL_HEIGHT, 0.1]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      {/* floor 1 divider — half-height so pet roams freely */}
      <mesh position={[0, HALF_HEIGHT / 2, 0]} castShadow>
        <boxGeometry args={[0.1, HALF_HEIGHT, 6]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      {/* floor 2 divider — half-height */}
      <mesh position={[0, 2.5 + HALF_HEIGHT / 2, 0]} castShadow>
        <boxGeometry args={[0.1, HALF_HEIGHT, 6]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
    </>
  );
}
