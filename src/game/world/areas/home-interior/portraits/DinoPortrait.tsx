'use client';

const BODY_COLOR = '#A8D5EE';
const CHEEK_COLOR = '#FF9CB8';
const EYE_COLOR = '#1A1A1A';
const SMILE_COLOR = '#1A1A1A';

/**
 * Static smiling dino head for the picture-frame portrait.
 * Centered at origin so a camera at [0, 0, 1.2] looking at origin frames it well.
 */
export function DinoPortrait() {
  return (
    <>
      {/* head */}
      <mesh>
        <sphereGeometry args={[0.32, 24, 24]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
      </mesh>
      {/* cheeks */}
      <mesh position={[-0.2, -0.05, 0.27]} scale={[1, 0.6, 0.4]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color={CHEEK_COLOR} roughness={0.6} />
      </mesh>
      <mesh position={[0.2, -0.05, 0.27]} scale={[1, 0.6, 0.4]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color={CHEEK_COLOR} roughness={0.6} />
      </mesh>
      {/* closed-happy eyes (small dark dots) */}
      <mesh position={[-0.12, 0.08, 0.3]}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshStandardMaterial color={EYE_COLOR} />
      </mesh>
      <mesh position={[0.12, 0.08, 0.3]}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshStandardMaterial color={EYE_COLOR} />
      </mesh>
      {/* smile (thin curved bar approximated as a flat torus segment) */}
      <mesh position={[0, -0.1, 0.32]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.08, 0.012, 8, 24, Math.PI]} />
        <meshStandardMaterial color={SMILE_COLOR} />
      </mesh>
    </>
  );
}
