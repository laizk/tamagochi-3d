'use client';

import { PerspectiveCamera, RenderTexture } from '@react-three/drei';
import { DinoPortrait } from './portraits/DinoPortrait';
import { LovebirdPortrait } from './portraits/LovebirdPortrait';

const FRAME_COLOR = '#7E5A3A';
const BG_COLOR = '#FFE0F0';

type Props = {
  subject: 'dino' | 'lovebird';
  position: [number, number, number];
  rotation?: [number, number, number];
};

/**
 * Wood-bordered picture frame with a baked-once portrait of the dino or
 * lovebird. Uses drei's RenderTexture(frames=1) so the inner scene renders
 * a single time at mount and is cached as the inner plane's `.map`.
 */
export function PictureFrame({ subject, position, rotation = [0, 0, 0] }: Props) {
  return (
    <group position={position} rotation={rotation}>
      {/* wood border (4 thin boxes) */}
      <mesh position={[0, 0.275, 0]} castShadow>
        <boxGeometry args={[0.6, 0.05, 0.05]} />
        <meshStandardMaterial color={FRAME_COLOR} roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.275, 0]} castShadow>
        <boxGeometry args={[0.6, 0.05, 0.05]} />
        <meshStandardMaterial color={FRAME_COLOR} roughness={0.8} />
      </mesh>
      <mesh position={[-0.275, 0, 0]} castShadow>
        <boxGeometry args={[0.05, 0.55, 0.05]} />
        <meshStandardMaterial color={FRAME_COLOR} roughness={0.8} />
      </mesh>
      <mesh position={[0.275, 0, 0]} castShadow>
        <boxGeometry args={[0.05, 0.55, 0.05]} />
        <meshStandardMaterial color={FRAME_COLOR} roughness={0.8} />
      </mesh>
      {/* inner plane with baked portrait */}
      <mesh position={[0, 0, 0.005]}>
        <planeGeometry args={[0.5, 0.5]} />
        <meshStandardMaterial>
          <RenderTexture frames={1} attach="map" width={256} height={256}>
            <color attach="background" args={[BG_COLOR]} />
            <ambientLight intensity={0.6} />
            <directionalLight position={[2, 2, 2]} intensity={0.8} />
            <PerspectiveCamera makeDefault position={[0, 0, 1.2]} fov={50} />
            {subject === 'dino' ? <DinoPortrait /> : <LovebirdPortrait />}
          </RenderTexture>
        </meshStandardMaterial>
      </mesh>
    </group>
  );
}
