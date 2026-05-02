export type Mood = 'happy' | 'sleepy' | 'sad' | 'bouncy';

export interface MoodInputs {
  stats: {
    hunger: number;
    happy: number;
    energy: number;
    clean: number;
    health: number;
  };
  /** Seconds since the most recent pet event. Pass `Infinity` if the dino has never been petted this session. */
  secondsSincePet: number;
}

const SAD_THRESHOLD = 25;
const SLEEPY_THRESHOLD = 40;
const BOUNCY_WINDOW_S = 1.0;

export function getMood({ stats, secondsSincePet }: MoodInputs): Mood {
  if (secondsSincePet <= BOUNCY_WINDOW_S) return 'bouncy';
  const minStat = Math.min(stats.hunger, stats.happy, stats.energy, stats.clean, stats.health);
  if (minStat < SAD_THRESHOLD) return 'sad';
  if (stats.energy < SLEEPY_THRESHOLD) return 'sleepy';
  return 'happy';
}
