'use client';

import { useState } from 'react';
import { Joystick } from '@/src/game/controls/Joystick';
import { type ControlMode, useGame } from '@/src/game/store';

const MODES: Array<{ id: ControlMode; label: string; emoji: string }> = [
  { id: 'tap', label: 'Tap to walk', emoji: '👆' },
  { id: 'joystick', label: 'Joystick', emoji: '🕹️' },
  { id: 'auto', label: 'Auto roam', emoji: '🤖' },
];

export function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const mode = useGame((s) => s.controlMode);
  const setMode = useGame((s) => s.setControlMode);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto absolute right-3 top-3 z-20 grid h-10 w-10 place-items-center rounded-full bg-white/80 text-xl shadow-md backdrop-blur"
        aria-label="Settings"
      >
        ⚙️
      </button>
      {open && (
        <div className="pointer-events-auto absolute right-3 top-16 z-20 rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur">
          <p className="mb-2 font-medium">Controls</p>
          <div className="flex flex-col gap-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left ${
                  mode === m.id ? 'bg-emerald-200' : 'bg-slate-100'
                }`}
              >
                <span aria-hidden>{m.emoji}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {mode === 'joystick' && <Joystick />}
    </>
  );
}
