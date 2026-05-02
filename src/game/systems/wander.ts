const Y_MIN = 1.5;
const Y_MAX = 4;

export function pickWanderTarget(
  anchor: [number, number, number],
  radius: number,
): [number, number, number] {
  const angle = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random()) * radius;
  const x = anchor[0] + Math.cos(angle) * r;
  const z = anchor[2] + Math.sin(angle) * r;
  const y = Y_MIN + Math.random() * (Y_MAX - Y_MIN);
  return [x, y, z];
}
