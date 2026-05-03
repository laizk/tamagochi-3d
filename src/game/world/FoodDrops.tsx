'use client';

import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import { useGame } from '@/src/game/store';
import { getFoodDef } from '@/src/game/systems/interactions';

type Props = {
  emoji: string;
  position: [number, number, number];
};

function Drop({ emoji, position }: Props) {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * 1.4;
    ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 3) * 0.04;
  });
  return (
    <group ref={ref} position={position}>
      <mesh castShadow>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial color="#fff" emissive="#fff7c0" emissiveIntensity={0.4} />
      </mesh>
      <Text
        position={[0, 0, 0.16]}
        fontSize={0.22}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#000"
      >
        {emoji}
      </Text>
    </group>
  );
}

/**
 * Renders a glowing emoji marker for each pet's pending food drop.
 * The pet has to physically walk to it before hunger replenishes.
 */
export function FoodDrops() {
  const dinoFood = useGame((s) => s.characters.dino.foodTarget);
  const birdFood = useGame((s) => s.characters.lovebirds.foodTarget);
  return (
    <>
      {dinoFood ? (
        <Drop
          emoji={getFoodDef(dinoFood.foodId, 'dino')?.emoji ?? '🍎'}
          position={dinoFood.position}
        />
      ) : null}
      {birdFood ? (
        <Drop
          emoji={getFoodDef(birdFood.foodId, 'lovebirds')?.emoji ?? '🌾'}
          position={birdFood.position}
        />
      ) : null}
    </>
  );
}
