'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { useGame } from '@/src/game/store';

const MOVE_SPEED = 1.4;
const WANDER_RADIUS = 6;
const PAUSE_MIN = 1.5;
const PAUSE_MAX = 3.5;

export function AutoRoam() {
  const target = useRef<[number, number] | null>(null);
  const cooldown = useRef(0);

  useEffect(() => {
    target.current = pickTarget();
  }, []);

  useFrame((_, dt) => {
    const active = useGame.getState().active;
    const pos = useGame.getState().characters[active].position;
    if (cooldown.current > 0) {
      cooldown.current -= dt;
      return;
    }
    if (!target.current) {
      target.current = pickTarget();
      return;
    }
    const [tx, tz] = target.current;
    const dx = tx - pos[0];
    const dz = tz - pos[2];
    const dist = Math.hypot(dx, dz);
    if (dist < 0.1) {
      target.current = null;
      cooldown.current = PAUSE_MIN + Math.random() * (PAUSE_MAX - PAUSE_MIN);
      return;
    }
    const step = Math.min(dist, MOVE_SPEED * dt);
    useGame
      .getState()
      .setPosition(active, [pos[0] + (dx / dist) * step, pos[1], pos[2] + (dz / dist) * step]);
  });

  return null;
}

function pickTarget(): [number, number] {
  const angle = Math.random() * Math.PI * 2;
  const r = Math.random() * WANDER_RADIUS;
  return [Math.cos(angle) * r, Math.sin(angle) * r];
}
