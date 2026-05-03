/**
 * Lerp between two angles (radians), taking the shortest path across +/-pi.
 * t in [0, 1]. Returns `a` when t=0, `b` when t=1.
 */
export function lerpAngle(a: number, b: number, t: number): number {
  let diff = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

/**
 * Clamp `target.x` and `target.z` into [-extent, extent]. Mutates in place.
 * `target.y` is untouched. Used to bound camera-pan target to area extents.
 */
export function clampPan(target: { x: number; z: number }, extent: number): void {
  if (target.x > extent) target.x = extent;
  else if (target.x < -extent) target.x = -extent;
  if (target.z > extent) target.z = extent;
  else if (target.z < -extent) target.z = -extent;
}
