/**
 * MIGUELITO — frame 18×20.
 *
 * Diseñado a partir de la descripción (no hay foto del peluche todavía):
 * mono de peluche café oscuro, cabeza grande y redonda, antifaz beige
 * alrededor de los ojos, hocico beige grande y sobresaliente (un beige más
 * claro que el antifaz, con contorno solo a los lados y abajo), orejas redondas a los lados, ojos
 * negros grandes con brillo, manos, barriga y pies beige, cuerpo rechoncho.
 */
import { fromAscii, hex } from '../../tools/png.mjs';

export const PALETTE = {
  O: hex('#2e1c14'), // contorno
  M: hex('#6b4430'), // pelaje café oscuro
  m: hex('#533322'), // pelaje en sombra
  L: hex('#875840'), // pelaje con luz
  F: hex('#e3c49a'), // beige (antifaz, orejas, manos, barriga)
  f: hex('#c9a57a'), // beige en sombra
  Z: hex('#efd8b2'), // hocico (beige más claro: sobresale)
  N: hex('#6b3a2a'), // fosas nasales y boca
  E: hex('#140c0a'), // ojos
  W: hex('#ffffff'), // brillo del ojo
};

export const ART = [
  '......OOOOOO......',
  '....OOMMMMMMOO....',
  '...OMMLLMMMMMMO...',
  '..OMMLMMMMMMMMMO..',
  '..OMFFFFMMFFFFMO..',
  '.OOMFWEFFFFWEFMOO.',
  'OFOMFEEFFFFEEFMOFO',
  'OFOMFFZZZZZZFFMOFO',
  '.OOMOZZZNNZZZOMOO.',
  '..OMOZZZZZZZZOMO..',
  '..OMMOfZNNZfOMMO..',
  '..OMMMOOOOOOMMMO..',
  '...OOMMMMMMMMOO...',
  '..OMMMMFFFFMMMMO..',
  '.OMOMMFFFFFFMMOMO.',
  '.OFOMMFFFFFFMMOFO.',
  '..OOMmFFFFFFmMOO..',
  '...OmMMMMMMMMmO...',
  '...OFFfOOOOfFFO...',
  '...OOOO....OOOO...',
];

export const build = () => fromAscii(ART, PALETTE);
