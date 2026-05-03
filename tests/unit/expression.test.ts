import { describe, expect, it } from 'vitest';
import { chooseExpression } from '@/src/game/systems/expression';

describe('chooseExpression', () => {
  it('returns mood when actionKind is null', () => {
    expect(chooseExpression('happy', null)).toBe('happy');
    expect(chooseExpression('sad', null)).toBe('sad');
    expect(chooseExpression('sleepy', null)).toBe('sleepy');
    expect(chooseExpression('bouncy', null)).toBe('bouncy');
  });

  it('action overrides mood', () => {
    expect(chooseExpression('sad', 'eat')).toBe('eat');
    expect(chooseExpression('happy', 'bath')).toBe('bath');
    expect(chooseExpression('bouncy', 'sleep')).toBe('sleep');
    expect(chooseExpression('sleepy', 'play')).toBe('play');
  });
});
