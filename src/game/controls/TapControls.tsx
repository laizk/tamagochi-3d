'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Raycaster, Vector2, Vector3 } from 'three';
import { useGame } from '@/src/game/store';
import { type Obstacle, PET_R, separatePets, tryStep } from '@/src/game/systems/collision';
import { HOME_OBSTACLES } from '@/src/game/world/areas/home-interior/obstacles';
import {
  FLOOR_2_THRESHOLD,
  STAIR_BASE_WAYPOINT,
  STAIR_TOP_WAYPOINT,
} from '@/src/game/world/areas/home-interior/stair-config';
import { readRuntimePos, writeRuntimePos } from '@/src/game/world/runtimePositions';

const MOVE_SPEED = 2.2; // units / second

const NO_OBSTACLES: Obstacle[] = [];

function obstaclesFor(area: string): Obstacle[] {
  return area === 'home' ? HOME_OBSTACLES : NO_OBSTACLES;
}

/**
 * Build a waypoint queue between two world points. In the home, switching
 * floors routes the pet through the stair base/top so it walks the steps
 * instead of gliding through the air.
 */
function planPath(
  start: { x: number; y: number; z: number },
  end: Vector3,
  area: string,
): Vector3[] {
  if (area !== 'home') return [end];
  const startUp = start.y > FLOOR_2_THRESHOLD;
  const endUp = end.y > FLOOR_2_THRESHOLD;
  if (startUp === endUp) return [end];
  const base = new Vector3(...STAIR_BASE_WAYPOINT);
  const top = new Vector3(...STAIR_TOP_WAYPOINT);
  return startUp ? [top, base, end] : [base, top, end];
}

export function TapControls() {
  const { camera, gl, scene } = useThree();
  const queue = useRef<Vector3[]>([]);
  const raycaster = useRef(new Raycaster());
  const ndc = useRef(new Vector2());

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const downX = e.clientX;
      const downY = e.clientY;
      const onUp = (u: PointerEvent) => {
        const dx = Math.abs(u.clientX - downX);
        const dy = Math.abs(u.clientY - downY);
        if (dx + dy < 8) {
          const active = useGame.getState().active;
          const action = useGame.getState().characters[active].action;
          if (action !== null) {
            gl.domElement.removeEventListener('pointerup', onUp);
            return;
          }
          const rect = gl.domElement.getBoundingClientRect();
          ndc.current.set(
            ((u.clientX - rect.left) / rect.width) * 2 - 1,
            -((u.clientY - rect.top) / rect.height) * 2 + 1,
          );
          raycaster.current.setFromCamera(ndc.current, camera);
          const hits = raycaster.current.intersectObjects(scene.children, true);
          const groundHit = hits.find((h) => h.object.userData?.kind === 'ground');
          if (groundHit) {
            const start = useGame.getState().characters[active].position;
            const area = useGame.getState().currentArea;
            queue.current = planPath(
              { x: start[0], y: start[1], z: start[2] },
              groundHit.point.clone(),
              area,
            );
          }
        }
        gl.domElement.removeEventListener('pointerup', onUp);
      };
      gl.domElement.addEventListener('pointerup', onUp);
    };
    gl.domElement.addEventListener('pointerdown', onPointerDown);
    return () => gl.domElement.removeEventListener('pointerdown', onPointerDown);
  }, [camera, gl, scene]);

  useFrame((_, dt) => {
    const active = useGame.getState().active;
    const action = useGame.getState().characters[active].action;
    if (action !== null) {
      queue.current = [];
      return;
    }
    const pos = useGame.getState().characters[active].position;
    // Always keep the runtime cache fresh so the other pet can avoid us.
    writeRuntimePos(active, pos[0], pos[1], pos[2]);

    if (queue.current.length === 0) return;
    const next = queue.current[0];
    const dx = next.x - pos[0];
    const dz = next.z - pos[2];
    const dist = Math.hypot(dx, dz);
    if (dist < 0.05) {
      useGame.getState().setPosition(active, [pos[0], next.y, pos[2]]);
      queue.current.shift();
      return;
    }
    const step = Math.min(dist, MOVE_SPEED * dt);
    const ux = (dx / dist) * step;
    const uz = (dz / dist) * step;
    const area = useGame.getState().currentArea;
    const stepped = tryStep(pos[0], pos[2], pos[1], ux, uz, PET_R, obstaclesFor(area));
    // pet-pet separation against the other character
    const otherId = active === 'dino' ? 'lovebirds' : 'dino';
    const other = readRuntimePos(otherId);
    const adj = separatePets(stepped.x, stepped.z, pos[1], other[0], other[2], other[1], PET_R);
    const nx = adj.x;
    const nz = adj.z;
    const t = Math.hypot(nx - pos[0], nz - pos[2]) / Math.max(dist, 0.0001);
    const ny = pos[1] + (next.y - pos[1]) * Math.min(1, t);
    useGame.getState().setPosition(active, [nx, ny, nz]);
  });

  return null;
}
