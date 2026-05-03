import type { Obstacle } from '@/src/game/systems/collision';

const DOOR_HALF = 0.75; // half the door gap (1.5u total)

export const HOME_OBSTACLES: Obstacle[] = [
  // North outer wall (full height)
  { minX: -5.05, maxX: 5.05, minZ: -5.05, maxZ: -4.95 },
  // West outer wall
  { minX: -5.05, maxX: -4.95, minZ: -5.05, maxZ: 5.05 },
  // East outer wall
  { minX: 4.95, maxX: 5.05, minZ: -5.05, maxZ: 5.05 },
  // South outer wall — split with a door gap centered on x=0
  { minX: -5.05, maxX: -DOOR_HALF, minZ: 4.95, maxZ: 5.05 },
  { minX: DOOR_HALF, maxX: 5.05, minZ: 4.95, maxZ: 5.05 },
  // Dining table (floor 1 only — pets on floor 2 walk above it)
  { minX: -2.55, maxX: -0.45, minZ: -0.55, maxZ: 0.55, minY: 0, maxY: 1.0 },
  // Bed left (floor 2)
  { minX: -1.9, maxX: -1.1, minZ: -1.8, maxZ: -0.2, minY: 2.4, maxY: 3.5 },
  // Bed right (floor 2)
  { minX: 1.1, maxX: 1.9, minZ: -1.8, maxZ: -0.2, minY: 2.4, maxY: 3.5 },
  // Stair hole on floor 2 — only blocks pets standing at floor 2 height
  // (feet >= 2.45). Once the pet starts descending and its y drops below
  // the floor plane, it can pass through onto the stair surface.
  { minX: 4, maxX: 5.05, minZ: 1, maxZ: 5.05, minY: 2.45 },
];
