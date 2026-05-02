'use client';

const BODY_COLOR = '#7FE0B0';
const NOSTRIL_COLOR = '#1A1A24';

export function Snout() {
  return (
    <group position={[0, 1.0, 0.5]}>
      {/* snout cone — lying along +z */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.12, 0.25, 16]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
      </mesh>
      {/* nostrils */}
      <mesh position={[-0.04, 0.03, 0.12]}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshStandardMaterial color={NOSTRIL_COLOR} roughness={0.6} />
      </mesh>
      <mesh position={[0.04, 0.03, 0.12]}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshStandardMaterial color={NOSTRIL_COLOR} roughness={0.6} />
      </mesh>
    </group>
  );
}
