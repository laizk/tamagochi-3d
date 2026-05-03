'use client';

const DEFAULT_COLOR = '#3D6F94';

type Props = {
  /** Cone material color. Defaults to spike dark-blue. */
  color?: string;
};

/**
 * Five dark-blue cones along the back ridge from front-tall (just behind head)
 * to rear-small (above tail). Body-relative — mount as a sibling of the body.
 */
export function Spikes({ color = DEFAULT_COLOR }: Props) {
  return (
    <>
      <mesh position={[0, 0.95, 0.25]} castShadow>
        <coneGeometry args={[0.06, 0.18, 12]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.95, 0.05]} castShadow>
        <coneGeometry args={[0.07, 0.16, 12]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.93, -0.15]} castShadow>
        <coneGeometry args={[0.06, 0.14, 12]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.85, -0.35]} castShadow>
        <coneGeometry args={[0.05, 0.12, 12]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.7, -0.55]} castShadow>
        <coneGeometry args={[0.04, 0.09, 12]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
    </>
  );
}
