/**
 * MIGUELITO — v2, frame 20×20.
 *
 * Referencia: foto del peluche real.
 * - Pelaje café rojizo oscuro, cabeza grande y redonda.
 * - Antifaz beige en forma de corazón, con un pico de pelo café en la frente.
 * - Ojos negros con brillo. El aro café rojizo bordado del peluche no cabe en
 *   ojos de 2 px: debajo se leía como ojeras y al lado deformaba los ojos.
 * - HOCICO beige enorme que ocupa la mitad inferior de la cabeza y sobresale
 *   por los lados, con naricita arriba y una sonrisa ancha de lado a lado.
 * - Orejas beige grandes y redondas a la altura de los ojos.
 * - Brazos largos con manos beige grandes que llegan hasta los pies.
 *
 * Pasa de 18 a 20 px de ancho para que las orejas sean prominentes.
 * Eje de simetría entre las columnas 9 y 10.
 * (La v1, hecha sin foto, está en el historial de Git: commit c7e72a4.)
 */
import { fromAscii, hex } from '../../tools/png.mjs';

export const PALETTE = {
  O: hex('#2a140e'), // contorno
  M: hex('#5e2f20'), // pelaje café rojizo oscuro
  m: hex('#47221a'), // pelaje en sombra
  L: hex('#7a4130'), // pelaje con luz
  F: hex('#d9b383'), // beige (antifaz, orejas, manos, pies)
  f: hex('#bf9568'), // beige en sombra
  Z: hex('#e6c597'), // hocico (beige con luz: sobresale)
  E: hex('#140a08'), // ojos
  W: hex('#ffffff'), // brillo del ojo
  N: hex('#3a1e16'), // naricita y sonrisa
};

export const ART = [
  '......OOOOOOOO......',
  '....OOMMMMMMMMOO....',
  '...OMMLLMMMMMMMMO...',
  '..OMMLMMMMMMMMMMMO..',
  '..OMMMFFFMMFFFMMMO..',
  '.OOOMFWEFFFFWEFMOOO.',
  'OFFOMFEEFFFFEEFMOFFO',
  'OFfOMFFFFFFFFFFMOfFO',
  'OFfOMfZZZNNZZZfMOfFO',
  '.OOOZZZZZZZZZZZZOOO.',
  '...OZNZZZZZZZZNZO...',
  '...OfZNNNNNNNNZfO...',
  '...OMfZZZZZZZZfMO...',
  '...OMMOOOOOOOOMMO...',
  '..OMMOMMMMMMMMOMMO..',
  '..OMmOMMMMMMMMOmMO..',
  '..OmMOMmMMMMmMOMmO..',
  '.OFFFOMMMMMMMMOFFFO.',
  '.OFFfOFFFOOFFFOfFFO.',
  '..OOOOOOOOOOOOOOOO..',
];

export const build = () => fromAscii(ART, PALETTE);
