'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Raycaster, Vector2, type Vector3 } from 'three';
import { useGame } from '@/src/game/store';

const MOVE_SPEED = 2.2; // units / second

export function TapControls() {
  const { camera, gl, scene } = useThree();
  const target = useRef<Vector3 | null>(null);
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
          // Treat as tap
          const rect = gl.domElement.getBoundingClientRect();
          ndc.current.set(
            ((u.clientX - rect.left) / rect.width) * 2 - 1,
            -((u.clientY - rect.top) / rect.height) * 2 + 1,
          );
          raycaster.current.setFromCamera(ndc.current, camera);
          const hits = raycaster.current.intersectObjects(scene.children, true);
          const groundHit = hits.find((h) => h.object.userData?.kind === 'ground');
          if (groundHit) target.current = groundHit.point.clone().setY(0);
        }
        gl.domElement.removeEventListener('pointerup', onUp);
      };
      gl.domElement.addEventListener('pointerup', onUp);
    };
    gl.domElement.addEventListener('pointerdown', onPointerDown);
    return () => gl.domElement.removeEventListener('pointerdown', onPointerDown);
  }, [camera, gl, scene]);

  useFrame((_, dt) => {
    if (!target.current) return;
    const active = useGame.getState().active;
    const pos = useGame.getState().characters[active].position;
    const dx = target.current.x - pos[0];
    const dz = target.current.z - pos[2];
    const dist = Math.hypot(dx, dz);
    if (dist < 0.05) {
      target.current = null;
      return;
    }
    const step = Math.min(dist, MOVE_SPEED * dt);
    const nx = pos[0] + (dx / dist) * step;
    const nz = pos[2] + (dz / dist) * step;
    useGame.getState().setPosition(active, [nx, pos[1], nz]);
  });

  return null;
}
