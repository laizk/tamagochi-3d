'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh } from 'three';
import type { Expression } from '@/src/game/systems/expression';

const PUPIL_COLOR = '#1A1A24';
const SPARKLE_COLOR = '#FFFFFF';
const TEAR_COLOR = '#9CD0FF';
const LID_COLOR = '#7FE0B0';

type Variant = 'open' | 'half' | 'closed' | 'squint' | 'wide';

function variantFor(expr: Expression): Variant {
  switch (expr) {
    case 'sad':
      return 'wide';
    case 'sleepy':
      return 'half';
    case 'bouncy':
    case 'eat':
      return 'wide';
    case 'bath':
    case 'sleep':
      return 'closed';
    case 'play':
      return 'squint';
    default:
      return 'open';
  }
}

const BLINK_MS = 150;
const BLINK_MIN = 3000;
const BLINK_MAX = 5000;

export function Eyes({ expression }: { expression: Expression }) {
  const variant = variantFor(expression);
  const lidRef = useRef<Mesh>(null);
  const nextBlinkAtRef = useRef<number>(
    performance.now() + BLINK_MIN + Math.random() * (BLINK_MAX - BLINK_MIN),
  );
  const blinkingUntilRef = useRef(0);

  useFrame(() => {
    if (!lidRef.current) return;
    const now = performance.now();
    const blinkable = variant === 'open' || variant === 'wide';
    let lidY = 0; // 0 = open, 1 = closed (rotation X = lidY * 1.5)
    if (variant === 'half') lidY = 0.5;
    if (variant === 'closed') lidY = 1;
    if (variant === 'squint') lidY = 0.7;
    if (blinkable && now >= nextBlinkAtRef.current && now > blinkingUntilRef.current) {
      blinkingUntilRef.current = now + BLINK_MS;
      nextBlinkAtRef.current = now + BLINK_MIN + Math.random() * (BLINK_MAX - BLINK_MIN);
    }
    if (now < blinkingUntilRef.current) lidY = 1;
    lidRef.current.rotation.x = lidY * 1.5;
    lidRef.current.position.y = 0;
  });

  const scale = variant === 'wide' ? 1.1 : variant === 'squint' ? 0.7 : 1;

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
      {(variant === 'open' || variant === 'wide') && (
        <mesh position={[-0.02, 0.02, 0.05]}>
          <sphereGeometry args={[0.012, 8, 8]} />
          <meshStandardMaterial color={SPARKLE_COLOR} roughness={0.2} />
        </mesh>
      )}
      {/* tear (sad) */}
      {expression === 'sad' && (
        <mesh position={[0.02, -0.07, 0.04]}>
          <sphereGeometry args={[0.02, 12, 12]} />
          <meshStandardMaterial color={TEAR_COLOR} roughness={0.2} />
        </mesh>
      )}
      {/* upper eyelid: half-sphere that rotates down to close */}
      <group position={[0, 0.06, 0]}>
        <mesh ref={lidRef}>
          <sphereGeometry args={[0.062, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={LID_COLOR} roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}
