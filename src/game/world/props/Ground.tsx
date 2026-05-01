'use client';

type Props = { color?: string; size?: number };

export function Ground({ color = '#88c47a', size = 30 }: Props) {
  return (
    <mesh
      receiveShadow
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      userData={{ kind: 'ground' }}
    >
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
