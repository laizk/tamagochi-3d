'use client';

const DEFAULT_COLOR = '#1A1A1A';

type Props = {
  /** Foot center x in world units (pass the leg's x position). */
  x: number;
  /** Sphere material color. Defaults to near-black. */
  color?: string;
};

/**
 * Three tiny near-black spheres clustered on the front-bottom of one foot.
 * Static — does not follow the walk-cycle leg lift (lift amount is 0.06,
 * visually unnoticeable). Mount once per foot, passing the leg's x.
 */
export function Claws({ x, color = DEFAULT_COLOR }: Props) {
  return (
    <>
      <mesh position={[x - 0.04, 0.05, 0.1]} castShadow>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      <mesh position={[x, 0.05, 0.11]} castShadow>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      <mesh position={[x + 0.04, 0.05, 0.1]} castShadow>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
    </>
  );
}
