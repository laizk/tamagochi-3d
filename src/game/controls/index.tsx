'use client';
import { useGame } from '@/src/game/store';
import { AutoRoam } from './AutoRoam';
import { TapControls } from './TapControls';

export function ActiveSceneControls() {
  const mode = useGame((s) => s.controlMode);
  if (mode === 'tap') return <TapControls />;
  if (mode === 'auto') return <AutoRoam />;
  return null; // joystick lives in HUD layer, not the canvas
}
