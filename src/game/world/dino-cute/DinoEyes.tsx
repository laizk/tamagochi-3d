'use client';

import type { Mood } from '@/src/game/systems/mood';

const PUPIL_COLOR = '#1A1A24';
const TEAR_COLOR = '#9CD0FF';
const SPARKLE_COLOR = '#FFFFFF';

export function DinoEyes({ mood }: { mood: Mood }) {
  if (mood === 'sleepy') {
    return (
      <mesh rotation={[Math.PI / 2, 0, Math.PI]}>
        <torusGeometry args={[0.05, 0.012, 8, 16, Math.PI]} />
        <meshStandardMaterial color={PUPIL_COLOR} roughness={0.5} />
      </mesh>
    );
  }

  if (mood === 'bouncy') {
    return (
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.05, 0.012, 8, 16, Math.PI]} />
        <meshStandardMaterial color={PUPIL_COLOR} roughness={0.5} />
      </mesh>
    );
  }

  // happy or sad — same structure, different scale + optional tear
  const scale = mood === 'sad' ? 1.15 : 1;

  return (
    <group scale={scale}>
      {/* eye white */}
      <mesh>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
      </mesh>
      {/* pupil */}
      <mesh position={[0, 0, 0.04]}>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshStandardMaterial color={PUPIL_COLOR} roughness={0.5} />
      </mesh>
      {/* sparkle */}
      <mesh position={[-0.02, 0.02, 0.05]}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshStandardMaterial color={SPARKLE_COLOR} roughness={0.2} />
      </mesh>
      {/* tear (sad only) */}
      {mood === 'sad' && (
        <mesh position={[0.02, -0.07, 0.04]}>
          <sphereGeometry args={[0.02, 12, 12]} />
          <meshStandardMaterial color={TEAR_COLOR} roughness={0.2} />
        </mesh>
      )}
    </group>
  );
}
