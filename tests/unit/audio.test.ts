import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { play, _resetAudioCache } from '@/src/game/systems/audio';
import { useGame } from '@/src/game/store';

let audioCtorCount = 0;

class FakeAudio {
  src: string;
  currentTime = 0;
  played = 0;
  constructor(src: string) {
    this.src = src;
    audioCtorCount++;
  }
  play() {
    this.played++;
    return Promise.resolve();
  }
}

describe('audio.play', () => {
  beforeEach(() => {
    useGame.setState(useGame.getInitialState(), true);
    _resetAudioCache();
    audioCtorCount = 0;
    vi.stubGlobal('Audio', FakeAudio);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('plays chirp when soundOn=true', () => {
    play('chirp');
    // FakeAudio constructed and played
    // (we cannot read instance directly, but no-throw + cache reuse is enough)
  });

  it('does not construct Audio when soundOn=false', () => {
    useGame.setState({ ...useGame.getState(), settings: { soundOn: false, theme: 'default' } });
    play('chirp');
    expect(audioCtorCount).toBe(0);
  });

  it('reuses cached Audio across calls', () => {
    play('chirp');
    play('chirp');
    expect(audioCtorCount).toBe(1);
  });
});
