'use client';

import { useEffect, useRef, useState } from 'react';
import { useGame } from '@/src/game/store';

const RADIUS = 60;
const MOVE_SPEED = 2.2;

export function Joystick() {
  const baseRef = useRef<HTMLDivElement>(null);
  const [vec, setVec] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!vec) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const active = useGame.getState().active;
      const pos = useGame.getState().characters[active].position;
      const nx = pos[0] + vec.x * MOVE_SPEED * dt;
      const nz = pos[2] + vec.y * MOVE_SPEED * dt;
      useGame.getState().setPosition(active, [nx, pos[1], nz]);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [vec]);

  const onDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    update(e);
  };
  const onMove = (e: React.PointerEvent) => {
    if (e.buttons === 0) return;
    update(e);
  };
  const onUp = () => {
    setVec(null);
  };
  function update(e: React.PointerEvent) {
    const rect = baseRef.current!.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const len = Math.hypot(dx, dy) || 1;
    const clamped = Math.min(len, RADIUS);
    const ux = (dx / len) * (clamped / RADIUS);
    const uy = (dy / len) * (clamped / RADIUS);
    setVec({ x: ux, y: uy }); // y here = world Z (forward/back)
  }

  return (
    <div className="pointer-events-auto absolute bottom-6 left-6 z-10 select-none touch-none">
      <div
        ref={baseRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className="relative grid h-32 w-32 place-items-center rounded-full bg-white/40 backdrop-blur"
      >
        <div
          className="h-12 w-12 rounded-full bg-white shadow-md transition-transform"
          style={{
            transform: vec
              ? `translate(${vec.x * RADIUS}px, ${vec.y * RADIUS}px)`
              : 'translate(0,0)',
          }}
        />
      </div>
    </div>
  );
}
