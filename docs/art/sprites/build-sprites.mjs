/**
 * Hojas animadas definitivas de los cuatro personajes (Etapa 2D).
 *
 *   npm run sprites
 *
 * Parte del arte APROBADO (docs/art/prototypes/characters/*.mjs) y genera los
 * 9 fotogramas del contrato del juego como pequeñas variaciones del reposo:
 *
 *   0    reposo (idéntico al prototipo aprobado; se verifica al generar)
 *   1    respiración
 *   2-5  caminata: paso izquierdo, paso intermedio, paso derecho, paso intermedio
 *   6-7  reacción alegre
 *   8    parpadeo
 *
 * Reglas: píxeles enteros, sin suavizado, y los pies siempre apoyados en la
 * última fila del frame (el punto de apoyo del juego). El saltito al tocar lo
 * hace el juego con un tween; aquí no se despega a nadie del suelo.
 *
 * Escribe:
 *   public/assets/sprites/<id>.png         hojas que usa Phaser (9 frames en fila)
 *   docs/art/sprites/<id>-frames.png       los 9 fotogramas ampliados ×8
 *   docs/art/sprites/animations-preview.gif   los cuatro en reposo, caminando y reaccionando
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas, drawImage, fromAscii, hex, readPNG, scaleNearest, writePNG } from '../tools/png.mjs';
import { writeGIF } from '../tools/gif.mjs';
import * as miguelArt from '../prototypes/characters/miguel.mjs';
import * as liaArt from '../prototypes/characters/lia.mjs';
import * as miguelitoArt from '../prototypes/characters/miguelito.mjs';
import * as ratencioArt from '../prototypes/characters/ratencio.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const SPRITES = join(ROOT, 'public', 'assets', 'sprites');
const PROTOTYPES = join(HERE, '..', 'prototypes');

// ------------------------------------------------------------------ utilidades ASCII

/** Sustituye trozos de filas: [fila, columna, 'texto']. */
function patch(rows, edits = []) {
  const out = [...rows];
  for (const [r, c, str] of edits) {
    const row = out[r];
    if (c < 0 || c + str.length > row.length) throw new Error(`Parche fuera de la fila ${r}: "${str}" en ${c}`);
    out[r] = row.slice(0, c) + str + row.slice(c + str.length);
  }
  return out;
}

/** Baja 1 px las filas `from..to` (la fila `to + 1` queda tapada; la `from` queda vacía). */
function lower(rows, from, to) {
  const out = [...rows];
  for (let r = to + 1; r > from; r--) out[r] = rows[r - 1];
  out[from] = '.'.repeat(rows[0].length);
  return out;
}

/** Aplica en orden una lista de transformaciones a las filas. */
const compose = (rows, ...steps) => steps.reduce((acc, step) => step(acc), rows);
const edits = (list) => (rows) => patch(rows, list);

// ------------------------------------------------------------------ MIGUEL
// Caminar tranquilo: pies alternos, balanceo de manos y un pequeño rebote de la
// cabeza (que mueve el pelo) en los pasos intermedios. Reacción: ojos felices,
// rubor más intenso y manos arriba.
const MIGUEL = (() => {
  const A = miguelArt.ART;
  const head = (rows) => lower(rows, 0, 14);
  const legsLeftUp = edits([[25, 5, 'OFFFOOJJJO'], [26, 5, 'OOOOOOFFFO'], [27, 5, '.....OOOOO']]);
  const legsRightUp = edits([[25, 5, 'OJJJOOFFFO'], [26, 5, 'OFFFOOOOOO'], [27, 5, 'OOOOO.....']]);
  const rightHandUp = edits([[20, 14, 'SS'], [21, 14, 'CC']]);
  const leftHandUp = edits([[20, 4, 'SS'], [21, 4, 'CC']]);
  const happyEyes = edits([[9, 6, 'SS'], [9, 12, 'SS'], [11, 5, 'B'], [11, 14, 'B']]);
  const blink = edits([[9, 6, 'SS'], [9, 12, 'SS']]);
  const handsUp1 = edits([[20, 4, 'SS'], [20, 14, 'SS'], [21, 4, 'CC'], [21, 14, 'CC']]);
  const handsUp2 = edits([[19, 4, 'SS'], [19, 14, 'SS'], [20, 4, 'CC'], [20, 14, 'CC'], [21, 4, 'CC'], [21, 14, 'CC']]);
  return {
    id: 'miguel',
    palette: { ...miguelArt.PALETTE, B: hex('#e8806e') },
    frames: [
      A,
      head(A),
      compose(A, legsLeftUp, rightHandUp),
      head(A),
      compose(A, legsRightUp, leftHandUp),
      head(A),
      compose(A, happyEyes, handsUp1),
      compose(A, happyEyes, handsUp2, head),
      blink(A),
    ],
  };
})();

// ------------------------------------------------------------------ LÍA
// Caminata suave: pies alternos, manos que asoman de la chaqueta al balancearse
// y el pelo largo que acompaña el rebote de la cabeza. Reacción: ojos cerrados
// felices (queda el delineado) y manitos arriba. La piel no cambia nunca.
const LIA = (() => {
  const A = liaArt.ART;
  const head = (rows) => lower(rows, 0, 14);
  const legsLeftUp = edits([[25, 5, 'OFFFOOKKkO'], [26, 5, 'OOOOOOFFFO'], [27, 5, '.....OOOOO']]);
  const legsRightUp = edits([[25, 5, 'OKKkOOFFFO'], [26, 5, 'OFFFOOOOOO'], [27, 5, 'OOOOO.....']]);
  const rightHandUp = edits([[20, 14, 'S'], [21, 14, 'J']]);
  const leftHandUp = edits([[20, 5, 'S'], [21, 5, 'J']]);
  const closedEyes = edits([[10, 6, 'SS'], [10, 12, 'SS'], [11, 6, 'SS'], [11, 12, 'SS']]);
  const handsUp1 = edits([[20, 5, 'S'], [20, 14, 'S'], [21, 5, 'J'], [21, 14, 'J']]);
  const handsUp2 = edits([[19, 5, 'S'], [19, 14, 'S'], [20, 5, 'j'], [20, 14, 'j'], [21, 5, 'J'], [21, 14, 'J']]);
  // Puntas del pelo que se mecen en los pasos
  const hairSwayL = edits([[20, 2, '.OO'], [19, 1, 'OH']]);
  const hairSwayR = edits([[20, 15, 'OO.'], [19, 17, 'HO']]);
  return {
    id: 'lia',
    palette: liaArt.PALETTE,
    frames: [
      A,
      head(A),
      compose(A, legsLeftUp, rightHandUp, hairSwayR),
      head(A),
      compose(A, legsRightUp, leftHandUp, hairSwayL),
      head(A),
      compose(A, closedEyes, handsUp1),
      compose(A, closedEyes, handsUp2, head),
      closedEyes(A),
    ],
  };
})();

// ------------------------------------------------------------------ MIGUELITO
// Pasitos cortos y juguetones: pies alternos con las orejas que saltan, y la
// cabeza que rebota en los pasos intermedios. Reacción muy expresiva: ojos
// felices, boca abierta y orejas que aletean.
const MIGUELITO = (() => {
  const A = miguelitoArt.ART;
  const squash = (rows) => lower(rows, 0, 13);
  const earsUp = edits([
    [4, 0, '.OO'], [5, 0, 'OFF'], [6, 0, 'OFf'], [7, 0, 'OFf'], [8, 0, '.OO'], [9, 0, '...'],
    [4, 17, 'OO.'], [5, 17, 'FFO'], [6, 17, 'fFO'], [7, 17, 'fFO'], [8, 17, 'OO.'], [9, 17, '...'],
  ]);
  const leftFootUp = edits([[17, 0, '.OFFFOFFFOMMMMOFFFO.'], [18, 0, '.OFFfOOOOOOFFFOfFFO.'], [19, 0, '..OOOO....OOOOOOOO..']]);
  const rightFootUp = edits([[17, 0, '.OFFFOMMMMOFFFOFFFO.'], [18, 0, '.OFFfOFFFOOOOOOfFFO.'], [19, 0, '..OOOOOOOO....OOOO..']]);
  const blink = edits([[5, 6, 'FF'], [5, 12, 'FF']]);
  const openMouth = edits([[12, 7, 'NNNNNN']]);
  return {
    id: 'miguelito',
    palette: miguelitoArt.PALETTE,
    frames: [
      A,
      squash(A),
      compose(A, leftFootUp, earsUp),
      squash(A),
      compose(A, rightFootUp, earsUp),
      squash(A),
      compose(A, blink, openMouth, earsUp),
      compose(A, blink, openMouth, squash),
      blink(A),
    ],
  };
})();

// ------------------------------------------------------------------ RATENCIO
// Lento y bamboleante: se inclina a un lado y al otro levantando la patita del
// lado contrario; en los pasos intermedios la cúpula baja 1 px. La respiración
// le infla un poquito la parte de abajo. Reacción: ojitos felices, rubor y se
// infla de contento. La silueta y el hocico no se estiran.
function ratencioFrames() {
  const r = (opts) => ratencioArt.build(opts);
  const lean = (canvas, dx) => {
    // Desplaza en horizontal la parte alta (cabeza y hocico, filas 0-14); el resto queda quieto.
    const out = createCanvas(canvas.w, canvas.h);
    for (let y = 0; y < canvas.h; y++)
      for (let x = 0; x < canvas.w; x++) {
        const sx = y <= 14 ? x - dx : x;
        out.set(x, y, canvas.get(sx, y));
      }
    // Rellena el escalón que deja el desplazamiento en la fila 14/15 con el contorno.
    for (let x = 0; x < canvas.w; x++) {
      const above = out.get(x, 14);
      const below = out.get(x, 15);
      if (above[3] === 0 && below[3] > 0) out.set(x, 14, ratencioArt.PALETTE.O);
    }
    return out;
  };
  const breathe = { body: { bottomWidth: 1.06 } };
  const step = { body: { top: 4 } };
  return [
    r(),
    r(breathe),
    lean(r({ feet: 'right' }), -1),
    r(step),
    lean(r({ feet: 'left' }), 1),
    r(step),
    r({ eyes: 'happy', blush: true }),
    r({ eyes: 'happy', blush: true, ...breathe }),
    r({ eyes: 'closed' }),
  ];
}

// ------------------------------------------------------------------ salida

const CHARACTERS = [
  { ...MIGUEL, approved: 'miguel-prototype.png' },
  { ...LIA, approved: 'lia-prototype-v2.png' },
  { ...MIGUELITO, approved: 'miguelito-prototype-v2.png' },
  { id: 'ratencio', canvases: ratencioFrames(), approved: 'ratencio-prototype-v2.png' },
];

const sheets = {};
for (const ch of CHARACTERS) {
  const frames = ch.canvases ?? ch.frames.map((rows) => fromAscii(rows, ch.palette));
  const { w, h } = frames[0];

  // Regla principal: el fotograma 0 es idéntico al prototipo aprobado.
  const approved = readPNG(join(PROTOTYPES, ch.approved));
  if (approved.w !== w || approved.h !== h || !approved.data.equals(frames[0].data)) {
    throw new Error(`${ch.id}: el fotograma 0 no coincide con ${ch.approved}`);
  }
  // Los pies siempre tocan la última fila.
  frames.forEach((f, i) => {
    let grounded = false;
    for (let x = 0; x < w; x++) if (f.get(x, h - 1)[3] > 0) grounded = true;
    if (!grounded) throw new Error(`${ch.id}: el fotograma ${i} no apoya en la última fila`);
  });

  const sheet = createCanvas(w * frames.length, h);
  frames.forEach((f, i) => drawImage(sheet, f, i * w, 0));
  writePNG(join(SPRITES, `${ch.id}.png`), sheet);
  sheets[ch.id] = { frames, w, h };

  // Lámina ampliada: los 9 fotogramas con separadores y una línea de suelo
  const pad = 2;
  const board = createCanvas(frames.length * (w + pad) + pad, h + pad * 2 + 2, hex('#8dcf70'));
  board.rect(0, h + pad, board.w, board.h - h - pad, hex('#7cc265'));
  frames.forEach((f, i) => {
    const x = pad + i * (w + pad);
    if (i > 0) board.rect(x - pad + 0, 0, 1, h + pad, hex('#fffaf2', 120));
    drawImage(board, f, x, pad);
  });
  writePNG(join(HERE, `${ch.id}-frames.png`), scaleNearest(board, 8));
  console.log(`${ch.id}: ${frames.length} fotogramas de ${w}×${h} → public/assets/sprites/${ch.id}.png`);
}

// ------------------------------------------------------------------ GIF de vista previa
// Los cuatro en fila: reposo (con parpadeo), caminata y reacción, con los
// mismos ritmos que usa el juego (src/config/characters.js).
{
  const order = ['miguel', 'lia', 'miguelito', 'ratencio'];
  const SEQUENCES = {
    idle: { frames: [0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 8], fps: 4 },
    walk: { frames: [2, 3, 4, 5], fps: { miguel: 8, lia: 8, miguelito: 10, ratencio: 6 } },
    react: { frames: [6, 7], fps: 6 },
  };
  const DURATION = { idle: 3000, walk: 3000, react: 1500 };
  const TICK = 50; // ms por fotograma del GIF
  const scale = 4;
  const gap = 8;
  const W = order.reduce((s, id) => s + sheets[id].w, 0) + gap * (order.length + 1);
  const H = 28 + 8;
  const gifFrames = [];
  for (const [name, dur] of Object.entries(DURATION)) {
    for (let t = 0; t < dur; t += TICK) {
      const board = createCanvas(W, H, hex('#8dcf70'));
      board.rect(0, H - 4, W, 4, hex('#7cc265'));
      let x = gap;
      for (const id of order) {
        const seq = SEQUENCES[name];
        const fps = typeof seq.fps === 'number' ? seq.fps : seq.fps[id];
        const frame = seq.frames[Math.floor((t / 1000) * fps) % seq.frames.length];
        const { frames, w, h } = sheets[id];
        drawImage(board, frames[frame], x, H - 4 - h);
        x += w + gap;
      }
      gifFrames.push(scaleNearest(board, scale));
    }
  }
  writeGIF(join(HERE, 'animations-preview.gif'), gifFrames, TICK);
  console.log(`animations-preview.gif: ${gifFrames.length} fotogramas`);
}
