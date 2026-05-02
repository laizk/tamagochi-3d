'use client';

import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { RefObject } from 'react';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type { AnimationClip, Group, Mesh, Object3D } from 'three';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { useGame } from '@/src/game/store';
import { onPet } from '@/src/game/systems/interactions';

const GLB_PATH = '/models/dino/t-rex.glb';

// Preload at module scope so the GLB is fetched before it is needed.
useGLTF.preload(GLB_PATH);

// The Quaternius T-Rex GLB has an Armature node with a baked scale of 300×.
// We invert that so the dino stands ~1.5 units tall (similar footprint to the
// egg sphere placeholder).
const DINO_SCALE = 0.005;

// Shared position tuple type — mirrors the Dino.position field in the store.
type Position = [number, number, number];

// Minimal local type — drei's useGLTF return type is not directly exported.
type LoadedGLTF = { scene: Group; animations: AnimationClip[] };

/**
 * Shared motion logic for both DinoEgg and DinoGLB: gentle bob, pet-bounce,
 * and a sad-tilt when needs are critically low.
 *
 * @param ref   - ref to the mesh/group to animate
 * @param baseY - added to the store position's y as the vertical resting offset.
 *                This hook owns all vertical motion (bob + bounce); callers set
 *                `baseY` to their natural origin offset (e.g. 0.35 for a
 *                center-origin sphere, 0 for a feet-origin GLB).
 */
function useDinoMotion(ref: RefObject<Object3D | null>, baseY: number) {
  const [bounce, setBounce] = useState(0);

  useEffect(() => {
    const unsub = onPet(() => setBounce(performance.now()));
    return () => {
      unsub();
    };
  }, []);

  // Mirror bounce into a ref so useFrame reads the latest value without
  // having a stale closure or triggering re-registration.
  const bounceRef = useRef(bounce);
  useEffect(() => {
    bounceRef.current = bounce;
  }, [bounce]);

  useFrame(() => {
    if (!ref.current) return;
    const now = performance.now();
    const bob = Math.sin(now / 400) * 0.05;
    const bouncePhase = (now - bounceRef.current) / 1000;
    const bounceY = bouncePhase < 0.6 ? Math.sin((bouncePhase * Math.PI) / 0.6) * 0.4 : 0;
    // Use the store position y as the world baseline so both egg and GLB sit at the
    // same height and the hook stays in sync with future position updates.
    const storeY = useGame.getState().dino.position[1];
    ref.current.position.y = storeY + baseY + bob + bounceY;

    // Read stats directly from store snapshot — no React subscription needed here.
    const stats = useGame.getState().dino.stats;
    const sad = Math.min(stats.hunger, stats.happy, stats.energy, stats.clean) < 25;
    ref.current.rotation.x = sad ? 0.2 : 0;
  });
}

function DinoGLB({ position }: { position: Position }) {
  const groupRef = useRef<Group>(null);

  // Cast through unknown once — drei doesn't expose a fully typed return.
  const gltf = useGLTF(GLB_PATH) as unknown as LoadedGLTF;

  // Clone the shared cached scene so multiple mounts don't fight over the same
  // Object3D (StrictMode double-mount, future skin preview, etc.).
  const cloned = useMemo(() => cloneSkeleton(gltf.scene) as Group, [gltf.scene]);

  const { actions } = useAnimations(gltf.animations, groupRef);

  // Enable shadows on the cloned mesh children — never mutate the shared original.
  useEffect(() => {
    cloned.traverse((child: Object3D) => {
      if ((child as Mesh).isMesh) {
        (child as Mesh).castShadow = true;
      }
    });
  }, [cloned]);

  // Play the first idle animation, or fall back to the first clip.
  useEffect(() => {
    if (gltf.animations.length === 0) {
      console.info('[DinoGLB] No animations found in GLB — static mesh only.');
      return;
    }
    const idleClip = gltf.animations.find((c) => /idle/i.test(c.name)) ?? gltf.animations[0];
    const action = actions[idleClip.name];
    if (action) {
      action.reset().fadeIn(0.3).play();
    }
    return () => {
      action?.fadeOut(0.3);
    };
  }, [actions, gltf.animations]);

  // GLB origin is at feet — baseY = 0 (store y is the world baseline).
  useDinoMotion(groupRef, 0);

  return (
    <group ref={groupRef} position={position} scale={DINO_SCALE}>
      <primitive object={cloned} />
    </group>
  );
}

/**
 * @param position - world position from the store
 * @param baseY    - vertical offset added on top of position[1].
 *                   Defaults to 0.35 (sphere-radius offset for the real egg stage).
 *                   Pass 0 when used as a Suspense fallback so it sits at the
 *                   same baseline as DinoGLB, preventing a y-pop on resolve.
 */
function DinoEgg({ position, baseY = 0.35 }: { position: Position; baseY?: number }) {
  const ref = useRef<Mesh>(null);

  // Sphere: center-origin, so the default y baseline is sphere radius (0.35).
  useDinoMotion(ref, baseY);

  return (
    <mesh ref={ref} position={[position[0], position[1] + baseY, position[2]]} castShadow>
      <sphereGeometry args={[0.35, 24, 24]} />
      <meshStandardMaterial color="#f5ecd9" roughness={0.7} />
    </mesh>
  );
}

export function Dino() {
  const stage = useGame((s) => s.dino.stage);
  const position = useGame((s) => s.dino.position);

  // egg before hatch, animated dino after
  if (stage === 'egg') {
    return <DinoEgg position={position} />;
  }

  return (
    // baseY=0 aligns the fallback egg with the GLB baseline, preventing a y-pop on resolve.
    <Suspense fallback={<DinoEgg position={position} baseY={0} />}>
      <DinoGLB position={position} />
    </Suspense>
  );
}
