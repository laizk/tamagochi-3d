const MIN_DELTA = 0.001;

export function headingFromDelta(dx: number, dz: number): number | null {
  if (Math.hypot(dx, dz) < MIN_DELTA) return null;
  return Math.atan2(dx, dz);
}
