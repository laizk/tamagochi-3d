import type { ActionKind } from '@/src/game/store';
import type { Mood } from '@/src/game/systems/mood';

export type Expression = Mood | ActionKind;

export function chooseExpression(mood: Mood, actionKind: ActionKind | null): Expression {
  return actionKind ?? mood;
}
