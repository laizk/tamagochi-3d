'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';

const BALLOONS: Array<{
  start: [number, number, number];
  color: string;
  speed: number;
  offset: number;
}> = [
  { start: [3.5, 0.5, 5], color: '#FF7AB6', speed: 0.3, offset: 0 },
  { start: [-4.5, 0.5, 4.5], color: '#FFD86B', speed: 0.4, offset: 2 },
  { start: [1.5, 0.5, -4.5], color: '#A4E0FF', speed: 0.35, offset: 5 },
];

const RESET_AT_Y = 8;
const RANGE = RESET_AT_Y - 0.5;
const X_SPREAD = 7;
const Z_SPREAD = 7;

export function Balloons() {
  const refs = useRef<Array<Group | null>>([]);
  const lastPhase = useRef<number[]>(BALLOONS.map(() => 0));
  const anchors = useRef<Array<[number, number]>>(BALLOONS.map((b) => [b.start[0], b.start[2]]));

  useFrame(() => {
    const t = performance.now() / 1000;
    refs.current.forEach((g, i) => {
      if (!g) return;
      const b = BALLOONS[i];
      const phase = (t * b.speed + b.offset) % 1;
      // wrap detection: phase decreased from previous frame → randomize anchor
      if (phase < lastPhase.current[i]) {
        anchors.current[i] = [
          (Math.random() * 2 - 1) * X_SPREAD,
          (Math.random() * 2 - 1) * Z_SPREAD,
        ];
      }
      lastPhase.current[i] = phase;
      const [ax, az] = anchors.current[i];
      g.position.x = ax + Math.sin(t + b.offset) * 0.2;
      g.position.y = b.start[1] + phase * RANGE;
      g.position.z = az;
    });
  });

  return (
    <>
      {BALLOONS.map((b, i) => (
        <group
          key={b.color}
          position={b.start}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <mesh castShadow>
            <sphereGeometry args={[0.18, 16, 16]} />
            <meshStandardMaterial color={b.color} roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.45, 0]}>
            <cylinderGeometry args={[0.005, 0.005, 0.7, 4]} />
            <meshStandardMaterial color="#444" />
          </mesh>
        </group>
      ))}
    </>
  );
}
