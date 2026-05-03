'use client';

const FRAME_COLOR = '#7E5A3A';
const MATTRESS_COLOR = '#FFFFFF';
const PILLOW_COLOR = '#FFFFFF';

type Props = {
  /** Sheet color — kid-readable, e.g. #7AC0FF or #FF9CB8. */
  sheetColor: string;
  position: [number, number, number];
  rotation?: [number, number, number];
};

export function Bed({ sheetColor, position, rotation = [0, 0, 0] }: Props) {
  return (
    <group position={position} rotation={rotation}>
      {/* frame */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.8, 0.4, 1.6]} />
        <meshStandardMaterial color={FRAME_COLOR} roughness={0.8} />
      </mesh>
      {/* mattress */}
      <mesh position={[0, 0.475, 0]} castShadow>
        <boxGeometry args={[0.7, 0.15, 1.5]} />
        <meshStandardMaterial color={MATTRESS_COLOR} roughness={0.7} />
      </mesh>
      {/* sheet */}
      <mesh position={[0, 0.575, 0.25]} castShadow>
        <boxGeometry args={[0.71, 0.05, 1.0]} />
        <meshStandardMaterial color={sheetColor} roughness={0.7} />
      </mesh>
      {/* pillow */}
      <mesh position={[0, 0.65, -0.55]} castShadow>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial color={PILLOW_COLOR} roughness={0.7} />
      </mesh>
    </group>
  );
}
