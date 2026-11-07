/**
 * LÍA — v2, frame 20×28 (dibujo de 27 px de alto: fila 0 libre).
 *
 * Referencias: piel tostada cálida, pelo negro liso y largo con raya casi al
 * centro y sin flequillo, ojos grandes con delineado con colita, rubor.
 * Blusa rosada, chaqueta negra, pantalón oscuro.
 *
 * v2: la chaqueta pasa a un negro azulado algo más claro que el pelo (que es
 * negro cálido) y lleva un filo de luz `j` junto al pelo, para separar ambas
 * siluetas sin aclarar el cabello. Rostro y piel sin cambios.
 */
import { fromAscii, hex } from '../../tools/png.mjs';

export const PALETTE = {
  O: hex('#1a1216'), // contorno
  H: hex('#2a1f24'), // pelo (negro cálido)
  h: hex('#46363e'), // brillo del pelo
  S: hex('#c68a62'), // piel
  s: hex('#a46c4a'), // piel en sombra (cuello, mentón)
  E: hex('#140c10'), // delineado
  I: hex('#3b241c'), // iris café oscuro
  W: hex('#f4ece6'), // brillo del ojo
  B: hex('#d8736f'), // rubor
  M: hex('#a94a54'), // boca
  P: hex('#f3b3c3'), // blusa
  p: hex('#dd93a8'), // blusa en sombra
  J: hex('#3e3b52'), // chaqueta (negro azulado, más frío y claro que el pelo)
  j: hex('#5c5878'), // filo de luz de la chaqueta
  K: hex('#36354c'), // pantalón
  k: hex('#28273a'), // pantalón en sombra
  F: hex('#2a2028'), // zapatos
};

export const ART = [
  '....................',
  '.......OOOOOO.......',
  '.....OOHHHHhHOO.....',
  '....OHHHHHHhHHHO....',
  '...OHHhHHHHhHHhHO...',
  '..OHHhHHHHHhHHHhHO..',
  '.OHHHHHSSSSSSHHHHHO.',
  '.OHHHSSSSSSSSSSHHHO.',
  '.OHHSESSSSSSSSESHHO.',
  '.OHHSSEESSSSEESSHHO.',
  '.OHHSSWISSSSWISSHHO.',
  '.OHHSSIISSSSIISSHHO.',
  '.OHHSBBSMSSMSBBSHHO.',
  '.OHHSSSSSMMSSSSSHHO.',
  '.OHHHsSSSSSSSSsHHHO.',
  '.OHHHHOOssssOOHHHHO.',
  '.OHhHjJPPPPPPJjHhHO.',
  '.OHhHjJPPpPPPJjHhHO.',
  '.OHHHjJPPPPPPJjHHHO.',
  '.OHHOjJPPPPPPJjOHHO.',
  '..OOOjJPPPPPpJjOOO..',
  '....OSJPPPPPpJSO....',
  '....OOKKKKKKKKOO....',
  '.....OKKKKKKKkO.....',
  '.....OKKKkkKKkO.....',
  '.....OKKkOOKKkO.....',
  '.....OFFFOOFFFO.....',
  '.....OOOOOOOOOO.....',
];

export const build = () => fromAscii(ART, PALETTE);
