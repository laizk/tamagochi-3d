/**
 * Per-frame world positions for moving entities, kept outside Zustand to avoid
 * triggering subscriber re-renders every frame. Movement code writes here;
 * collision/avoidance code reads.
 */

type Vec3 = [number, number, number];

const positions: Record<string, Vec3> = {
  dino: [0, 0, 0],
  lovebirds: [0, 0, 0],
};

export function writeRuntimePos(id: string, x: number, y: number, z: number): void {
  const v = positions[id];
  if (v) {
    v[0] = x;
    v[1] = y;
    v[2] = z;
  } else {
    positions[id] = [x, y, z];
  }
}

export function readRuntimePos(id: string): Vec3 {
  return positions[id] ?? [0, 0, 0];
}
