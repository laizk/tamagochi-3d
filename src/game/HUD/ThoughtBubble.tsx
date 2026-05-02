'use client';

import { useGame } from '@/src/game/store';

export function ThoughtBubble() {
  const stats = useGame((s) => s.characters[s.active].stats);
  let msg: string | null = null;
  if (stats.hunger < 25) msg = '🍔';
  else if (stats.energy < 25) msg = '💤';
  else if (stats.clean < 25) msg = '🛁';
  else if (stats.happy < 25) msg = '😢';
  if (!msg) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-1/3 z-10 flex justify-center">
      <div className="animate-bounce rounded-full bg-white/90 px-3 py-1 text-2xl shadow-lg">
        {msg}
      </div>
    </div>
  );
}
