/**
 * Axis-aligned obstacle box. The pet is a circle of radius PET_R.
 * y bounds are optional: omit to block the pet at every height.
 */
export type Obstacle = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY?: number;
  maxY?: number;
};

export const PET_R = 0.3;

function blocks(o: Obstacle, x: number, z: number, y: number, r: number): boolean {
  if (o.minY !== undefined && y + 0.5 < o.minY) return false;
  if (o.maxY !== undefined && y > o.maxY) return false;
  const cx = Math.max(o.minX, Math.min(x, o.maxX));
  const cz = Math.max(o.minZ, Math.min(z, o.maxZ));
  return Math.hypot(x - cx, z - cz) < r;
}

export function collidesAt(
  x: number,
  z: number,
  y: number,
  r: number,
  obstacles: Obstacle[],
): boolean {
  for (const o of obstacles) if (blocks(o, x, z, y, r)) return true;
  return false;
}

/**
 * Try a step (dx,dz) from (px,pz) at altitude py. If the full step collides,
 * try sliding along x then along z so the pet hugs the wall instead of stopping.
 */
export function tryStep(
  px: number,
  pz: number,
  py: number,
  dx: number,
  dz: number,
  r: number,
  obstacles: Obstacle[],
): { x: number; z: number } {
  const nx = px + dx;
  const nz = pz + dz;
  if (!collidesAt(nx, nz, py, r, obstacles)) return { x: nx, z: nz };
  if (!collidesAt(nx, pz, py, r, obstacles)) return { x: nx, z: pz };
  if (!collidesAt(px, nz, py, r, obstacles)) return { x: px, z: nz };
  return { x: px, z: pz };
}

/**
 * Push (myX,myZ) out of (otherX,otherZ) so the two pets keep at least 2*r
 * between centers. Returns the corrected position. Same y level only —
 * pets on different floors don't bump.
 */
export function separatePets(
  myX: number,
  myZ: number,
  myY: number,
  otherX: number,
  otherZ: number,
  otherY: number,
  r: number,
): { x: number; z: number } {
  if (Math.abs(myY - otherY) > 0.6) return { x: myX, z: myZ };
  const dx = myX - otherX;
  const dz = myZ - otherZ;
  const d = Math.hypot(dx, dz);
  const min = r * 2;
  if (d >= min) return { x: myX, z: myZ };
  if (d < 0.0001) return { x: myX + min, z: myZ };
  const k = min / d;
  return { x: otherX + dx * k, z: otherZ + dz * k };
}
