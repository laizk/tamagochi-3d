'use client';

const PATCHES: Array<{ pos: [number, number]; color: string }> = [
  { pos: [1.5, 1.5], color: '#FF7AB6' },
  { pos: [-2, 2], color: '#FFD86B' },
  { pos: [4, 0.5], color: '#A4E0FF' },
  { pos: [-5, -1], color: '#FFFFFF' },
  { pos: [2.5, -2.5], color: '#FF9C6B' },
  { pos: [-1.5, -3.5], color: '#C8A4FF' },
  { pos: [-3.5, 3], color: '#FFD86B' },
  { pos: [4.5, 4], color: '#FF7AB6' },
];

const PETAL_OFFSETS: Array<[number, number, number]> = [
  [0, 0.05, 0],
  [0.05, 0.04, 0],
  [-0.05, 0.04, 0],
  [0, 0.04, 0.05],
  [0, 0.04, -0.05],
];

export function Flowers() {
  return (
    <>
      {PATCHES.map(({ pos, color }) => (
        <group key={`${pos[0]}-${pos[1]}`} position={[pos[0], 0, pos[1]]}>
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 0.1, 6]} />
            <meshStandardMaterial color="#3f8a3a" />
          </mesh>
          {PETAL_OFFSETS.map(([px, py, pz], _j) => (
            <mesh key={`${px}-${py}-${pz}`} position={[px, 0.1 + py, pz]}>
              <sphereGeometry args={[0.025, 8, 8]} />
              <meshStandardMaterial color={color} roughness={0.5} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}
