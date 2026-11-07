/**
 * Codificador GIF89a mínimo (sin dependencias) para vistas previas animadas.
 * Usa una paleta global de hasta 255 colores + 1 transparente y compresión LZW.
 * Si los fotogramas tienen más de 255 colores, se reducen al más cercano entre
 * los más frecuentes (suficiente para capturas de pixel art).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

function buildPalette(frames) {
  const counts = new Map();
  for (const f of frames) {
    for (let i = 0; i < f.data.length; i += 4) {
      if (f.data[i + 3] < 128) continue;
      const key = (f.data[i] << 16) | (f.data[i + 1] << 8) | f.data[i + 2];
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  const colors = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 255).map(([k]) => k);
  return colors;
}

function indexFrames(frames, colors) {
  const exact = new Map(colors.map((c, i) => [c, i + 1])); // 0 = transparente
  const cache = new Map();
  const nearest = (key) => {
    if (exact.has(key)) return exact.get(key);
    if (cache.has(key)) return cache.get(key);
    const r = key >> 16, g = (key >> 8) & 255, b = key & 255;
    let best = 1, bestD = Infinity;
    colors.forEach((c, i) => {
      const d = (r - (c >> 16)) ** 2 + (g - ((c >> 8) & 255)) ** 2 + (b - (c & 255)) ** 2;
      if (d < bestD) { bestD = d; best = i + 1; }
    });
    cache.set(key, best);
    return best;
  };
  return frames.map((f) => {
    const out = new Uint8Array(f.w * f.h);
    for (let p = 0; p < out.length; p++) {
      const i = p * 4;
      out[p] = f.data[i + 3] < 128 ? 0 : nearest((f.data[i] << 16) | (f.data[i + 1] << 8) | f.data[i + 2]);
    }
    return out;
  });
}

function lzw(indices, minCodeSize) {
  const clear = 1 << minCodeSize;
  const eoi = clear + 1;
  const bytes = [];
  let cur = 0, curBits = 0;
  let codeSize = minCodeSize + 1;
  const emit = (code) => {
    cur |= code << curBits;
    curBits += codeSize;
    while (curBits >= 8) { bytes.push(cur & 255); cur >>>= 8; curBits -= 8; }
  };
  let dict = new Map();
  let next = eoi + 1;
  const reset = () => { dict = new Map(); next = eoi + 1; codeSize = minCodeSize + 1; };
  emit(clear);
  let prefix = indices[0];
  for (let i = 1; i < indices.length; i++) {
    const k = indices[i];
    const key = prefix * 256 + k;
    if (dict.has(key)) { prefix = dict.get(key); continue; }
    emit(prefix);
    if (next < 4096) {
      dict.set(key, next++);
      if (next > 1 << codeSize && codeSize < 12) codeSize++;
    } else {
      emit(clear);
      reset();
    }
    prefix = k;
  }
  emit(prefix);
  emit(eoi);
  if (curBits > 0) bytes.push(cur & 255);
  return bytes;
}

/**
 * @param {string} file
 * @param {Array<{w:number,h:number,data:Buffer}>} frames  lienzos del mismo tamaño
 * @param {number|number[]} delayMs  duración de cada fotograma
 */
export function writeGIF(file, frames, delayMs = 100) {
  const { w, h } = frames[0];
  const colors = buildPalette(frames);
  const indexed = indexFrames(frames, colors);
  const out = [];
  const u16 = (n) => out.push(n & 255, (n >> 8) & 255);
  out.push(...Buffer.from('GIF89a'));
  u16(w);
  u16(h);
  out.push(0xf7, 0, 0); // tabla global de 256 colores
  const table = [0, 0, 0, ...colors.flatMap((c) => [c >> 16, (c >> 8) & 255, c & 255])];
  while (table.length < 256 * 3) table.push(0);
  out.push(...table);
  out.push(0x21, 0xff, 11, ...Buffer.from('NETSCAPE2.0'), 3, 1, 0, 0, 0); // bucle infinito
  indexed.forEach((idx, f) => {
    const delay = Math.round((Array.isArray(delayMs) ? delayMs[f] : delayMs) / 10);
    out.push(0x21, 0xf9, 4, 0x09, delay & 255, delay >> 8, 0, 0); // transparente = 0, restaurar fondo
    out.push(0x2c);
    u16(0);
    u16(0);
    u16(w);
    u16(h);
    out.push(0);
    out.push(8);
    const data = lzw(idx, 8);
    for (let i = 0; i < data.length; i += 255) {
      const block = data.slice(i, i + 255);
      out.push(block.length, ...block);
    }
    out.push(0);
  });
  out.push(0x3b);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, Buffer.from(out));
}
