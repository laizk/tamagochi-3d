'use client';
import { useGame } from '@/src/game/store';
import { AREAS } from '@/src/game/world/areas/registry';

export function AreaName() {
  const id = useGame((s) => s.currentArea);
  const a = AREAS[id];
  return (
    <div className="pointer-events-none absolute inset-x-0 top-20 z-10 flex justify-center">
      <div className="rounded-full bg-white/70 px-4 py-1 text-sm font-medium shadow backdrop-blur">
        <span className="mr-1" aria-hidden>
          {a.emoji}
        </span>
        {a.name}
      </div>
    </div>
  );
}
