'use client';

const TOP_COLOR = '#FF7AB6';
const BEAK_COLOR = '#FFD24A';
const EYE_COLOR = '#1A1A1A';

/**
 * Static smiling lovebird head for the picture-frame portrait.
 * Centered at origin so a camera at [0, 0, 1.2] looking at origin frames it well.
 */
export function LovebirdPortrait() {
  return (
    <>
      {/* head — bigger than in-game so it fills the frame */}
      <mesh>
        <sphereGeometry args={[0.3, 24, 24]} />
        <meshStandardMaterial color={TOP_COLOR} roughness={0.7} />
      </mesh>
      {/* beak */}
      <mesh position={[0, -0.05, 0.32]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.07, 0.14, 8]} />
        <meshStandardMaterial color={BEAK_COLOR} roughness={0.5} />
      </mesh>
      {/* eyes */}
      <mesh position={[-0.12, 0.07, 0.27]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshStandardMaterial color={EYE_COLOR} />
      </mesh>
      <mesh position={[0.12, 0.07, 0.27]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshStandardMaterial color={EYE_COLOR} />
      </mesh>
    </>
  );
}
