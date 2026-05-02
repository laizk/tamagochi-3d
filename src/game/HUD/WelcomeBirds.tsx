'use client';

import { useGame } from '@/src/game/store';

export function WelcomeBirds() {
  const seen = useGame((s) => s.intro.lovebirdsSeen);
  const setSeen = useGame((s) => s.setLovebirdsSeen);
  if (seen) return null;
  return (
    <div className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-black/40">
      <div className="max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
        <div className="mb-2 text-3xl">🐦🐦</div>
        <h2 className="mb-2 text-lg font-bold">Meet your lovebirds!</h2>
        <p className="mb-4 text-sm text-gray-700">
          These two are best friends. Tap the 🐦 button in the top-right to play as them. They love
          seeds, berries, and mango! Both pets need love — switch back sometimes.
        </p>
        <button
          type="button"
          onClick={() => setSeen()}
          className="rounded-full bg-emerald-500 px-5 py-2 font-bold text-white shadow"
        >
          OK!
        </button>
      </div>
    </div>
  );
}
