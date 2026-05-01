'use client';

import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import type { AnimationClip, Group, Mesh, Object3D } from 'three';
import { useGame } from '@/src/game/store';
import { onPet } from '@/src/game/systems/interactions';

const GLB_PATH = '/models/dino/t-rex.glb';

// Preload at module scope so the GLB is fetched before it is needed.
useGLTF.preload(GLB_PATH);

type GLTFResult = {
  scene: Group;
  animations: AnimationClip[];
};

function DinoGLB({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<Group>(null);
  const [bounce, setBounce] = useState(0);
  const stats = useGame((s) => s.dino.stats);

  const gltf = useGLTF(GLB_PATH) as unknown as GLTFResult;
  const { actions } = useAnimations(gltf.animations, groupRef);

  // Enable shadows on all mesh children once on mount.
  useEffect(() => {
    gltf.scene.traverse((child: Object3D) => {
      if ((child as Mesh).isMesh) {
        (child as Mesh).castShadow = true;
      }
    });
  }, [gltf.scene]);

  // Play the first idle animation, or fall back to the first clip.
  useEffect(() => {
    if (gltf.animations.length === 0) return;
    const idleClip = gltf.animations.find((c) => /idle/i.test(c.name)) ?? gltf.animations[0];
    const action = actions[idleClip.name];
    if (action) {
      action.reset().fadeIn(0.3).play();
    }
    return () => {
      action?.fadeOut(0.3);
    };
  }, [actions, gltf.animations]);

  useEffect(() => {
    const unsub = onPet(() => setBounce(performance.now()));
    return () => {
      unsub();
    };
  }, []);

  useFrame(() => {
    if (!groupRef.current) return;
    const bob = Math.sin(performance.now() / 400) * 0.05;
    const bouncePhase = (performance.now() - bounce) / 1000;
    const bounceY = bouncePhase < 0.6 ? Math.sin((bouncePhase * Math.PI) / 0.6) * 0.4 : 0;
    // GLB origin is at feet, so y baseline is 0 (not +0.5 like the sphere).
    groupRef.current.position.set(position[0], position[1] + bob + bounceY, position[2]);
    const sad = Math.min(stats.hunger, stats.happy, stats.energy, stats.clean) < 25;
    groupRef.current.rotation.x = sad ? 0.2 : 0;
  });

  return (
    <group ref={groupRef} scale={0.6}>
      <primitive object={gltf.scene} />
    </group>
  );
}

function DinoEgg({ position }: { position: [number, number, number] }) {
  const ref = useRef<Mesh>(null);
  const [bounce, setBounce] = useState(0);
  const stats = useGame((s) => s.dino.stats);

  useEffect(() => {
    const unsub = onPet(() => setBounce(performance.now()));
    return () => {
      unsub();
    };
  }, []);

  useFrame(() => {
    if (!ref.current) return;
    const bob = Math.sin(performance.now() / 400) * 0.05;
    const bouncePhase = (performance.now() - bounce) / 1000;
    const bounceY = bouncePhase < 0.6 ? Math.sin((bouncePhase * Math.PI) / 0.6) * 0.4 : 0;
    // Sphere: center-origin, so y baseline is +0.35 (sphere radius).
    ref.current.position.set(position[0], position[1] + 0.35 + bob + bounceY, position[2]);
    const sad = Math.min(stats.hunger, stats.happy, stats.energy, stats.clean) < 25;
    ref.current.rotation.x = sad ? 0.2 : 0;
  });

  return (
    <mesh ref={ref} castShadow>
      <sphereGeometry args={[0.35, 24, 24]} />
      <meshStandardMaterial color="#f5ecd9" roughness={0.7} />
    </mesh>
  );
}

export function Dino() {
  const stage = useGame((s) => s.dino.stage);
  const position = useGame((s) => s.dino.position);

  if (stage === 'egg') {
    return <DinoEgg position={position} />;
  }

  return <DinoGLB position={position} />;
}
