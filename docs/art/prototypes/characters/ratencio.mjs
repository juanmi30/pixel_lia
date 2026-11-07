/**
 * RATENCIO — v2, frame 22×20.
 *
 * Referencia: el peluche real. Cuerpo gris en forma de pera, con la cabeza
 * integrada (sin cuello) y la parte de arriba redondeada como una cúpula.
 * Orejas pequeñas y redondas pegadas a los costados de la cabeza, no en las
 * esquinas (en la v1 eso, junto con los ojos en "v", lo hacía parecer un gato).
 * Ojos pequeños y tranquilos. El rasgo principal es el GRAN ÓVALO ROSADO del
 * hocico, justo debajo de los ojos y con la naricita en su parte alta.
 * Patitas diminutas; la cola no se ve de frente.
 *
 * La silueta se calcula (huevo con la parte de arriba más estrecha) y los
 * detalles pequeños se colocan a mano. Eje de simetría entre las columnas 10 y 11.
 */
import { createCanvas, hex } from '../../tools/png.mjs';

export const PALETTE = {
  O: hex('#4b4453'), // contorno
  G: hex('#a3a0aa'), // gris
  g: hex('#8a8694'), // gris en sombra
  l: hex('#bebbc4'), // gris con luz
  r: hex('#8b6e64'), // interior de las orejas
  P: hex('#eba7b2'), // hocico rosado
  p: hex('#d98e9c'), // hocico en sombra
  N: hex('#c96f82'), // naricita
  n: hex('#f6c9d1'), // brillo del hocico
  E: hex('#3e3644'), // ojos
  B: hex('#ef9fae'), // rubor (solo en la reacción alegre)
  F: hex('#c9a7ad'), // patitas
  T: hex('#9c8088'), // cola
};

/** Parámetros de forma, por si hay que ajustar la silueta. */
export const SHAPE = {
  width: 22,
  height: 20,
  body: { top: 3, bottom: 19, rx: 8.4, topWidth: 0.66, bottomWidth: 1.0 },
  snout: { cy: 11.2, rx: 4.0, ry: 3.0 },
};

/**
 * Dibuja a Ratencio. Sin opciones produce exactamente el sprite aprobado.
 * Las opciones solo las usa el generador de animaciones:
 *   body   ajustes de la silueta (p. ej. { top: 4 } para aplastar la cúpula)
 *   eyes   'sleepy' (aprobado) | 'happy' (arquitos ^) | 'closed' (rayita)
 *   feet   'both' | 'left' | 'right' (la otra patita, levantada, no se ve)
 *   blush  rubor junto al hocico
 */
export function build({ body: bodyOverrides = {}, eyes = 'sleepy', feet = 'both', blush = false } = {}) {
  const { width: W, height: H, snout } = SHAPE;
  const body = { ...SHAPE.body, ...bodyOverrides };
  const P = PALETTE;
  const c = createCanvas(W, H);
  const cx = W / 2;
  const cy = (body.top + body.bottom) / 2;
  const ry = (body.bottom - body.top) / 2;
  const mirror = (x) => W - 1 - x;
  const both = (x, y, k) => {
    c.set(x, y, P[k]);
    c.set(mirror(x), y, P[k]);
  };

  // Orejas: discos pequeños a los costados de la cabeza (el cuerpo las tapa en parte)
  for (const [x, y, k] of [
    [4, 4, 'O'], [5, 4, 'O'],
    [3, 5, 'O'], [4, 5, 'G'], [5, 5, 'r'], [6, 5, 'O'],
    [3, 6, 'O'], [4, 6, 'G'], [5, 6, 'G'], [6, 6, 'O'],
    [4, 7, 'O'], [5, 7, 'O'],
  ]) both(x, y, k);

  // Cuerpo en forma de pera: el ancho crece de arriba abajo
  const inBody = (x, y) => {
    const py = y + 0.5;
    const t = Math.min(1, Math.max(0, (py - body.top) / (body.bottom - body.top)));
    const f = body.topWidth + (body.bottomWidth - body.topWidth) * t;
    return ((x + 0.5 - cx) / (body.rx * f)) ** 2 + ((py - cy) / ry) ** 2 <= 1;
  };
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!inBody(x, y)) continue;
      const edge = !inBody(x - 1, y) || !inBody(x + 1, y) || !inBody(x, y - 1) || !inBody(x, y + 1);
      if (edge) {
        c.set(x, y, P.O);
        continue;
      }
      const nx = (x + 0.5 - cx) / body.rx;
      const ny = (y + 0.5 - cy) / ry;
      let k = P.G;
      if (nx + ny < -0.85) k = P.l;
      else if (!inBody(x + 2, y) && nx > 0) k = P.g;
      else if (ny > 0.78) k = P.g;
      c.set(x, y, k);
    }

  // Gran óvalo rosado del hocico, justo debajo de los ojos
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const dx = (x + 0.5 - cx) / snout.rx;
      const dy = (y + 0.5 - snout.cy) / snout.ry;
      if (dx * dx + dy * dy > 1) continue;
      c.set(x, y, dx * 0.5 + dy * 0.9 > 0.55 ? P.p : P.P);
    }
  // Naricita en la parte alta del hocico y un brillo suave
  both(10, 9, 'N');
  c.set(8, 10, P.n);

  // Ojos pequeños y tranquilos: rayita cerrada de 2 px con la esquina exterior
  // un poco caída (adormilado)
  if (eyes === 'happy') {
    for (const [x, y] of [[6, 8], [7, 7], [8, 8]]) both(x, y, 'E');
  } else if (eyes === 'closed') {
    both(7, 8, 'E');
    both(8, 8, 'E');
  } else {
    both(7, 7, 'E');
    both(8, 7, 'E');
    both(6, 8, 'E');
  }
  if (blush) {
    both(5, 9, 'B');
    both(6, 9, 'B');
  }

  // Bracitos: pequeños bultos más claros a los lados
  both(4, 12, 'l');
  both(4, 13, 'g');

  // Patitas diminutas: solo asoman por debajo del cuerpo
  const footPixels = [[6, 19, 'O'], [7, 19, 'F'], [8, 19, 'O']];
  for (const [x, y, k] of footPixels) {
    if (feet !== 'right') c.set(x, y, P[k]); // patita izquierda
    if (feet !== 'left') c.set(mirror(x), y, P[k]); // patita derecha
  }

  // Cola: queda oculta detrás del cuerpo en la vista frontal (a esta escala una
  // puntita suelta parecía un guion despegado). El color `T` se reserva para
  // las animaciones de perfil, donde sí asomará.

  return c;
}
