'use client';

import type { Mood } from '@/src/game/systems/mood';

const MOUTH_COLOR = '#1A1A24';

export function DinoMouth({ mood }: { mood: Mood }) {
  if (mood === 'bouncy') {
    return (
      <mesh>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color={MOUTH_COLOR} roughness={0.6} />
      </mesh>
    );
  }

  if (mood === 'sleepy') {
    return (
      <mesh>
        <boxGeometry args={[0.08, 0.012, 0.012]} />
        <meshStandardMaterial color={MOUTH_COLOR} roughness={0.5} />
      </mesh>
    );
  }

  // happy = smile (rotation z=PI flips the arc upward); sad = frown (z=0)
  const zRot = mood === 'happy' ? Math.PI : 0;
  return (
    <mesh rotation={[Math.PI / 2, 0, zRot]}>
      <torusGeometry args={[0.07, 0.012, 8, 16, Math.PI]} />
      <meshStandardMaterial color={MOUTH_COLOR} roughness={0.5} />
    </mesh>
  );
}
