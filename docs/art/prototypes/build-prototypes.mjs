/**
 * Prototipos estáticos de los cuatro personajes (Etapa 2B).
 *
 *   node docs/art/prototypes/build-prototypes.mjs
 *
 * El arte de cada personaje vive en ./characters/<id>.mjs (paleta + dibujo),
 * para poder retocar colores o formas por separado. Este script genera:
 *
 *   miguel-prototype.png              20×28
 *   lia-prototype-v2.png              20×28
 *   miguelito-prototype-v2.png        20×20 (v2, a partir de la foto del peluche)
 *   ratencio-prototype-v2.png         22×20
 *   all-characters-comparison.png     provisionales (arriba) y prototipos (abajo), ×8
 *   all-characters-park-preview.png   el parque actual con los cuatro prototipos, ×4
 *   miguelito-comparison.png          Miguelito v1 (sin foto) junto a v2, ×8
 *   miguelito-park-preview.png        detalle del parque alrededor de Miguelito v2, ×6
 *
 * No modifica nada del juego: solo lee el fondo, los props y los sprites provisionales.
 * (lia-prototype.png, ratencio-prototype.png y miguelito-prototype.png son
 * versiones anteriores y se conservan como referencia; no se regeneran.)
 */
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createCanvas, crop, drawImage, hex, readPNG, scaleNearest, writePNG } from '../tools/png.mjs';
import * as miguelArt from './characters/miguel.mjs';
import * as liaArt from './characters/lia.mjs';
import * as miguelitoArt from './characters/miguelito.mjs';
import * as ratencioArt from './characters/ratencio.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const ASSETS = join(ROOT, 'public', 'assets');
const { WORLD } = await import(pathToFileURL(join(ROOT, 'src', 'config', 'world.js')).href);

const ORDER = ['miguel', 'lia', 'miguelito', 'ratencio'];

// ---------------------------------------------------------------- sprites
const proto = {
  miguel: miguelArt.build(),
  lia: liaArt.build(),
  miguelito: miguelitoArt.build(),
  ratencio: ratencioArt.build(),
};
const FILES = {
  miguel: 'miguel-prototype.png',
  lia: 'lia-prototype-v2.png',
  miguelito: 'miguelito-prototype-v2.png',
  ratencio: 'ratencio-prototype-v2.png',
};
for (const id of ORDER) writePNG(join(HERE, FILES[id]), proto[id]);

// Sprites provisionales del juego (frame 0 de cada hoja de 16×20)
const sheet = (id) => crop(readPNG(join(ASSETS, 'sprites', `${id}.png`)), 0, 0, 16, 20);
const old = Object.fromEntries(ORDER.map((id) => [id, sheet(id)]));

// ---------------------------------------------------------------- comparación
// Dos filas sobre la misma línea de suelo: provisionales arriba, prototipos abajo.
{
  const gap = 6;
  const pad = 4;
  const rowH = Math.max(...Object.values(proto).map((i) => i.h)) + pad * 2;
  const colW = Math.max(...Object.values(proto).map((i) => i.w));
  const w = pad * 2 + colW * ORDER.length + gap * (ORDER.length - 1);
  const board = createCanvas(w, rowH * 2 + 2, hex('#8dcf70'));
  const ground = hex('#7cc265');
  const drawRow = (images, top) => {
    board.rect(0, top + rowH - pad, w, pad, ground);
    ORDER.forEach((id, i) => {
      const img = images[id];
      const x = pad + i * (colW + gap) + Math.floor((colW - img.w) / 2);
      drawImage(board, img, x, top + rowH - pad - img.h);
    });
  };
  drawRow(old, 0);
  board.rect(0, rowH, w, 2, hex('#fffaf2'));
  drawRow(proto, rowH + 2);
  writePNG(join(HERE, 'all-characters-comparison.png'), scaleNearest(board, 8));
}

// ---------------------------------------------------------------- parque
function renderPark(cast) {
  const scene = readPNG(join(ASSETS, 'background', 'park.png'));
  const tree = readPNG(join(ASSETS, 'props', 'tree.png'));
  const images = {
    tree: [crop(tree, 0, 0, 32, 44), crop(tree, 32, 0, 32, 44)],
    bush: readPNG(join(ASSETS, 'props', 'bush.png')),
    bench: readPNG(join(ASSETS, 'props', 'bench.png')),
  };
  const flowers = readPNG(join(ASSETS, 'props', 'flowers.png'));
  const shadow = readPNG(join(ASSETS, 'fx', 'shadow.png'));

  // Todo lo que tiene profundidad se ordena por su "y", igual que en el juego
  const drawables = [];
  for (const p of WORLD.props) {
    const img = p.texture === 'tree' ? images.tree[p.frame ?? 0] : images[p.texture];
    drawables.push({ y: p.y, img, x: p.x });
  }
  for (const f of WORLD.flowers) drawables.push({ y: f.y - 2, img: crop(flowers, f.v * 14, 0, 7, 8), x: f.x });
  for (const c of cast) {
    drawImage(scene, shadow, c.x - 6, c.y - 3);
    drawables.push({ y: c.y, img: c.img, x: c.x });
  }
  drawables.sort((a, b) => a.y - b.y);
  // Origen como en el juego: centro horizontal en píxel entero, pies en la base
  for (const d of drawables) drawImage(scene, d.img, d.x - Math.floor(d.img.w / 2), d.y - d.img.h);
  return scene;
}

// Escena típica: la pareja junta en el camino (separados 16 px, como quedarían en
// un encuentro con `distance` ≈ 15) y los peluches cerca del banco.
const POSITIONS = {
  miguel: { x: 140, y: 146 },
  lia: { x: 156, y: 146 },
  miguelito: { x: 128, y: 92 },
  ratencio: { x: 188, y: 94 },
};
const park = renderPark(ORDER.map((id) => ({ ...POSITIONS[id], img: proto[id] })));
writePNG(join(HERE, 'all-characters-park-preview.png'), scaleNearest(park, 4));

// ---------------------------------------------------------------- Miguelito v1 / v2
{
  const v1 = readPNG(join(HERE, 'miguelito-prototype.png'));
  const v2 = proto.miguelito;
  const pad = 4;
  const gap = 8;
  const h = Math.max(v1.h, v2.h) + pad * 2;
  const w = pad * 2 + v1.w + gap + v2.w;
  const board = createCanvas(w, h, hex('#8dcf70'));
  board.rect(0, h - pad, w, pad, hex('#7cc265'));
  drawImage(board, v1, pad, h - pad - v1.h);
  drawImage(board, v2, pad + v1.w + gap, h - pad - v2.h);
  writePNG(join(HERE, 'miguelito-comparison.png'), scaleNearest(board, 8));

  // Detalle del parque: Miguelito entre Miguel y Ratencio, a escala de juego ×6
  const { x, y } = POSITIONS.miguelito;
  writePNG(join(HERE, 'miguelito-park-preview.png'), scaleNearest(crop(park, x - 40, y - 34, 112, 66), 6));
}

console.log(ORDER.map((id) => `${id} ${proto[id].w}×${proto[id].h}`).join(', '), '→', HERE);
