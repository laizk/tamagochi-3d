'use client';
import { Bed } from '@/src/game/world/areas/home-interior/Bed';
import { DiningTable } from '@/src/game/world/areas/home-interior/DiningTable';
import { Floor } from '@/src/game/world/areas/home-interior/Floor';
import { PictureFrame } from '@/src/game/world/areas/home-interior/PictureFrame';
import { Stairs } from '@/src/game/world/areas/home-interior/Stairs';
import { Walls } from '@/src/game/world/areas/home-interior/Walls';
import { Portal } from '@/src/game/world/Portal';
import { Sky } from '@/src/game/world/props/Sky';

export function Home() {
  return (
    <>
      <Sky />
      <Walls />
      <Floor />
      <Stairs />
      <DiningTable position={[-1.5, 0, 0]} />
      <Bed sheetColor="#7AC0FF" position={[-1.5, 2.5, -1]} />
      <Bed sheetColor="#FF9CB8" position={[1.5, 2.5, -1]} />
      <PictureFrame subject="dino" position={[-4.95, 1.6, 0]} rotation={[0, Math.PI / 2, 0]} />
      <PictureFrame subject="lovebird" position={[4.95, 1.6, 0]} rotation={[0, -Math.PI / 2, 0]} />
      <PictureFrame subject="lovebird" position={[-4.95, 4.1, 0]} rotation={[0, Math.PI / 2, 0]} />
      <PictureFrame subject="dino" position={[4.95, 4.1, 0]} rotation={[0, -Math.PI / 2, 0]} />
      <Portal to="yard" position={[0, 0.7, 5.5]} />
    </>
  );
}
