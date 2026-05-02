import { useGame } from '@/src/game/store';

export type SoundId = 'chirp';

const cache = new Map<SoundId, HTMLAudioElement>();

export function play(name: SoundId): void {
  if (typeof window === 'undefined') return;
  if (!useGame.getState().settings.soundOn) return;
  let a = cache.get(name);
  if (!a) {
    a = new Audio(`/sounds/${name}.mp3`);
    cache.set(name, a);
  }
  a.currentTime = 0;
  const promise = a.play();
  if (promise !== undefined) {
    promise.catch(() => {
      // iOS Safari blocks autoplay before first user gesture; subsequent taps work.
    });
  }
}

export function _resetAudioCache(): void {
  cache.clear();
}
