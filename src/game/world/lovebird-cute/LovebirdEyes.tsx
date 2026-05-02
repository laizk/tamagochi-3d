'use client';

import type { Mood } from '@/src/game/systems/mood';

type Props = { mood: Mood };

export function LovebirdEyes({ mood }: Props) {
  // Sclera (white), pupil (dark), highlight (tiny white dot for twinkle).
  const pupilScaleY = mood === 'sad' ? 0.4 : 1; // half-closed when sad
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0.03]} scale={[1, pupilScaleY, 1]}>
        <sphereGeometry args={[0.025, 12, 12]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
      </mesh>
      <mesh position={[0.012, 0.012, 0.05]}>
        <sphereGeometry args={[0.008, 8, 8]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}
