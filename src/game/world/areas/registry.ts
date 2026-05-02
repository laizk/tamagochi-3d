import type { ComponentType } from 'react';
import type { AreaId } from '@/src/game/store';
import { Beach } from './Beach';
import { Cave } from './Cave';
import { Forest } from './Forest';
import { Home } from './Home';
import { Park } from './Park';
import { SkyIsland } from './SkyIsland';
import { Town } from './Town';

export type AreaConfig = {
  id: AreaId;
  name: string;
  emoji: string;
  Component: ComponentType;
  spawn: [number, number, number];
  exits: AreaId[];
  /** Half-width of the square region (world units) the camera target may roam. */
  extent: number;
  locked?: boolean;
};

export const AREAS: Record<AreaId, AreaConfig> = {
  home: {
    id: 'home',
    name: 'Home',
    emoji: '🏠',
    Component: Home,
    spawn: [0, 0, 0],
    exits: ['town'],
    extent: 8,
  },
  town: {
    id: 'town',
    name: 'Town Square',
    emoji: '🏘️',
    Component: Town,
    spawn: [0, 0, 0],
    exits: ['home', 'park', 'beach', 'forest'],
    extent: 18,
  },
  park: {
    id: 'park',
    name: 'Park',
    emoji: '🌳',
    Component: Park,
    spawn: [0, 0, 0],
    exits: ['town'],
    extent: 16,
  },
  beach: {
    id: 'beach',
    name: 'Beach',
    emoji: '🏖️',
    Component: Beach,
    spawn: [0, 0, 0],
    exits: ['town', 'cave'],
    extent: 18,
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    emoji: '🌲',
    Component: Forest,
    spawn: [0, 0, 0],
    exits: ['town', 'cave'],
    extent: 16,
  },
  cave: {
    id: 'cave',
    name: 'Cave',
    emoji: '⛰️',
    Component: Cave,
    spawn: [0, 0, 0],
    exits: ['beach', 'forest'],
    extent: 12,
  },
  sky: {
    id: 'sky',
    name: 'Sky Island',
    emoji: '☁️',
    Component: SkyIsland,
    spawn: [0, 0, 0],
    exits: ['town'],
    locked: true,
    extent: 14,
  },
};
