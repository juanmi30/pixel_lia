/**
 * MIGUEL — frame 20×28 (dibujo de 28 px de alto: 1 px más alto que Lía).
 *
 * Referencias: piel clara cálida, pelo castaño muy oscuro, abundante y
 * despeinado, con flequillo irregular sobre la frente; ojos oscuros, sonrisa
 * amplia y juvenil; complexión delgada. Hoodie negro con cordones y jeans azules.
 *
 * Comparte con Lía la cabeza (12 px de cara), los ojos de 2 px de ancho, el
 * contorno, la altura de las piernas y la línea de suelo.
 */
import { fromAscii, hex } from '../../tools/png.mjs';

export const PALETTE = {
  O: hex('#1e1418'), // contorno
  H: hex('#3a2a24'), // pelo castaño muy oscuro (cálido)
  h: hex('#5a4236'), // mechones con luz
  S: hex('#f0c6a0'), // piel clara cálida
  s: hex('#d6a37e'), // piel en sombra
  E: hex('#1e1418'), // ojos
  W: hex('#f4ece6'), // brillo del ojo
  b: hex('#eaa08c'), // rubor suave
  M: hex('#a94a54'), // boca
  T: hex('#fbf6f0'), // dientes (sonrisa abierta)
  C: hex('#383846'), // hoodie negro (frío, distinto del pelo)
  c: hex('#525266'), // luz del hoodie
  w: hex('#e8e4ea'), // cordones
  J: hex('#4f78b0'), // jeans
  j: hex('#6b93c8'), // jeans con luz
  F: hex('#2a2530'), // zapatillas
};

export const ART = [
  '......OOOO.OO.......',
  '....OOHHHHOHHOO.....',
  '...OHHhHHHHHhHHO....',
  '..OHHHhHHHHHHhHHHO..',
  '.OHHhHHHHHHHHHHhHHO.',
  '.OHHHHHHhHHHHHHHHHO.',
  '.OHHHHHHHHHHHhHHHHO.',
  '.OHHHSHHHSHSHHSHHHO.',
  '.OHHSSHSSSSSSHSSHHO.',
  '.OHSSSWESSSSWESSSHO.',
  '.OHsSSEESSSSEESSsHO.',
  '.OHHSbSSSSSSSSbSHHO.',
  '..OHSSSSMTTMSSSSHO..',
  '..OOSSSSSMMSSSSSOO..',
  '...OsSSSSSSSSSSsO...',
  '....OOOOssssOOOO....',
  '...OCcCCssssCCcCO...',
  '...OCCCCwCCwCCCCO...',
  '...OCcOCwCCwCOcCO...',
  '...OCcOCCCCCCOcCO...',
  '...OCCOCCCCCCOCCO...',
  '...OSSOCCCCCCOSSO...',
  '...OOOJJJJJJJJOOO...',
  '.....OJJJJJJJJO.....',
  '.....OJjJJJJjJO.....',
  '.....OJJJOOJJJO.....',
  '.....OFFFOOFFFO.....',
  '.....OOOOOOOOOO.....',
];

export const build = () => fromAscii(ART, PALETTE);
