'use client';

import { useState } from 'react';
import { useGame } from '@/src/game/store';
import { AREAS } from '@/src/game/world/areas/registry';

const WORLD_SIZE = 14; // approximate world radius for normalizing position
const MAP_SIZE = 96; // px

function worldToMap(pos: [number, number, number]): { x: number; y: number } {
  // x world → left%, z world → top%
  const x = Math.min(100, Math.max(0, ((pos[0] / WORLD_SIZE) * 0.5 + 0.5) * 100));
  const y = Math.min(100, Math.max(0, ((pos[2] / WORLD_SIZE) * 0.5 + 0.5) * 100));
  return { x, y };
}

export function MiniMap() {
  const [open, setOpen] = useState(false);
  const current = useGame((s) => s.currentArea);
  const active = useGame((s) => s.active);
  const setArea = useGame((s) => s.setArea);
  const setPosition = useGame((s) => s.setPosition);
  const dinoPos = useGame((s) => s.characters.dino.position);
  const birdPos = useGame((s) => s.characters.lovebirds.position);

  const dinoDot = worldToMap(dinoPos);
  const birdDot = worldToMap(birdPos);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto absolute right-16 top-3 z-20 grid h-10 w-10 place-items-center rounded-full bg-white/80 text-xl shadow-md backdrop-blur"
        aria-label="Map"
      >
        🗺️
      </button>
      {open && (
        <div className="pointer-events-auto absolute right-3 top-16 z-20 rounded-2xl bg-white/95 p-3 shadow-xl backdrop-blur">
          {/* Character dots on map */}
          <div
            className="relative mb-2 rounded-lg bg-emerald-100 overflow-hidden"
            style={{ width: MAP_SIZE, height: MAP_SIZE }}
          >
            {/* Dino dot */}
            <div
              className={`absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-emerald-600 transition-all ${active === 'dino' ? 'bg-emerald-500' : 'bg-transparent'}`}
              style={{ left: `${dinoDot.x}%`, top: `${dinoDot.y}%` }}
              title="Dino"
            />
            {/* Lovebirds dot */}
            <div
              className={`absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-pink-500 transition-all ${active === 'lovebirds' ? 'bg-pink-400' : 'bg-transparent'}`}
              style={{ left: `${birdDot.x}%`, top: `${birdDot.y}%` }}
              title="Lovebirds"
            />
          </div>
          {/* Area grid */}
          <div className="grid grid-cols-2 gap-2">
            {Object.values(AREAS).map((a) => (
              <button
                key={a.id}
                type="button"
                disabled={a.locked}
                onClick={() => {
                  setArea(a.id);
                  setPosition(active, a.spawn);
                  setOpen(false);
                }}
                className={`flex flex-col items-center rounded-lg px-3 py-2 ${
                  a.id === current
                    ? 'bg-emerald-200'
                    : a.locked
                      ? 'bg-slate-200 text-slate-400'
                      : 'bg-slate-100'
                }`}
              >
                <span className="text-2xl" aria-hidden>
                  {a.emoji}
                </span>
                <span className="text-xs">{a.locked ? '🔒' : a.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
