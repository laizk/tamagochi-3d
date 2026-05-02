'use client';

import { useState } from 'react';
import { useGame } from '@/src/game/store';
import { AREAS } from '@/src/game/world/areas/registry';

export function MiniMap() {
  const [open, setOpen] = useState(false);
  const current = useGame((s) => s.currentArea);
  const setArea = useGame((s) => s.setArea);
  const active = useGame((s) => s.active);
  const setPosition = useGame((s) => s.setPosition);
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
        <div className="pointer-events-auto absolute right-3 top-16 z-20 grid grid-cols-2 gap-2 rounded-2xl bg-white/95 p-3 shadow-xl backdrop-blur">
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
      )}
    </>
  );
}
