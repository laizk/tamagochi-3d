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
  },
  town: {
    id: 'town',
    name: 'Town Square',
    emoji: '🏘️',
    Component: Town,
    spawn: [0, 0, 0],
    exits: ['home', 'park', 'beach', 'forest'],
  },
  park: {
    id: 'park',
    name: 'Park',
    emoji: '🌳',
    Component: Park,
    spawn: [0, 0, 0],
    exits: ['town'],
  },
  beach: {
    id: 'beach',
    name: 'Beach',
    emoji: '🏖️',
    Component: Beach,
    spawn: [0, 0, 0],
    exits: ['town', 'cave'],
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    emoji: '🌲',
    Component: Forest,
    spawn: [0, 0, 0],
    exits: ['town', 'cave'],
  },
  cave: {
    id: 'cave',
    name: 'Cave',
    emoji: '⛰️',
    Component: Cave,
    spawn: [0, 0, 0],
    exits: ['beach', 'forest'],
  },
  sky: {
    id: 'sky',
    name: 'Sky Island',
    emoji: '☁️',
    Component: SkyIsland,
    spawn: [0, 0, 0],
    exits: ['town'],
    locked: true,
  },
};
