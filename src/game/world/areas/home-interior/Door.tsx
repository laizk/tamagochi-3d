'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import { useGame } from '@/src/game/store';

const DOOR_WIDTH = 1.5;
const DOOR_HEIGHT = 2.4;
const DOOR_THICKNESS = 0.08;
const DOOR_COLOR = '#8C5A36';
const KNOB_COLOR = '#E8C766';

const HINGE_X = -DOOR_WIDTH / 2;
const HINGE_Z = 5; // south wall plane
const OPEN_ANGLE = -Math.PI / 2; // swing outward (south, +z)
const CLOSE_SPEED = 4; // higher = snappier lerp

/**
 * Front door of the house. Sits in the south-wall door gap. Swings open when
 * any pet steps into the threshold zone, swings shut otherwise.
 */
export function Door() {
  const group = useRef<Group>(null);

  useFrame((_state, dt) => {
    if (!group.current) return;
    const state = useGame.getState();
    if (state.currentArea !== 'home') return;
    const dino = state.characters.dino.position;
    const birds = state.characters.lovebirds.position;
    const inZone = (p: readonly [number, number, number]) => p[2] > 3.2 && Math.abs(p[0]) < 1.5;
    const wantOpen = inZone(dino) || inZone(birds);
    const target = wantOpen ? OPEN_ANGLE : 0;
    const k = Math.min(1, dt * CLOSE_SPEED);
    group.current.rotation.y += (target - group.current.rotation.y) * k;
  });

  return (
    <group ref={group} position={[HINGE_X, 0, HINGE_Z]}>
      {/* door slab — offset so its left edge lines up with the hinge */}
      <mesh position={[DOOR_WIDTH / 2, DOOR_HEIGHT / 2, 0]} castShadow>
        <boxGeometry args={[DOOR_WIDTH, DOOR_HEIGHT, DOOR_THICKNESS]} />
        <meshStandardMaterial color={DOOR_COLOR} roughness={0.7} />
      </mesh>
      {/* knob */}
      <mesh position={[DOOR_WIDTH - 0.15, DOOR_HEIGHT / 2, DOOR_THICKNESS / 2 + 0.04]} castShadow>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color={KNOB_COLOR} metalness={0.4} roughness={0.4} />
      </mesh>
    </group>
  );
}
