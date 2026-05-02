'use client';

import type { Expression } from '@/src/game/systems/expression';

const BROW_COLOR = '#1A1A24';

function browAngles(expr: Expression): { left: number; right: number; y: number } {
  switch (expr) {
    case 'sad':
      return { left: -0.4, right: 0.4, y: 0.02 };
    case 'bouncy':
    case 'eat':
    case 'play':
      return { left: 0.3, right: -0.3, y: 0.05 };
    case 'sleepy':
    case 'bath':
    case 'sleep':
      return { left: 0, right: 0, y: 0 };
    default:
      return { left: 0.05, right: -0.05, y: 0.02 };
  }
}

export function Brows({ expression }: { expression: Expression }) {
  const a = browAngles(expression);
  return (
    <group position={[0, a.y, 0]}>
      <mesh position={[-0.13, 0.06, 0.5]} rotation={[0, 0, a.left]}>
        <boxGeometry args={[0.08, 0.015, 0.02]} />
        <meshStandardMaterial color={BROW_COLOR} roughness={0.6} />
      </mesh>
      <mesh position={[0.13, 0.06, 0.5]} rotation={[0, 0, a.right]}>
        <boxGeometry args={[0.08, 0.015, 0.02]} />
        <meshStandardMaterial color={BROW_COLOR} roughness={0.6} />
      </mesh>
    </group>
  );
}
