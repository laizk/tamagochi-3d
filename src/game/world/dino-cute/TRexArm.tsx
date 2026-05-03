'use client';

import type { RefObject } from 'react';
import type { Group } from 'three';

const DEFAULT_COLOR = '#A8D5EE';
const DEFAULT_CLAW_COLOR = '#1A1A1A';

const SHOULDER_Y = 0.7;
const SHOULDER_Z = 0.32;

type Props = {
  /** Chest-side world x (use ±0.30). */
  x: number;
  /** Body-color sphere material. Defaults to dino blue. */
  color?: string;
  /** Claw-dot material. Defaults to near-black. */
  clawColor?: string;
  /** Group ref anchored at the shoulder pivot. Walk cycle rotates this. */
  armRef?: RefObject<Group | null>;
};

/**
 * Two-segment T-rex arm: upper-arm sphere at the shoulder pivot, bent
 * forearm sphere displaced forward+down, three claw dots at the forearm tip.
 * The whole arm group is anchored at the shoulder, so rotating it swings
 * the arm naturally around the shoulder pivot.
 *
 * Body-relative — mount inside the leaned torso group.
 */
export function TRexArm({
  x,
  color = DEFAULT_COLOR,
  clawColor = DEFAULT_CLAW_COLOR,
  armRef,
}: Props) {
  return (
    <group ref={armRef ?? undefined} position={[x, SHOULDER_Y, SHOULDER_Z]}>
      {/* upper-arm at shoulder origin */}
      <mesh castShadow>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* forearm — bent forward+down from shoulder */}
      <mesh position={[0, -0.15, 0.1]} castShadow>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* 3 claw dots at forearm tip */}
      <mesh position={[-0.03, -0.2, 0.18]} castShadow>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color={clawColor} roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.2, 0.19]} castShadow>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color={clawColor} roughness={0.4} />
      </mesh>
      <mesh position={[0.03, -0.2, 0.18]} castShadow>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color={clawColor} roughness={0.4} />
      </mesh>
    </group>
  );
}
