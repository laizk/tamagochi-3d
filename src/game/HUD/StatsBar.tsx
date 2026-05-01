'use client';

import { type StatKey, useGame } from '@/src/game/store';

const STATS: Array<{ key: StatKey; emoji: string; color: string }> = [
  { key: 'hunger', emoji: '🍔', color: 'bg-orange-400' },
  { key: 'happy', emoji: '😊', color: 'bg-yellow-400' },
  { key: 'energy', emoji: '⚡', color: 'bg-blue-400' },
  { key: 'clean', emoji: '🛁', color: 'bg-cyan-400' },
  { key: 'health', emoji: '❤️', color: 'bg-rose-400' },
];

export function StatsBar() {
  const stats = useGame((s) => s.dino.stats);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center p-3 pt-[env(safe-area-inset-top)]">
      <div className="pointer-events-auto flex gap-2 rounded-2xl bg-white/80 px-3 py-2 shadow-lg backdrop-blur">
        {STATS.map(({ key, emoji, color }) => (
          <div key={key} className="flex flex-col items-center gap-1">
            <span aria-hidden className="text-xl">
              {emoji}
            </span>
            <div className="h-2 w-12 overflow-hidden rounded-full bg-slate-200">
              <div
                role="progressbar"
                aria-label={`${key} ${Math.round(stats[key])} percent`}
                aria-valuenow={Math.round(stats[key])}
                aria-valuemin={0}
                aria-valuemax={100}
                className={`h-full ${color} transition-[width] duration-500`}
                style={{ width: `${stats[key]}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
