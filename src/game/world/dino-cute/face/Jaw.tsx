'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import type { Expression } from '@/src/game/systems/expression';

const BODY_COLOR = '#7FE0B0';
const TEETH_COLOR = '#FFFFFF';

function targetOpen(expr: Expression): number {
  switch (expr) {
    case 'bouncy':
      return 0.2;
    case 'eat':
      return 0.4; // baseline; chew adds modulation
    case 'bath':
      return 0.15;
    case 'sleep':
      return 0.1;
    case 'play':
      return 0.55;
    case 'sad':
      return 0.05;
    case 'sleepy':
      return 0;
    default:
      return 0;
  }
}

export function Jaw({ expression }: { expression: Expression }) {
  const ref = useRef<Group>(null);

  useFrame(() => {
    if (!ref.current) return;
    const base = targetOpen(expression);
    let open = base;
    if (expression === 'eat') {
      // 4 Hz chew oscillation around 0.3 baseline
      open = 0.3 + Math.abs(Math.sin((performance.now() / 1000) * Math.PI * 2 * 4)) * 0.25;
    }
    ref.current.rotation.x = open;
  });

  return (
    <group ref={ref} position={[0, 0.92, 0.55]}>
      <mesh castShadow rotation={[Math.PI, 0, 0]}>
        <sphereGeometry args={[0.1, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
      </mesh>
      {/* teeth — 4 small cones along the front edge */}
      {[-0.05, -0.017, 0.017, 0.05].map((x) => (
        <mesh key={x} position={[x, -0.01, 0.085]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.012, 0.04, 8]} />
          <meshStandardMaterial color={TEETH_COLOR} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}
