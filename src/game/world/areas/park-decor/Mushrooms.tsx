'use client';

const SPOTS: Array<[number, number]> = [
  [1, -4.5],
  [-4.5, -2],
  [3.5, 2.5],
  [-2.5, 4.5],
];

export function Mushrooms() {
  return (
    <>
      {SPOTS.map(([x, z]) => (
        <group key={`${x}-${z}`} position={[x, 0, z]}>
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.04, 0.05, 0.1, 8]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[0, 0.13, 0]} castShadow>
            <sphereGeometry args={[0.1, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#D04A3A" />
          </mesh>
          <mesh position={[0.04, 0.16, 0.04]}>
            <sphereGeometry args={[0.018, 8, 8]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[-0.05, 0.18, 0]}>
            <sphereGeometry args={[0.018, 8, 8]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[0.02, 0.18, -0.05]}>
            <sphereGeometry args={[0.015, 8, 8]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
        </group>
      ))}
    </>
  );
}
