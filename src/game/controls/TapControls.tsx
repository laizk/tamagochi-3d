'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Raycaster, Vector2, Vector3 } from 'three';
import { useGame } from '@/src/game/store';
import {
  FLOOR_2_THRESHOLD,
  STAIR_BASE_WAYPOINT,
  STAIR_TOP_WAYPOINT,
} from '@/src/game/world/areas/home-interior/stair-config';

const MOVE_SPEED = 2.2; // units / second

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
    if (queue.current.length === 0) return;
    const active = useGame.getState().active;
    const action = useGame.getState().characters[active].action;
    if (action !== null) {
      queue.current = [];
      return;
    }
    const next = queue.current[0];
    const pos = useGame.getState().characters[active].position;
    const dx = next.x - pos[0];
    const dz = next.z - pos[2];
    const dist = Math.hypot(dx, dz);
    if (dist < 0.05) {
      // Snap to waypoint y, then advance to the next leg.
      useGame.getState().setPosition(active, [pos[0], next.y, pos[2]]);
      queue.current.shift();
      return;
    }
    const step = Math.min(dist, MOVE_SPEED * dt);
    const nx = pos[0] + (dx / dist) * step;
    const nz = pos[2] + (dz / dist) * step;
    // Interpolate y by horizontal progress so the stair leg becomes a ramp.
    const t = step / dist;
    const ny = pos[1] + (next.y - pos[1]) * t;
    useGame.getState().setPosition(active, [nx, ny, nz]);
  });

  return null;
}
