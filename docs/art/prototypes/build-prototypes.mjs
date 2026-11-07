/**
 * Prototipos estáticos de personajes (Etapa 2A).
 *
 *   node docs/art/prototypes/build-prototypes.mjs
 *
 * Genera en esta carpeta:
 *   lia-prototype.png        sprite nativo 20×28 (transparente)
 *   ratencio-prototype.png   sprite nativo 22×20 (transparente)
 *   comparison.png           provisional vs prototipo, ampliado ×8 (nearest-neighbor)
 *   park-preview.png         el parque con los prototipos, ×4
 *   park-preview-before.png  el mismo encuadre con los sprites provisionales, ×4
 *
 * No modifica nada del juego: solo lee el fondo, los props y los sprites provisionales.
 * El arte está definido aquí (ASCII + formas) para poder retocar colores y formas.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createCanvas, crop, drawImage, fromAscii, hex, readPNG, scaleNearest, writePNG } from '../tools/png.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const ASSETS = join(ROOT, 'public', 'assets');
const { WORLD } = await import(pathToFileURL(join(ROOT, 'src', 'config', 'world.js')).href);

// =====================================================================
// LÍA — 20×28
// Referencias: piel tostada cálida, pelo negro liso con raya casi al centro
// y caída por delante de los hombros, ojos oscuros grandes con delineado
// negro marcado, mejillas sonrojadas. Blusa rosada, chaqueta negra,
// pantalón oscuro.
// =====================================================================
const LIA_PALETTE = {
  O: hex('#1a1216'), // contorno
  H: hex('#2a1f24'), // pelo
  h: hex('#46363e'), // brillo del pelo
  S: hex('#c68a62'), // piel
  s: hex('#a46c4a'), // piel en sombra (cuello, mentón)
  E: hex('#140c10'), // delineado / pestañas
  I: hex('#3b241c'), // iris café oscuro
  W: hex('#f4ece6'), // brillo del ojo
  B: hex('#d8736f'), // rubor
  M: hex('#a94a54'), // boca
  P: hex('#f3b3c3'), // blusa
  p: hex('#dd93a8'), // blusa en sombra
  J: hex('#3a3747'), // chaqueta negra
  j: hex('#545066'), // brillo de la chaqueta
  K: hex('#3d3a52'), // pantalón
  k: hex('#2c2a3d'), // pantalón en sombra
  F: hex('#2a2028'), // zapatos
};

const LIA = [
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
  '.OHhHJJPPPPPPJJHhHO.',
  '.OHhHJjPPpPPPJJHhHO.',
  '.OHHHJJPPPPPPJJHHHO.',
  '.OHHOJJPPPPPPJJOHHO.',
  '..OOOJJPPPPPpJJOOO..',
  '....OSJPPPPPpJSO....',
  '....OOKKKKKKKKOO....',
  '.....OKKKKKKKkO.....',
  '.....OKKKkkKKkO.....',
  '.....OKKkOOKKkO.....',
  '.....OFFFOOFFFO.....',
  '.....OOOOOOOOOO.....',
];

// =====================================================================
// RATENCIO — 22×20
// Referencia: peluche gris con forma de pera/huevo (estrecho arriba,
// ancho abajo), ojos cerrados en arco, orejitas redondas, gran círculo
// rosado en la barriga, bracitos cortos, patitas mínimas y cola fina.
// =====================================================================
const RAT = {
  O: hex('#4b4453'), // contorno
  G: hex('#a3a0aa'), // gris
  g: hex('#8a8694'), // gris en sombra
  l: hex('#bebbc4'), // gris iluminado
  r: hex('#8b6e64'), // interior de la oreja
  P: hex('#eba7b2'), // barriga rosada
  p: hex('#d98e9c'), // barriga en sombra
  N: hex('#d9808f'), // naricita
  B: hex('#ef9fae'), // rubor
  E: hex('#3e3644'), // ojos cerrados
  F: hex('#c9a7ad'), // patitas
  T: hex('#9c8088'), // cola
};

function buildRatencio() {
  const W = 22;
  const H = 20;
  const c = createCanvas(W, H);

  // Orejas: cúpulas redondas pequeñas, dibujadas a mano (a esta escala un
  // círculo calculado sale en forma de "X"). El cuerpo las tapa por abajo.
  const EAR_LEFT = [
    [6, 3, 'O'], [7, 3, 'O'],
    [5, 4, 'O'], [6, 4, 'r'], [7, 4, 'G'], [8, 4, 'O'],
    [5, 5, 'O'], [6, 5, 'G'], [7, 5, 'G'], [8, 5, 'O'],
  ];
  for (const [x, y, k] of EAR_LEFT) {
    c.set(x, y, RAT[k]);
    c.set(W - 1 - x, y, RAT[k]); // oreja derecha en espejo
  }

  // Cuerpo en forma de huevo: más estrecho arriba
  const top = 4;
  const bottom = 18;
  const cx = 11;
  const cy = (top + bottom) / 2;
  const ry = (bottom - top) / 2;
  const rx = 8;
  const inBody = (x, y) => {
    const py = y + 0.5;
    const t = Math.min(1, Math.max(0, (py - top) / (bottom - top)));
    const f = 0.7 + 0.32 * t;
    return ((x + 0.5 - cx) / (rx * f)) ** 2 + ((py - cy) / ry) ** 2 <= 1;
  };
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!inBody(x, y)) continue;
      const edge = !inBody(x - 1, y) || !inBody(x + 1, y) || !inBody(x, y - 1) || !inBody(x, y + 1);
      if (edge) {
        c.set(x, y, RAT.O);
        continue;
      }
      const nx = (x + 0.5 - cx) / rx;
      const ny = (y + 0.5 - cy) / ry;
      let col = RAT.G;
      if (nx + ny < -0.95) col = RAT.l;
      else if (nx * 0.8 + ny * 0.6 > 0.62 || !inBody(x + 2, y)) col = RAT.g;
      c.set(x, y, col);
    }

  // Barriga rosada (círculo grande)
  const bcx = 11;
  const bcy = 13.4;
  const br = 3.9;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const d = Math.hypot(x + 0.5 - bcx, y + 0.5 - bcy);
      if (d <= br && inBody(x, y) && c.get(x, y)[0] !== RAT.O[0]) {
        const shade = (x + 0.5 - bcx) * 0.6 + (y + 0.5 - bcy) * 0.8 > 2.0;
        c.set(x, y, shade ? RAT.p : RAT.P);
      }
    }

  // Bracitos (pequeños bultos más claros a los lados de la barriga)
  for (const [x, y] of [[5, 12], [5, 13], [16, 12], [16, 13]]) c.set(x, y, RAT.l);
  for (const [x, y] of [[5, 14], [16, 14]]) c.set(x, y, RAT.g);

  // Cara: ojos cerrados en arco, naricita, rubor
  for (const [x, y] of [[6, 8], [7, 9], [8, 8], [13, 8], [14, 9], [15, 8]]) c.set(x, y, RAT.E);
  for (const [x, y] of [[10, 10], [11, 10]]) c.set(x, y, RAT.N);
  for (const [x, y] of [[5, 10], [6, 10], [15, 10], [16, 10]]) c.set(x, y, RAT.B);

  // Patitas
  for (const fx of [6, 12]) {
    c.set(fx, 18, RAT.O);
    c.set(fx + 1, 18, RAT.F);
    c.set(fx + 2, 18, RAT.F);
    c.set(fx + 3, 18, RAT.O);
    for (let i = 0; i < 4; i++) c.set(fx + i, 19, RAT.O);
  }

  // Cola fina que sale por detrás, abajo a la derecha, y se curva hacia arriba
  for (const [x, y] of [[16, 16], [17, 17], [18, 17], [19, 16], [20, 15], [20, 14]]) c.set(x, y, RAT.T);

  return c;
}

// =====================================================================
// Salidas
// =====================================================================
const lia = fromAscii(LIA, LIA_PALETTE);
const ratencio = buildRatencio();
writePNG(join(HERE, 'lia-prototype.png'), lia);
writePNG(join(HERE, 'ratencio-prototype.png'), ratencio);

// Sprites provisionales (frame 0 de cada hoja de 16×20)
const sheet = (id) => crop(readPNG(join(ASSETS, 'sprites', `${id}.png`)), 0, 0, 16, 20);
const old = { miguel: sheet('miguel'), lia: sheet('lia'), miguelito: sheet('miguelito'), ratencio: sheet('ratencio') };

// ---- Comparación ampliada: provisional | prototipo, apoyados en la misma línea de suelo
{
  const items = [old.lia, lia, old.ratencio, ratencio];
  const gap = 6;
  const pad = 4;
  const baseH = Math.max(...items.map((i) => i.h));
  const w = items.reduce((s, i) => s + i.w, 0) + gap * (items.length - 1) + pad * 2 + 8;
  const h = baseH + pad * 2;
  const board = createCanvas(w, h, hex('#8dcf70'));
  board.rect(0, h - pad, w, pad, hex('#7cc265'));
  // separador entre Lía y Ratencio
  let x = pad;
  items.forEach((img, i) => {
    if (i === 2) {
      board.rect(x - gap / 2 + 1, 0, 2, h, hex('#fffaf2', 160));
      x += 8;
    }
    drawImage(board, img, x, h - pad - img.h);
    x += img.w + gap;
  });
  writePNG(join(HERE, 'comparison.png'), scaleNearest(board, 8));
}

// ---- Vista previa en el parque
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

  // Todo lo que tiene profundidad se ordena por su "y" (igual que en el juego)
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
  // Origen como en el juego: centro horizontal en píxel entero, base abajo
  for (const d of drawables) drawImage(scene, d.img, d.x - Math.floor(d.img.w / 2), d.y - d.img.h);
  return scaleNearest(scene, 4);
}

const positions = {
  miguel: { x: 138, y: 146 },
  lia: { x: 156, y: 146 },
  miguelito: { x: 96, y: 98 },
  ratencio: { x: 216, y: 104 },
};
const cast = (lookup) => Object.entries(positions).map(([id, p]) => ({ ...p, img: lookup[id] }));
writePNG(join(HERE, 'park-preview.png'), renderPark(cast({ ...old, lia, ratencio })));
writePNG(join(HERE, 'park-preview-before.png'), renderPark(cast(old)));

console.log(`Lía ${lia.w}×${lia.h}, Ratencio ${ratencio.w}×${ratencio.h} → ${HERE}`);
