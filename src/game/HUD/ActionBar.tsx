'use client';

import { useGame } from '@/src/game/store';
import { FOODS, type FoodId, bath, feed, pet, sleep } from '@/src/game/systems/interactions';

export function ActionBar() {
  const area = useGame((s) => s.currentArea);
  const active = useGame((s) => s.active);
  const homeOnly = area === 'home';
  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-10 flex justify-center p-3 pb-[env(safe-area-inset-bottom)]">
      <div className="flex gap-2 rounded-2xl bg-white/85 px-3 py-2 shadow-lg backdrop-blur">
        <button
          type="button"
          onClick={() => pet(active)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-200 text-2xl"
          aria-label="Pet"
        >
          🤗
        </button>
        {homeOnly && (
          <>
            {(Object.keys(FOODS) as FoodId[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => feed(id, active)}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-200 text-2xl"
                aria-label={`Feed ${FOODS[id].name}`}
              >
                {FOODS[id].emoji}
              </button>
            ))}
            <button
              type="button"
              onClick={() => bath(active)}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-200 text-2xl"
              aria-label="Bath"
            >
              🛁
            </button>
            <button
              type="button"
              onClick={() => sleep(active)}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-200 text-2xl"
              aria-label="Sleep"
            >
              💤
            </button>
          </>
        )}
      </div>
    </div>
  );
}
