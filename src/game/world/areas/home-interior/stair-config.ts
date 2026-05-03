/**
 * Stair geometry constants shared between the Stairs mesh and TapControls
 * path planner. Stairs hug the east wall right of the front door, ascending
 * from a low south entry up to a top landing roughly in the center.
 */
export const STAIR_X = 4.5;
export const STAIR_WIDTH = 1.0;
export const STEP_RISE = 0.5;
export const STEP_DEPTH = 0.6;
export const STEP_COUNT = 5;
/** South end of the staircase (lowest step center) — placed near the door. */
export const STAIR_BASE_Z = 4.0;
export const FLOOR_2_Y = 2.5;

/** World-space waypoint just south of the bottom step, on floor 1. */
export const STAIR_BASE_WAYPOINT: [number, number, number] = [STAIR_X, 0, STAIR_BASE_Z + 0.3];
/** World-space waypoint just north of the top step, on floor 2. */
export const STAIR_TOP_WAYPOINT: [number, number, number] = [
  STAIR_X,
  FLOOR_2_Y,
  STAIR_BASE_Z - STEP_DEPTH * STEP_COUNT - 0.3,
];

/** Floor threshold: anything above this y counts as floor 2. */
export const FLOOR_2_THRESHOLD = FLOOR_2_Y / 2;
