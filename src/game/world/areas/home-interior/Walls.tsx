'use client';

const WALL_COLOR = '#F5E8D6';
const FULL_HEIGHT = 5;
const HALF_HEIGHT = 1.25;
const SIZE = 10;
const HALF = SIZE / 2;
const DOOR_GAP = 1.5;
const SIDE_PANEL = (SIZE - DOOR_GAP) / 2;
const SIDE_PANEL_X = (SIZE + DOOR_GAP) / 4;

export function Walls() {
  return (
    <>
      {/* north (back) wall */}
      <mesh position={[0, FULL_HEIGHT / 2, -HALF]} castShadow>
        <boxGeometry args={[SIZE, FULL_HEIGHT, 0.1]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      {/* west wall */}
      <mesh position={[-HALF, FULL_HEIGHT / 2, 0]} castShadow>
        <boxGeometry args={[0.1, FULL_HEIGHT, SIZE]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      {/* east wall */}
      <mesh position={[HALF, FULL_HEIGHT / 2, 0]} castShadow>
        <boxGeometry args={[0.1, FULL_HEIGHT, SIZE]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      {/* south wall — split with 1.5u doorway gap centered on x=0 */}
      <mesh position={[-SIDE_PANEL_X, FULL_HEIGHT / 2, HALF]} castShadow>
        <boxGeometry args={[SIDE_PANEL, FULL_HEIGHT, 0.1]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      <mesh position={[SIDE_PANEL_X, FULL_HEIGHT / 2, HALF]} castShadow>
        <boxGeometry args={[SIDE_PANEL, FULL_HEIGHT, 0.1]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      {/* floor 1 divider — half-height so pet roams freely */}
      <mesh position={[0, HALF_HEIGHT / 2, 0]} castShadow>
        <boxGeometry args={[0.1, HALF_HEIGHT, SIZE]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      {/* floor 2 divider — half-height */}
      <mesh position={[0, 2.5 + HALF_HEIGHT / 2, 0]} castShadow>
        <boxGeometry args={[0.1, HALF_HEIGHT, SIZE]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
    </>
  );
}
