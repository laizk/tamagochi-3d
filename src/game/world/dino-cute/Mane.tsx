'use client';

const DEFAULT_COLOR = '#F5B83A';

type Props = {
  /** Cone material color. Defaults to mane orange. */
  color?: string;
};

/**
 * Five orange zigzag cones along the head-top + neck-top ridge.
 * Coordinates are head-relative — mount this inside the head wrapper group.
 */
export function Mane({ color = DEFAULT_COLOR }: Props) {
  return (
    <>
      <mesh position={[-0.04, 0.3, -0.1]} rotation={[0, 0, 0.25]} castShadow>
        <coneGeometry args={[0.045, 0.1, 8]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh position={[0.04, 0.32, -0.05]} rotation={[0, 0, -0.25]} castShadow>
        <coneGeometry args={[0.045, 0.1, 8]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh position={[-0.03, 0.3, 0.02]} rotation={[0, 0, 0.25]} castShadow>
        <coneGeometry args={[0.045, 0.1, 8]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh position={[0.03, 0.27, 0.1]} rotation={[0, 0, -0.25]} castShadow>
        <coneGeometry args={[0.045, 0.1, 8]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.2, 0.18]} castShadow>
        <coneGeometry args={[0.035, 0.08, 8]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
    </>
  );
}
