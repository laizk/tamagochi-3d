'use client';

import { useFrame } from '@react-three/fiber';
import { type RefObject, useEffect, useRef, useState } from 'react';
import type { Object3D } from 'three';
import { useGame } from '@/src/game/store';
import { onPet } from '@/src/game/systems/interactions';

/**
 * Drives idle bob, pet-bounce y-offset, and sad-lean tilt for a dino mesh/group.
 *
 * @param ref   - ref to the Object3D to animate.
 * @param baseY - vertical offset added to `dino.position[1]` (the world baseline).
 *                Use 0.5 for the pre-hatch egg sphere (center-origin).
 *                Use 0 for the post-hatch DinoCute (feet-origin group).
 *
 * Reads the dino position and stats imperatively from the store on each frame
 * so the hook does not re-register on every state change.
 */
export function useDinoMotion(ref: RefObject<Object3D | null>, baseY: number) {
  const [bounce, setBounce] = useState(0);
  const bounceRef = useRef(bounce);

  useEffect(() => {
    const unsub = onPet((charId) => {
      if (charId === 'dino') setBounce(performance.now());
    });
    return () => {
      unsub();
    };
  }, []);

  useEffect(() => {
    bounceRef.current = bounce;
  }, [bounce]);

  useFrame(() => {
    if (!ref.current) return;
    const now = performance.now();
    const bob = Math.sin(now / 400) * 0.05;
    const bouncePhase = (now - bounceRef.current) / 1000;
    const bounceY = bouncePhase < 0.6 ? Math.sin((bouncePhase * Math.PI) / 0.6) * 0.4 : 0;

    const { position, stats } = useGame.getState().characters.dino;

    // xz freeze comes from TapControls clearing the move target; this hook just renders the store position. Body bob/bounce always apply.
    ref.current.position.set(position[0], position[1] + baseY + bob + bounceY, position[2]);

    const sad = Math.min(stats.hunger, stats.happy, stats.energy, stats.clean, stats.health) < 25;
    ref.current.rotation.x = sad ? 0.2 : 0;
  });
}
