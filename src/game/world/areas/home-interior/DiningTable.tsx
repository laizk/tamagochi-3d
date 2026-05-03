'use client';

const WOOD_COLOR = '#7E5A3A';

type Props = {
  position: [number, number, number];
};

export function DiningTable({ position }: Props) {
  return (
    <group position={position}>
      {/* table top */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[1.2, 0.05, 0.8]} />
        <meshStandardMaterial color={WOOD_COLOR} roughness={0.8} />
      </mesh>
      {/* 4 legs */}
      <mesh position={[-0.55, 0.35, -0.35]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
        <meshStandardMaterial color={WOOD_COLOR} roughness={0.8} />
      </mesh>
      <mesh position={[0.55, 0.35, -0.35]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
        <meshStandardMaterial color={WOOD_COLOR} roughness={0.8} />
      </mesh>
      <mesh position={[-0.55, 0.35, 0.35]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
        <meshStandardMaterial color={WOOD_COLOR} roughness={0.8} />
      </mesh>
      <mesh position={[0.55, 0.35, 0.35]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
        <meshStandardMaterial color={WOOD_COLOR} roughness={0.8} />
      </mesh>
      {/* chair 1 (west side) */}
      <mesh position={[-0.85, 0.2, 0]} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color={WOOD_COLOR} roughness={0.8} />
      </mesh>
      <mesh position={[-1.05, 0.45, 0]} castShadow>
        <boxGeometry args={[0.05, 0.5, 0.4]} />
        <meshStandardMaterial color={WOOD_COLOR} roughness={0.8} />
      </mesh>
      {/* chair 2 (east side) */}
      <mesh position={[0.85, 0.2, 0]} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color={WOOD_COLOR} roughness={0.8} />
      </mesh>
      <mesh position={[1.05, 0.45, 0]} castShadow>
        <boxGeometry args={[0.05, 0.5, 0.4]} />
        <meshStandardMaterial color={WOOD_COLOR} roughness={0.8} />
      </mesh>
    </group>
  );
}
