'use client';

import { useGame } from '@/src/game/store';

export function CharacterToggle() {
  const active = useGame((s) => s.active);
  const setActive = useGame((s) => s.setActive);
  const cls = (on: boolean) =>
    `flex h-10 w-10 items-center justify-center rounded-full text-xl transition-all ${
      on ? 'bg-white shadow-md scale-110' : 'bg-white/40 backdrop-blur'
    }`;
  return (
    <div className="pointer-events-auto fixed top-3 right-3 z-20 flex gap-2 select-none">
      <button
        type="button"
        aria-label="Switch to dino"
        aria-pressed={active === 'dino'}
        className={cls(active === 'dino')}
        onClick={() => setActive('dino')}
      >
        🦖
      </button>
      <button
        type="button"
        aria-label="Switch to lovebirds"
        aria-pressed={active === 'lovebirds'}
        className={cls(active === 'lovebirds')}
        onClick={() => setActive('lovebirds')}
      >
        🐦
      </button>
    </div>
  );
}
