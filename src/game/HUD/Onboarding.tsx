'use client';

import { useEffect, useRef, useState } from 'react';
import { useGame } from '@/src/game/store';

type Props = { onDone: () => void };

export function Onboarding({ onDone }: Props) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="absolute inset-0 z-30 grid place-items-center bg-sky-300/80 backdrop-blur">
      <div className="flex w-72 flex-col gap-3 rounded-2xl bg-white p-5 shadow-2xl">
        <p className="text-center text-4xl">🥚</p>
        <p className="text-center text-lg font-bold">It's an egg!</p>
        <p className="text-center text-sm text-slate-600">What's your dino's name?</p>
        <p className="text-center text-xs text-slate-400">Tap 🐦 in the top-right to switch to your lovebirds!</p>
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={16}
          placeholder="Rex"
          className="select-text touch-auto rounded-lg border border-slate-300 px-3 py-2 text-center text-lg"
        />
        <button
          type="button"
          disabled={!name.trim()}
          onClick={() => {
            const trimmed = name.trim() || 'Dino';
            useGame.setState((s) => ({
              characters: {
                ...s.characters,
                dino: { ...s.characters.dino, name: trimmed, stage: 'baby' },
              },
            }));
            onDone();
          }}
          className="rounded-lg bg-emerald-500 py-2 text-lg font-bold text-white shadow disabled:bg-slate-300"
        >
          Hatch! 🦕
        </button>
      </div>
    </div>
  );
}
