/**
 * Utilidades mínimas de imagen para el arte del proyecto (sin dependencias).
 * - Lienzo RGBA con dibujo píxel a píxel.
 * - Lectura y escritura de PNG (8 bits, RGB o RGBA, sin entrelazado).
 * - Ampliación por vecino más cercano (nearest-neighbor) y composición alfa.
 */
import { deflateSync, inflateSync } from 'node:zlib';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export function hex(color, alpha = 255) {
  const n = parseInt(color.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, alpha];
}

export function createCanvas(w, h, fill = null) {
  const data = Buffer.alloc(w * h * 4);
  const canvas = {
    w,
    h,
    data,
    get(x, y) {
      if (x < 0 || y < 0 || x >= w || y >= h) return [0, 0, 0, 0];
      const i = (y * w + x) * 4;
      return [data[i], data[i + 1], data[i + 2], data[i + 3]];
    },
    /** Escribe un píxel sin mezclar. */
    set(x, y, rgba) {
      if (!rgba || x < 0 || y < 0 || x >= w || y >= h) return;
      const i = (y * w + x) * 4;
      data[i] = rgba[0];
      data[i + 1] = rgba[1];
      data[i + 2] = rgba[2];
      data[i + 3] = rgba[3] ?? 255;
    },
    /** Pinta un píxel mezclándolo con lo que hay debajo (alfa "over"). */
    blend(x, y, rgba) {
      if (!rgba || x < 0 || y < 0 || x >= w || y >= h) return;
      const a = (rgba[3] ?? 255) / 255;
      if (a <= 0) return;
      const i = (y * w + x) * 4;
      const ba = data[i + 3] / 255;
      const oa = a + ba * (1 - a);
      for (let c = 0; c < 3; c++) {
        data[i + c] = Math.round((rgba[c] * a + data[i + c] * ba * (1 - a)) / oa);
      }
      data[i + 3] = Math.round(oa * 255);
    },
    rect(x, y, rw, rh, rgba) {
      for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) canvas.set(x + i, y + j, rgba);
    },
  };
  if (fill) canvas.rect(0, 0, w, h, fill);
  return canvas;
}

/** Copia `src` sobre `dst` en (ox, oy) con mezcla alfa. */
export function drawImage(dst, src, ox, oy) {
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) dst.blend(ox + x, oy + y, src.get(x, y));
}

/** Recorta un frame de una hoja de sprites. */
export function crop(src, x0, y0, w, h) {
  const out = createCanvas(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out.set(x, y, src.get(x0 + x, y0 + y));
  return out;
}

/** Amplía por vecino más cercano: cada píxel pasa a ser un bloque k×k. */
export function scaleNearest(src, k) {
  const out = createCanvas(src.w * k, src.h * k);
  for (let y = 0; y < out.h; y++) for (let x = 0; x < out.w; x++) out.set(x, y, src.get(Math.floor(x / k), Math.floor(y / k)));
  return out;
}

/** Dibuja arte ASCII: cada carácter se traduce con la paleta ('.' = transparente). */
export function fromAscii(rows, palette, width = rows[0].length) {
  rows.forEach((r, i) => {
    if (r.length !== width) throw new Error(`Fila ${i} mide ${r.length}, se esperaban ${width}: "${r}"`);
  });
  const c = createCanvas(width, rows.length);
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === '.') return;
      if (!palette[ch]) throw new Error(`Carácter sin color: "${ch}" (fila ${y})`);
      c.set(x, y, palette[ch]);
    }),
  );
  return c;
}

// ------------------------------------------------------------------ PNG

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
function chunk(type, payload) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(payload.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), payload]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

export function encodePNG({ w, h, data }) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) data.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

export function writePNG(file, canvas) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, encodePNG(canvas));
}

export function readPNG(file) {
  const buf = readFileSync(file);
  let pos = 8;
  let w, h, colorType, bitDepth, interlace;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const body = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      w = body.readUInt32BE(0);
      h = body.readUInt32BE(4);
      bitDepth = body[8];
      colorType = body[9];
      interlace = body[12];
    } else if (type === 'IDAT') idat.push(body);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  const channels = { 2: 3, 6: 4 }[colorType];
  if (bitDepth !== 8 || !channels || interlace) throw new Error(`${file}: formato PNG no soportado`);
  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * channels;
  const pixels = Buffer.alloc(stride * h);
  for (let y = 0; y < h; y++) {
    const filter = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const v = raw[y * (stride + 1) + 1 + x];
      const a = x >= channels ? pixels[y * stride + x - channels] : 0;
      const b = y > 0 ? pixels[(y - 1) * stride + x] : 0;
      const c = x >= channels && y > 0 ? pixels[(y - 1) * stride + x - channels] : 0;
      let pred = 0;
      if (filter === 1) pred = a;
      else if (filter === 2) pred = b;
      else if (filter === 3) pred = (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      pixels[y * stride + x] = (v + pred) & 255;
    }
  }
  const out = createCanvas(w, h);
  for (let i = 0; i < w * h; i++) {
    out.set(i % w, Math.floor(i / w), [
      pixels[i * channels],
      pixels[i * channels + 1],
      pixels[i * channels + 2],
      channels === 4 ? pixels[i * channels + 3] : 255,
    ]);
  }
  return out;
}
