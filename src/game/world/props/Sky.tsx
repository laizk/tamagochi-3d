'use client';
import { Sky as DreiSky } from '@react-three/drei';

export function Sky() {
  return <DreiSky sunPosition={[8, 4, 5]} turbidity={6} rayleigh={2} />;
}
