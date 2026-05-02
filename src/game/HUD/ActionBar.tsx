'use client';

import { useGame } from '@/src/game/store';
import {
  BIRD_FOODS,
  type BirdFoodId,
  bath,
  type DinoFoodId,
  FOODS,
  feed,
  pet,
  play,
  sleep,
} from '@/src/game/systems/interactions';

export function ActionBar() {
  const area = useGame((s) => s.currentArea);
  const active = useGame((s) => s.active);
  const action = useGame((s) => s.characters[active].action);
  const homeOnly = area === 'home';
  const menu = active === 'dino' ? FOODS : BIRD_FOODS;
  const locked = action !== null;
  const dim = locked ? 'opacity-40' : '';

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-10 flex justify-center p-3 pb-[env(safe-area-inset-bottom)]">
      <div className="flex gap-2 rounded-2xl bg-white/85 px-3 py-2 shadow-lg backdrop-blur">
        <button
          type="button"
          onClick={() => pet(active)}
          disabled={locked}
          className={`flex h-12 w-12 items-center justify-center rounded-full bg-pink-200 text-2xl ${dim}`}
          aria-label="Pet"
        >
          🤗
        </button>
        <button
          type="button"
          onClick={() => play(active)}
          disabled={locked}
          className={`flex h-12 w-12 items-center justify-center rounded-full bg-yellow-200 text-2xl ${dim}`}
          aria-label="Play"
        >
          🎾
        </button>
        {homeOnly && (
          <>
            {Object.entries(menu).map(([id, def]) => (
              <button
                key={id}
                type="button"
                onClick={() => feed(id as DinoFoodId | BirdFoodId, active)}
                disabled={locked}
                className={`flex h-12 w-12 items-center justify-center rounded-full bg-orange-200 text-2xl ${dim}`}
                aria-label={`Feed ${def.name}`}
              >
                {def.emoji}
              </button>
            ))}
            <button
              type="button"
              onClick={() => bath(active)}
              disabled={locked}
              className={`flex h-12 w-12 items-center justify-center rounded-full bg-cyan-200 text-2xl ${dim}`}
              aria-label="Bath"
            >
              🛁
            </button>
            <button
              type="button"
              onClick={() => sleep(active)}
              disabled={locked}
              className={`flex h-12 w-12 items-center justify-center rounded-full bg-indigo-200 text-2xl ${dim}`}
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
