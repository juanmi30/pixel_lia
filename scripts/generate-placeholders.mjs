/**
 * Genera los sprites PROVISIONALES de "Nuestro lugarcito" como PNG reales.
 *
 *   npm run placeholders            -> crea solo los archivos que falten
 *   npm run placeholders -- --force -> regenera (¡sobrescribe!) todos
 *
 * No tiene dependencias: dibuja en un buffer RGBA y lo codifica como PNG con zlib.
 * Los PNG resultantes respetan el formato descrito en README.md, así que pueden
 * reemplazarse por arte definitivo con las mismas dimensiones de frame.
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets');
const FORCE = process.argv.includes('--force');

// ---------------------------------------------------------------------------
// PNG + lienzo mínimo
// ---------------------------------------------------------------------------
const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePNG(canvas) {
  const { w, h, data } = canvas;
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bits por canal
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0; // filtro "none"
    data.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function hex(color, alpha = 255) {
  const n = parseInt(color.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, alpha];
}

function createCanvas(w, h) {
  const data = Buffer.alloc(w * h * 4);
  return {
    w,
    h,
    data,
    set(x, y, rgba) {
      if (x < 0 || y < 0 || x >= w || y >= h || !rgba) return;
      const i = (y * w + x) * 4;
      data[i] = rgba[0];
      data[i + 1] = rgba[1];
      data[i + 2] = rgba[2];
      data[i + 3] = rgba[3];
    },
    rect(x, y, rw, rh, rgba) {
      for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) this.set(x + i, y + j, rgba);
    },
  };
}

/** Dibuja arte ASCII: cada carácter se traduce con la paleta ('.' = transparente). */
function drawAscii(canvas, rows, palette, ox = 0, oy = 0) {
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === '.' || ch === ' ') return;
      const color = palette[ch];
      if (!color) throw new Error(`Carácter sin color en la paleta: "${ch}"`);
      canvas.set(ox + x, oy + y, color);
    });
  });
}

function checkRows(name, rows, width, height) {
  if (rows.length !== height) throw new Error(`${name}: ${rows.length} filas, se esperaban ${height}`);
  rows.forEach((r, i) => {
    if (r.length !== width) throw new Error(`${name}: la fila ${i} mide ${r.length}, se esperaban ${width}: "${r}"`);
  });
}

// Pseudoaleatorio determinista para que el resultado sea siempre el mismo.
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash2(x, y, seed = 1) {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function valueNoise(x, y, scale, seed) {
  const gx = Math.floor(x / scale);
  const gy = Math.floor(y / scale);
  const fx = x / scale - gx;
  const fy = y / scale - gy;
  const s = (t) => t * t * (3 - 2 * t);
  const a = hash2(gx, gy, seed);
  const b = hash2(gx + 1, gy, seed);
  const c = hash2(gx, gy + 1, seed);
  const d = hash2(gx + 1, gy + 1, seed);
  const top = a + (b - a) * s(fx);
  const bot = c + (d - c) * s(fx);
  return top + (bot - top) * s(fy);
}

const written = [];
function save(relPath, canvas) {
  const file = join(ROOT, relPath);
  if (existsSync(file) && !FORCE) {
    console.log(`  · ${relPath} ya existe (se conserva; usa --force para regenerar)`);
    return;
  }
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, encodePNG(canvas));
  written.push(relPath);
}

// ---------------------------------------------------------------------------
// Personajes: hojas de 9 frames de 16x20 (ver README para el formato)
// ---------------------------------------------------------------------------
const FW = 16;
const FH = 20;

const LEGS = {
  stand: ['....oLo..oLo....', '....oKo..oKo....'],
  left: ['...oLo...oLo....', '...oKo....oo....'],
  right: ['....oLo...oLo...', '....oo....oKo...'],
};
const legs = (variant, L, K) => LEGS[variant].map((r) => r.replaceAll('L', L).replaceAll('K', K));

const shiftDown = (rows) => ['.'.repeat(FW), ...rows.slice(0, rows.length - 1)];
const shiftUp = (rows) => [...rows.slice(1), '.'.repeat(FW)];

function blink(rows, fill) {
  const i = rows.findIndex((r) => r.includes('e'));
  if (i === -1) return rows;
  const out = [...rows];
  out[i] = out[i].replaceAll('e', fill);
  return out;
}
const blushStrong = (rows) => rows.map((r) => r.replaceAll('b', 'B'));

/** Construye los 9 frames estándar a partir del cuerpo (18 filas) y las piernas. */
function buildCharacterFrames({ body, legColor, footColor, blinkFill }) {
  const stand = [...body, ...legs('stand', legColor, footColor)];
  const left = [...body, ...legs('left', legColor, footColor)];
  const right = [...body, ...legs('right', legColor, footColor)];
  const breathe = [...shiftDown(body), ...legs('stand', legColor, footColor)];
  const happy = blushStrong(blink(stand, blinkFill));
  return [
    stand, //            0 idle
    breathe, //          1 idle (respira)
    left, //             2 caminar
    shiftUp(stand), //   3 caminar (rebote)
    right, //            4 caminar
    shiftUp(stand), //   5 caminar (rebote)
    happy, //            6 reacción
    shiftUp(happy), //   7 reacción (saltito)
    blink(stand, blinkFill), // 8 parpadeo
  ];
}

const CHARACTERS = {
  miguel: {
    palette: {
      o: hex('#2b1d2a'), h: hex('#3b2a24'), s: hex('#f2c7a5'), e: hex('#2b1d2a'),
      b: hex('#f2a5a0'), B: hex('#ef7f86'), c: hex('#5b8fd9'), C: hex('#4a76b8'),
      p: hex('#3d4a6b'), k: hex('#5a3a2a'),
    },
    legColor: 'p', footColor: 'k', blinkFill: 's',
    body: [
      '................',
      '.....oooooo.....',
      '....ohhhhhho....',
      '...ohhhhhhhho...',
      '...ohhhhhhhho...',
      '...ohhsssshho...',
      '...osssssssso...',
      '...osesssseso...',
      '...obessssebo...',
      '....osssssso....',
      '.....oooooo.....',
      '....occcccco....',
      '..oCccccccccCo..',
      '..oCccccccccCo..',
      '..osccccccccso..',
      '...oppppppppo...',
      '...oppppppppo...',
      '...opppoopppo...',
    ],
  },
  lia: {
    palette: {
      o: hex('#2b1d2a'), h: hex('#7a4330'), s: hex('#f5cfb0'), e: hex('#2b1d2a'),
      b: hex('#f5a3a8'), B: hex('#ef7f8e'), c: hex('#f08fb0'), C: hex('#d6739a'),
      F: hex('#fff1a8'), k: hex('#b8506f'),
    },
    legColor: 's', footColor: 'k', blinkFill: 's',
    body: [
      '................',
      '.....oooooo.....',
      '....ohhhhhFo....',
      '...ohhhhhhhFo...',
      '..ohhhhhhhhhho..',
      '..ohhhsssshhho..',
      '..ohssssssssho..',
      '..ohsessssesho..',
      '..ohbessssebho..',
      '..ohhsssssshho..',
      '..ohhoooooohho..',
      '..ohoccccccoho..',
      '..oCccccccccCo..',
      '..osccccccccso..',
      '...occcccccco...',
      '..occcccccccco..',
      '..oCCCCCCCCCCo..',
      '...oooooooooo...',
    ],
  },
  miguelito: {
    palette: {
      o: hex('#3a2418'), m: hex('#8b5a3c'), f: hex('#e8c69a'), e: hex('#2a1a12'),
      b: hex('#f0a39a'), B: hex('#ea7c82'), k: hex('#e8c69a'),
    },
    legColor: 'm', footColor: 'k', blinkFill: 'f',
    body: [
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '.....oooooo.....',
      '....ommmmmmo....',
      '..oomffmmffmoo..',
      '.ofofeffffefofo.',
      '.ofofeffffefofo.',
      '..omfbfoofbfmo..',
      '...omffffffmo...',
      '....ommmmmmo....',
      '..ommmffffmmmo..',
      '..omomffffmomo..',
      '...ommffffmmo...',
      '...ommmmmmmmo...',
    ],
  },
  ratencio: {
    palette: {
      o: hex('#3d3550'), g: hex('#a9a6b8'), w: hex('#e6e1ee'), p: hex('#f4a6b8'),
      e: hex('#2a2438'), b: hex('#f2a0b6'), B: hex('#ee7c9a'), k: hex('#f4a6b8'),
    },
    legColor: 'g', footColor: 'k', blinkFill: 'g',
    body: [
      '................',
      '................',
      '................',
      '................',
      '................',
      '..ooo......ooo..',
      '.ogpgo....ogpgo.',
      '.ogpgoooooogpgo.',
      '..oggggggggggo..',
      '.oggggggggggggo.',
      '.ogggeggggegggo.',
      '.ogbgeggggegbgo.',
      '.ogggggppgggggo.',
      '.oggwwwwwwwwggo.',
      'oggwwwwwwwwwwggo',
      'oggwwwwwwwwwwggo',
      '.oggwwwwwwwwggo.',
      '..oggggggggggopp',
    ],
  },
};

for (const [id, def] of Object.entries(CHARACTERS)) {
  checkRows(id, def.body, FW, 18);
  const frames = buildCharacterFrames(def);
  const sheet = createCanvas(FW * frames.length, FH);
  frames.forEach((rows, i) => {
    checkRows(`${id} frame ${i}`, rows, FW, FH);
    drawAscii(sheet, rows, def.palette, i * FW, 0);
  });
  save(`sprites/${id}.png`, sheet);
}

// ---------------------------------------------------------------------------
// Efectos: emotes (9x9) y sombra
// ---------------------------------------------------------------------------
{
  const pal = {
    o: hex('#7a2141'), R: hex('#ff5c8a'), W: hex('#ffd6e2'), N: hex('#6b4c9a'),
    Y: hex('#ffd84d'), y: hex('#fff6c2'), r: hex('#ff7aa2'),
  };
  const frames = [
    // 0 corazón
    ['.........', '.oo...oo.', 'oRRo.oRRo', 'oRWRoRRRo', 'oRRRRRRRo', '.oRRRRRo.', '..oRRRo..', '...oRo...', '....o....'],
    // 1 nota musical
    ['.....NN..', '.....N.N.', '.....N..N', '.....N...', '.....N...', '..NNNN...', '.NNNNN...', '.NNNN....', '..NN.....'],
    // 2 brillito
    ['....Y....', '....Y....', '...YyY...', 'YYYyyyYYY', '...YyY...', '....Y....', '....Y....', '.........', '.........'],
    // 3 corazoncito
    ['.........', '.........', '..rr.rr..', '..rrrrr..', '...rrr...', '....r....', '.........', '.........', '.........'],
  ];
  const sheet = createCanvas(9 * frames.length, 9);
  frames.forEach((rows, i) => {
    checkRows(`emote ${i}`, rows, 9, 9);
    drawAscii(sheet, rows, pal, i * 9, 0);
  });
  save('fx/emotes.png', sheet);

  const shadow = createCanvas(12, 4);
  drawAscii(shadow, ['..XXXXXXXX..', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX', '..XXXXXXXX..'], {
    X: hex('#1d3b2a', 70),
  });
  save('fx/shadow.png', shadow);
}

// ---------------------------------------------------------------------------
// Props: árbol (2 variantes), arbusto, banco, flores
// ---------------------------------------------------------------------------
function drawBlob(canvas, ox, oy, circles, colors, seed, blossom = false) {
  const inside = (x, y) => circles.some(([cx, cy, r]) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r);
  for (let y = 0; y < canvas.h; y++) {
    for (let x = 0; x < canvas.w; x++) {
      if (!inside(x, y)) continue;
      const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
      if (edge) {
        canvas.set(ox + x, oy + y, colors.outline);
        continue;
      }
      const t = x * 0.35 + y * 0.6 + hash2(x, y, seed) * 4;
      const minY = Math.min(...circles.map(([, cy, r]) => cy - r));
      const maxY = Math.max(...circles.map(([, cy, r]) => cy + r));
      const rel = (t - minY * 0.6) / ((maxY - minY) * 0.6 + 10);
      let c = rel < 0.35 ? colors.light : rel < 0.75 ? colors.mid : colors.dark;
      if (blossom && hash2(x, y, seed + 9) > 0.86 && rel < 0.8) c = hash2(x, y, 3) > 0.5 ? colors.flower : colors.flower2;
      canvas.set(ox + x, oy + y, c);
    }
  }
}

{
  const leaves = {
    outline: hex('#2f5e3a'), light: hex('#9fdc76'), mid: hex('#6fba57'), dark: hex('#4e9448'),
    flower: hex('#ffc2d9'), flower2: hex('#ff9ec4'),
  };
  const trunk = { o: hex('#4a2f23'), t: hex('#8a5a3b'), T: hex('#a8714b'), X: hex('#1d3b2a', 70) };
  const TW = 32;
  const TH = 44;
  const sheet = createCanvas(TW * 2, TH);
  for (let v = 0; v < 2; v++) {
    const tile = createCanvas(TW, TH);
    // sombra
    for (let y = 39; y < 44; y++)
      for (let x = 0; x < TW; x++) if (((x - 16) / 12) ** 2 + ((y - 41) / 2.6) ** 2 <= 1) tile.set(x, y, trunk.X);
    // tronco
    drawAscii(
      tile,
      [
        '.otTto.', '.otTto.', '.otTto.', '.otTto.', '.otTto.', '.otTto.', '.otTto.', '.otTto.',
        '.otTto.', '.otTto.', '.otTto.', '.otTto.', 'ottTtto', 'ottTtto', 'ooooooo',
      ],
      trunk,
      13,
      27,
    );
    drawBlob(tile, 0, 0, [[16, 13, 12], [8, 19, 7], [24, 19, 7], [16, 22, 8]], leaves, 11 + v * 7, v === 1);
    for (let y = 0; y < TH; y++)
      for (let x = 0; x < TW; x++) {
        const i = (y * TW + x) * 4;
        if (tile.data[i + 3]) sheet.set(v * TW + x, y, [...tile.data.subarray(i, i + 4)]);
      }
  }
  save('props/tree.png', sheet);

  const bush = createCanvas(22, 14);
  for (let x = 2; x < 20; x++) for (let y = 11; y < 14; y++) if (((x - 11) / 9) ** 2 + ((y - 12) / 1.6) ** 2 <= 1) bush.set(x, y, trunk.X);
  drawBlob(bush, 0, 0, [[7, 7, 5], [14, 6, 6], [11, 9, 4]], { ...leaves }, 5, true);
  save('props/bush.png', bush);

  // Banco
  const bench = createCanvas(28, 17);
  const O = hex('#4a2f23');
  const L = hex('#d39563');
  const W = hex('#b9764a');
  const D = hex('#8e5534');
  const S = hex('#1d3b2a', 70);
  bench.rect(1, 14, 26, 3, S);
  // patas
  for (const lx of [3, 22]) {
    bench.rect(lx, 9, 3, 7, O);
    bench.rect(lx + 1, 9, 1, 6, D);
  }
  // respaldo
  bench.rect(1, 0, 26, 7, O);
  bench.rect(2, 1, 24, 2, L);
  bench.rect(2, 2, 24, 1, W);
  bench.rect(2, 3, 24, 1, D);
  bench.rect(2, 4, 24, 2, W);
  bench.rect(2, 4, 24, 1, L);
  // asiento
  bench.rect(0, 7, 28, 5, O);
  bench.rect(1, 8, 26, 1, L);
  bench.rect(1, 9, 26, 2, W);
  bench.rect(1, 11, 26, 1, D);
  save('props/bench.png', bench);

  // Flores: 4 colores x 2 frames (balanceo), 7x8
  const flowerRows = ['.......', '...P...', '..PCP..', '...P...', '...g...', '..gg...', '...gg..', '...g...'];
  const swayRows = ['.......', '....P..', '...PCP.', '....P..', '....g..', '..gg...', '...gg..', '...g...'];
  const variants = [
    ['#f49ac1', '#ffe36e'],
    ['#ffffff', '#f7c948'],
    ['#b79cf2', '#fff1a8'],
    ['#ffd84d', '#f08a4b'],
  ];
  const flowers = createCanvas(7 * 8, 8);
  variants.forEach(([petal, center], v) => {
    const pal = { P: hex(petal), C: hex(center), g: hex('#3f8a45') };
    drawAscii(flowers, flowerRows, pal, v * 14, 0);
    drawAscii(flowers, swayRows, pal, v * 14 + 7, 0);
  });
  save('props/flowers.png', flowers);
}

// ---------------------------------------------------------------------------
// Fondo del parque 320x180
// ---------------------------------------------------------------------------
{
  const W = 320;
  const H = 180;
  const bg = createCanvas(W, H);
  const rand = rng(42);
  const grass = [hex('#84c96a'), hex('#8dcf70'), hex('#7cc265')];
  const tuftDark = hex('#5f9f4f');
  const tuftLight = hex('#a8e07f');
  const dirt = hex('#e6c995');
  const dirtDark = hex('#d2ad78');
  const dirtEdge = hex('#b48b5a');
  const pebble = hex('#c5a374');
  const water = hex('#73c6e3');
  const waterDeep = hex('#5aaed4');
  const waterEdge = hex('#3f7f9e');
  const shore = hex('#cdb98a');
  const shine = hex('#e3f7ff');

  const pathCenter = (x) => 120 + 9 * Math.sin(x / 46 + 0.6);
  const PATH_HALF = 8;
  const pond = { cx: 276, cy: 32, rx: 36, ry: 14 };
  const pondD = (x, y) => ((x - pond.cx) / pond.rx) ** 2 + ((y - pond.cy) / pond.ry) ** 2;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const n = valueNoise(x, y, 22, 7) * 0.7 + valueNoise(x, y, 7, 3) * 0.3;
      bg.set(x, y, n < 0.42 ? grass[2] : n < 0.62 ? grass[0] : grass[1]);

      const d = Math.abs(y - pathCenter(x));
      if (d <= PATH_HALF) {
        const edge = d > PATH_HALF - 1;
        const dn = valueNoise(x, y, 5, 21);
        bg.set(x, y, edge ? dirtEdge : dn < 0.35 ? dirtDark : dirt);
      }

      const pd = pondD(x, y);
      if (pd <= 1.25 && pd > 1) bg.set(x, y, shore);
      if (pd <= 1) bg.set(x, y, pd > 0.86 ? waterEdge : pd < 0.45 ? waterDeep : water);
    }
  }
  // brillos en el agua
  for (const [x, y, len] of [[262, 28, 6], [284, 36, 4], [270, 38, 3], [292, 26, 3]]) bg.rect(x, y, len, 1, shine);

  // piedritas en el camino
  for (let i = 0; i < 60; i++) {
    const x = Math.floor(rand() * W);
    const y = Math.round(pathCenter(x) + (rand() * 2 - 1) * (PATH_HALF - 2));
    bg.set(x, y, pebble);
  }
  // matitas de pasto
  for (let i = 0; i < 260; i++) {
    const x = Math.floor(rand() * W);
    const y = Math.floor(rand() * H);
    if (Math.abs(y - pathCenter(x)) <= PATH_HALF + 1 || pondD(x, y) <= 1.4) continue;
    const c = rand() < 0.7 ? tuftDark : tuftLight;
    bg.set(x, y, c);
    bg.set(x - 1, y - 1, c);
    bg.set(x + 1, y - 1, c);
  }
  save('background/park.png', bg);
}

console.log(written.length ? `Generados:\n${written.map((f) => `  + ${f}`).join('\n')}` : 'No se generó nada nuevo.');
