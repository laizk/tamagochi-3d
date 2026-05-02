'use client';

import type { Mood } from '@/src/game/systems/mood';

type Props = { mood: Mood };

const COLOR = '#1a1a1a';

/**
 * W-shaped mouth: 4 short cylinders forming an upside-down W when neutral
 * (point-down, point-up, point-down). Inverts the orientation when sad.
 */
export function LovebirdMouth({ mood }: Props) {
  const flip = mood === 'sad' ? -1 : 1;
  const open = mood === 'happy' ? 1.4 : 1; // open W when happy/singing
  // Two segments per stroke; total 4 cylinders shaping the W.
  return (
    <group scale={[1, flip, 1]}>
      {[
        { p: [-0.045, 0.0, 0], r: [0, 0, -0.6] },
        { p: [-0.015, -0.02 * open, 0], r: [0, 0, 0.6] },
        { p: [0.015, -0.02 * open, 0], r: [0, 0, -0.6] },
        { p: [0.045, 0.0, 0], r: [0, 0, 0.6] },
      ].map((seg, i) => (
        <mesh
          key={i}
          position={seg.p as [number, number, number]}
          rotation={seg.r as [number, number, number]}
        >
          <cylinderGeometry args={[0.005, 0.005, 0.04, 6]} />
          <meshStandardMaterial color={COLOR} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}
