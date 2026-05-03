'use client';

import type { RefObject } from 'react';
import type { Mesh } from 'three';

const DEFAULT_COLOR = '#A8D5EE';
const DEFAULT_CLAW_COLOR = '#1A1A1A';

type Props = {
  /** Chest-side world x (use ±0.30). */
  x: number;
  /** Body-color sphere material. Defaults to dino blue. */
  color?: string;
  /** Claw-dot material. Defaults to near-black. */
  clawColor?: string;
  /** Forearm mesh ref so walk-cycle can rotate it. */
  forearmRef?: RefObject<Mesh | null>;
};

/**
 * Two-segment T-rex arm: upper-arm sphere, bent forearm sphere (driven by
 * walk cycle via `forearmRef`), and three small claw dots at the forearm tip.
 * Body-relative coordinates — mount inside the leaned torso group.
 */
export function TRexArm({
  x,
  color = DEFAULT_COLOR,
  clawColor = DEFAULT_CLAW_COLOR,
  forearmRef,
}: Props) {
  return (
    <>
      {/* upper-arm */}
      <mesh position={[x, 0.7, 0.32]} castShadow>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* forearm — driven by walk cycle */}
      <mesh ref={forearmRef ?? undefined} position={[x, 0.55, 0.42]} castShadow>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* 3 claw dots at forearm tip */}
      <mesh position={[x - 0.03, 0.5, 0.5]} castShadow>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color={clawColor} roughness={0.4} />
      </mesh>
      <mesh position={[x, 0.5, 0.51]} castShadow>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color={clawColor} roughness={0.4} />
      </mesh>
      <mesh position={[x + 0.03, 0.5, 0.5]} castShadow>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color={clawColor} roughness={0.4} />
      </mesh>
    </>
  );
}
