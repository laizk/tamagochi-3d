'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';

const BOUND = 4;

export function Bunny() {
  const ref = useRef<Group>(null);
  const targetRef = useRef<[number, number] | null>(null);
  const lastJumpAt = useRef(0);
  const lastTargetAt = useRef(0);

  useFrame((_state, dt) => {
    if (!ref.current) return;
    const now = performance.now();
    if (!targetRef.current || now - lastTargetAt.current > 4000) {
      targetRef.current = [(Math.random() * 2 - 1) * BOUND, (Math.random() * 2 - 1) * BOUND];
      lastTargetAt.current = now;
    }
    const [tx, tz] = targetRef.current;
    const cur = ref.current.position;
    const dx = tx - cur.x;
    const dz = tz - cur.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 0.05) {
      const step = Math.min(dist, dt * 1.3);
      cur.x += (dx / dist) * step;
      cur.z += (dz / dist) * step;
      ref.current.rotation.y = Math.atan2(dx, dz);
    }
    // hop every 2 s
    const phase = (now - lastJumpAt.current) / 1000;
    if (phase > 2) lastJumpAt.current += 2000;
    const hopPhase = ((now - lastJumpAt.current) / 1000) % 2;
    cur.y = hopPhase < 0.4 ? Math.sin((hopPhase * Math.PI) / 0.4) * 0.3 : 0;
  });

  return (
    <group ref={ref} position={[2, 0, -2]}>
      <mesh position={[0, 0.18, 0]} castShadow>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[0, 0.36, 0.1]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[-0.05, 0.5, 0.08]} rotation={[0.2, 0, 0]}>
        <coneGeometry args={[0.025, 0.13, 8]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[0.05, 0.5, 0.08]} rotation={[0.2, 0, 0]}>
        <coneGeometry args={[0.025, 0.13, 8]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[0, 0.18, -0.18]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
    </group>
  );
}
