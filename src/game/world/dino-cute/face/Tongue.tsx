'use client';

import type { Expression } from '@/src/game/systems/expression';

const TONGUE_COLOR = '#FF7AB6';

export function Tongue({ expression }: { expression: Expression }) {
  if (expression !== 'eat' && expression !== 'play') return null;
  const z = expression === 'play' ? 0.66 : 0.6;
  const rotX = expression === 'play' ? Math.PI / 2.2 : Math.PI / 2;
  return (
    <mesh position={[0, 0.92, z]} rotation={[rotX, 0, 0]}>
      <torusGeometry args={[0.04, 0.018, 8, 16, Math.PI]} />
      <meshStandardMaterial color={TONGUE_COLOR} roughness={0.4} />
    </mesh>
  );
}
