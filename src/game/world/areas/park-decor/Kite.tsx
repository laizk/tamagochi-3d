'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { type Group, type Mesh, Vector3 } from 'three';

const ANCHOR: [number, number, number] = [-3, 0, -5];
const KITE_BASE: [number, number, number] = [-3, 4.5, -5];

const _anchorVec = new Vector3(ANCHOR[0], ANCHOR[1], ANCHOR[2]);
const _kiteVec = new Vector3();
const _midVec = new Vector3();
const _dirVec = new Vector3();
const _yAxis = new Vector3(0, 1, 0);

export function Kite() {
  const kiteRef = useRef<Group>(null);
  const stringRef = useRef<Mesh>(null);

  useFrame(() => {
    if (kiteRef.current) {
      const t = performance.now() / 1000;
      kiteRef.current.position.x = KITE_BASE[0] + Math.sin(t * 0.6) * 0.6;
      kiteRef.current.position.y = KITE_BASE[1] + Math.sin(t * 1.1) * 0.3;
      kiteRef.current.position.z = KITE_BASE[2] + Math.cos(t * 0.4) * 0.4;
      kiteRef.current.rotation.z = Math.sin(t * 1.3) * 0.2;
    }

    if (stringRef.current && kiteRef.current) {
      _kiteVec.copy(kiteRef.current.position);
      _midVec.copy(_anchorVec).add(_kiteVec).multiplyScalar(0.5);
      _dirVec.copy(_kiteVec).sub(_anchorVec);
      const len = _dirVec.length();
      _dirVec.normalize();
      stringRef.current.position.copy(_midVec);
      // align cylinder's local +Y to dirVec
      stringRef.current.quaternion.setFromUnitVectors(_yAxis, _dirVec);
      stringRef.current.scale.set(1, len, 1);
    }
  });

  return (
    <>
      {/* anchor stake */}
      <mesh position={ANCHOR}>
        <cylinderGeometry args={[0.04, 0.04, 0.2, 6]} />
        <meshStandardMaterial color="#7a4a2c" />
      </mesh>
      {/* string — geometry length 1, scaled.y to current span each frame */}
      <mesh ref={stringRef}>
        <cylinderGeometry args={[0.005, 0.005, 1, 4]} />
        <meshStandardMaterial color="#444" />
      </mesh>
      {/* kite */}
      <group ref={kiteRef}>
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <planeGeometry args={[0.5, 0.5]} />
          <meshStandardMaterial color="#FF7AB6" side={2} />
        </mesh>
        <mesh position={[0, -0.3, 0]}>
          <boxGeometry args={[0.05, 0.4, 0.005]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
      </group>
    </>
  );
}
