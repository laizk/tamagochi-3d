'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh } from 'three';

const WALL_COLOR = '#F5E8D6';
const FULL_HEIGHT = 5;
const HALF_HEIGHT = 1.25;
const SIZE = 10;
const HALF = SIZE / 2;

/**
 * Walls hide on the side facing the camera so the player always sees inside,
 * dollhouse-cutaway style. The wall whose outward normal points toward the
 * camera is the one that's blocking the view, so we hide it.
 */
export function Walls() {
  const north = useRef<Mesh>(null); // -z
  const south = useRef<Mesh>(null); // +z
  const east = useRef<Mesh>(null); // +x
  const west = useRef<Mesh>(null); // -x

  useFrame(({ camera }) => {
    const cx = camera.position.x;
    const cz = camera.position.z;
    let hideNorth = false;
    let hideSouth = false;
    let hideEast = false;
    let hideWest = false;
    if (Math.abs(cx) > Math.abs(cz)) {
      if (cx >= 0) hideEast = true;
      else hideWest = true;
    } else {
      if (cz >= 0) hideSouth = true;
      else hideNorth = true;
    }
    if (north.current) north.current.visible = !hideNorth;
    if (south.current) south.current.visible = !hideSouth;
    if (east.current) east.current.visible = !hideEast;
    if (west.current) west.current.visible = !hideWest;
  });

  return (
    <>
      {/* north (back) wall */}
      <mesh ref={north} position={[0, FULL_HEIGHT / 2, -HALF]} castShadow>
        <boxGeometry args={[SIZE, FULL_HEIGHT, 0.1]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      {/* south (front) wall */}
      <mesh ref={south} position={[0, FULL_HEIGHT / 2, HALF]} castShadow>
        <boxGeometry args={[SIZE, FULL_HEIGHT, 0.1]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      {/* west wall */}
      <mesh ref={west} position={[-HALF, FULL_HEIGHT / 2, 0]} castShadow>
        <boxGeometry args={[0.1, FULL_HEIGHT, SIZE]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      {/* east wall */}
      <mesh ref={east} position={[HALF, FULL_HEIGHT / 2, 0]} castShadow>
        <boxGeometry args={[0.1, FULL_HEIGHT, SIZE]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      {/* floor 1 divider — half-height so pet roams freely */}
      <mesh position={[0, HALF_HEIGHT / 2, 0]} castShadow>
        <boxGeometry args={[0.1, HALF_HEIGHT, SIZE]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      {/* floor 2 divider — half-height */}
      <mesh position={[0, 2.5 + HALF_HEIGHT / 2, 0]} castShadow>
        <boxGeometry args={[0.1, HALF_HEIGHT, SIZE]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
    </>
  );
}
