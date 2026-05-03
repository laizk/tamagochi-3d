'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh } from 'three';

const WALL_COLOR = '#F5E8D6';
const FULL_HEIGHT = 5;
const SIZE = 10;
const HALF = SIZE / 2;
const DOOR_GAP = 1.5;
const SIDE_PANEL = (SIZE - DOOR_GAP) / 2; // 4.25
const SIDE_PANEL_X = (SIZE + DOOR_GAP) / 4; // 2.875

/**
 * Walls fade out the side facing the camera so the player always sees inside.
 * The south side has a door gap (no inner dividers anymore — the room is
 * open-plan to keep collision and pathfinding simple).
 */
export function Walls() {
  const north = useRef<Mesh>(null);
  const southWest = useRef<Mesh>(null);
  const southEast = useRef<Mesh>(null);
  const east = useRef<Mesh>(null);
  const west = useRef<Mesh>(null);

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
    if (southWest.current) southWest.current.visible = !hideSouth;
    if (southEast.current) southEast.current.visible = !hideSouth;
    if (east.current) east.current.visible = !hideEast;
    if (west.current) west.current.visible = !hideWest;
  });

  return (
    <>
      <mesh ref={north} position={[0, FULL_HEIGHT / 2, -HALF]} castShadow>
        <boxGeometry args={[SIZE, FULL_HEIGHT, 0.1]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      <mesh ref={west} position={[-HALF, FULL_HEIGHT / 2, 0]} castShadow>
        <boxGeometry args={[0.1, FULL_HEIGHT, SIZE]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      <mesh ref={east} position={[HALF, FULL_HEIGHT / 2, 0]} castShadow>
        <boxGeometry args={[0.1, FULL_HEIGHT, SIZE]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      <mesh ref={southWest} position={[-SIDE_PANEL_X, FULL_HEIGHT / 2, HALF]} castShadow>
        <boxGeometry args={[SIDE_PANEL, FULL_HEIGHT, 0.1]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      <mesh ref={southEast} position={[SIDE_PANEL_X, FULL_HEIGHT / 2, HALF]} castShadow>
        <boxGeometry args={[SIDE_PANEL, FULL_HEIGHT, 0.1]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
    </>
  );
}
