'use client';
import { Portal } from '@/src/game/world/Portal';
import { Ground } from '@/src/game/world/props/Ground';
import { Sky } from '@/src/game/world/props/Sky';
import { Balloons } from './park-decor/Balloons';
import { Bunny } from './park-decor/Bunny';
import { Butterflies } from './park-decor/Butterfly';
import { Clouds } from './park-decor/Clouds';
import { Flowers } from './park-decor/Flowers';
import { Kite } from './park-decor/Kite';
import { Mushrooms } from './park-decor/Mushrooms';
import { Pond } from './park-decor/Pond';
import { Swing } from './park-decor/Swing';
import { TreesAnimated } from './park-decor/TreesAnimated';

export function Park() {
  return (
    <>
      <Sky />
      <Ground color="#88c47a" />
      <TreesAnimated />
      <Flowers />
      <Mushrooms />
      <Pond />
      <Swing />
      <Clouds />
      <Butterflies />
      <Bunny />
      <Kite />
      <Balloons />
      <Portal to="town" position={[0, 0.7, 8]} />
    </>
  );
}
