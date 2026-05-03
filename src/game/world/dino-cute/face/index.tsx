'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import type { Expression } from '@/src/game/systems/expression';
import { Brows } from './Brows';
import { Eyes } from './Eyes';
import { Jaw } from './Jaw';
import { Snout } from './Snout';
import { Tongue } from './Tongue';

const Z_COLOR = '#FFFFFF';
const BUBBLE_COLOR = '#A4E0FF';

function ZParticles() {
  const ref = useRef<Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() / 1000;
    ref.current.position.y = 1.5 + Math.sin(t * 1.5) * 0.1;
    ref.current.rotation.z = Math.sin(t) * 0.1;
  });
  return (
    <group ref={ref} position={[0.25, 1.5, 0.3]}>
      <mesh>
        <boxGeometry args={[0.08, 0.012, 0.012]} />
        <meshStandardMaterial color={Z_COLOR} roughness={0.5} />
      </mesh>
      <mesh position={[0.05, 0.05, 0]}>
        <boxGeometry args={[0.06, 0.01, 0.01]} />
        <meshStandardMaterial color={Z_COLOR} roughness={0.5} />
      </mesh>
    </group>
  );
}

function Bubbles() {
  const ref = useRef<Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() / 1000;
    ref.current.position.y = 1.0 + ((t * 0.4) % 0.6);
  });
  return (
    <group ref={ref} position={[0, 1.0, 0.6]}>
      <mesh position={[-0.1, 0, 0]}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshStandardMaterial color={BUBBLE_COLOR} roughness={0.2} transparent opacity={0.7} />
      </mesh>
      <mesh position={[0.05, 0.1, 0]}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshStandardMaterial color={BUBBLE_COLOR} roughness={0.2} transparent opacity={0.7} />
      </mesh>
      <mesh position={[0.1, -0.08, 0]}>
        <sphereGeometry args={[0.025, 12, 12]} />
        <meshStandardMaterial color={BUBBLE_COLOR} roughness={0.2} transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

function Sparkle() {
  return (
    <mesh position={[0.16, 1.22, 0.55]}>
      <sphereGeometry args={[0.025, 8, 8]} />
      <meshStandardMaterial
        color="#FFF7A0"
        roughness={0.2}
        emissive="#FFF7A0"
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}

export function DinoFace({ expression }: { expression: Expression }) {
  return (
    <>
      <Snout />
      <Jaw expression={expression} />
      <Tongue expression={expression} />
      {/* eyes */}
      <group position={[-0.13, 1.18, 0.48]}>
        <Eyes expression={expression} />
      </group>
      <group position={[0.13, 1.18, 0.48]} scale={[-1, 1, 1]}>
        <Eyes expression={expression} />
      </group>
      {/* brows */}
      <group position={[0, 1.13, 0]}>
        <Brows expression={expression} />
      </group>
      {expression === 'sleep' && <ZParticles />}
      {expression === 'bath' && <Bubbles />}
      {expression === 'eat' && <Sparkle />}
    </>
  );
}
