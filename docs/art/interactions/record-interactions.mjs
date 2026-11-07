/**
 * Graba y verifica en el juego real las tres interacciones especiales
 * (abrazo, juego de peluches y siesta) y genera sus GIF y capturas.
 *
 *   npm run dev                                   (en otra terminal)
 *   node docs/art/interactions/record-interactions.mjs [carpeta de salida]
 *
 * Usa Chrome sin ventana mediante el protocolo DevTools (sin dependencias).
 * Ruta de Chrome: variable CHROME o la instalación por defecto de Windows.
 * Requiere el modo desarrollo (usa window.game). Imprime un informe JSON con
 * los estados de los personajes y los errores de consola.
 */
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readPNG, crop } from '../tools/png.mjs';
import { writeGIF } from '../tools/gif.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = process.argv[2] ?? HERE;
const URL = process.env.GAME_URL ?? 'http://localhost:5173/';
const CHROME = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PROFILE = join(OUT, '.chrome-profile');
const VIEW = { width: 960, height: 540, deviceScaleFactor: 1, mobile: false }; // pixelScale 3
const port = 9351;
mkdirSync(OUT, { recursive: true });
const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${PROFILE}`,
  `--window-size=${VIEW.width},${VIEW.height}`, '--no-first-run', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  '--autoplay-policy=document-user-activation-required', 'about:blank',
]);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 40; i++) {
  try { targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); if (targets.length) break; } catch {}
  await wait(250);
}
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0;
const pending = new Map();
const logs = [];
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning', 'warn'].includes(m.params.type)) logs.push(`[console.${m.params.type}] ` + m.params.args.map((a) => a.value ?? a.description).join(' '));
  if (m.method === 'Runtime.exceptionThrown') logs.push('[EXCEPTION] ' + (m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text));
  if (m.method === 'Log.entryAdded' && !/GPU stall|GL Driver|AudioContext was not allowed/.test(m.params.entry.text)) logs.push(`[log.${m.params.entry.level}] ${m.params.entry.text}`);
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expr) => {
  const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (res.result?.exceptionDetails) throw new Error(JSON.stringify(res.result.exceptionDetails).slice(0, 500));
  return res.result?.result?.value;
};
const shotBuf = async () => Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).result.data, 'base64');
const screenshot = async (file) => { writeFileSync(join(OUT, file), await shotBuf()); console.log('captura:', file); };
const press = async ({ x, y }) => {
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await wait(40);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
};
const toScreen = (wx, wy, key = 'Park') => evaluate(`(() => { const g = window.game; const cam = g.scene.getScene('${key}').cameras.main; const r = g.canvas.getBoundingClientRect();
  return { x: r.left + (${wx} - cam.worldView.x) * cam.zoom * r.width / g.canvas.width, y: r.top + (${wy} - cam.worldView.y) * cam.zoom * r.height / g.canvas.height }; })()`);
const P = `window.game.scene.getScene('Park')`;
const tapChar = async (cid) => { const c = await evaluate(`(() => { const c = ${P}.characters.find(c => c.id === '${cid}'); return { x: c.x, y: c.y - c.def.height / 2 }; })()`); await press(await toScreen(c.x, c.y)); };
const stage = (pos) => evaluate(`(() => { const sc = ${P}; if (sc.director.active) sc.director.finish(); sc.director.cancel(sc.director.timer); sc.director.timer = null;
  for (const k of [...sc.bubbles.active.keys()]) sc.bubbles.dismiss(k, true);
  const pos = ${JSON.stringify(pos)};
  for (const c of sc.characters) { c.reserved = false; c.setPosing(false); const p = pos[c.id]; if (p) { c.x = p.x; c.y = p.y; } c.idle(1e9); c.syncView(); }
  return true; })()`);
const states = () => evaluate(`${P}.characters.map(c => c.id + ':' + c.state + (c.reserved ? '*' : '') + (c.posing ? '(pose)' : '')).join(' ')`);

/** Graba `ms` milisegundos recortando la zona (en píxeles de arte) y ejecuta acciones programadas. */
async function record(name, ms, region, actions = []) {
  const s = 3;
  const frames = [];
  const times = [];
  const t0 = Date.now();
  const todo = [...actions];
  const samples = [];
  while (Date.now() - t0 < ms) {
    const el = Date.now() - t0;
    while (todo.length && todo[0].at <= el) await todo.shift().run();
    const buf = await shotBuf();
    const f = join(OUT, '_f.png');
    writeFileSync(f, buf);
    if (!times.length || Date.now() - times.at(-1) >= 80) {
      frames.push(crop(readPNG(f), region.x * s, region.y * s, region.w * s, region.h * s));
      times.push(Date.now());
      if (frames.length % 6 === 0) samples.push(`${(el / 1000).toFixed(1)}s ${await states()}`);
    }
  }
  const delays = times.map((t, i) => (i + 1 < times.length ? times[i + 1] - t : 100));
  writeGIF(join(OUT, `${name}.gif`), frames, delays);
  console.log(`GIF ${name}: ${frames.length} fotogramas, ${((times.at(-1) - times[0]) / 1000).toFixed(1)} s`);
  return samples;
}

await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', VIEW);
await send('Page.navigate', { url: URL });
await wait(2500);
await press(await toScreen(160, 140, 'Welcome'));
await wait(7500); // título de entrada

const R = {};

// ---------------- 1. Abrazo
await stage({ miguel: { x: 104, y: 150 }, lia: { x: 196, y: 150 }, miguelito: { x: 40, y: 80 }, ratencio: { x: 280, y: 80 } });
R.abrazo = await record('abrazo', 9500, { x: 70, y: 96, w: 180, h: 70 }, [
  { at: 300, run: () => evaluate(`(() => { const d = ${P}.director; return d.run(d.definitions.find(x => x.id === 'miguel-busca-lia')); })()`) },
  { at: 5600, run: async () => { await screenshot('abrazo.png'); } },
]);
R.abrazoFin = await states();
R.abrazoHugDestruido = await evaluate(`${P}.children.list.filter(o => o.texture?.key === 'hug').length`);

// ---------------- 2. Juego de peluches
await stage({ miguel: { x: 40, y: 165 }, lia: { x: 280, y: 165 }, miguelito: { x: 92, y: 118 }, ratencio: { x: 196, y: 118 } });
R.juego = await record('juego-peluches', 9000, { x: 70, y: 70, w: 180, h: 70 }, [
  { at: 300, run: () => evaluate(`(() => { const d = ${P}.director; return d.run(d.definitions.find(x => x.id === 'peluches-juegan')); })()`) },
  { at: 5800, run: async () => { await screenshot('juego-peluches.png'); } },
]);
R.juegoFin = await states();

// ---------------- 3. Siesta: se duerme, despierta solo; se duerme otra vez y lo despiertan con un toque
await stage({ miguel: { x: 40, y: 165 }, lia: { x: 280, y: 165 }, miguelito: { x: 60, y: 80 }, ratencio: { x: 160, y: 120 } });
R.siesta = await record('siesta', 12000, { x: 100, y: 70, w: 120, h: 70 }, [
  { at: 300, run: () => evaluate(`${P}.characters.find(c => c.id === 'ratencio').sleep(4200)`) },
  { at: 2800, run: async () => { await screenshot('siesta.png'); } },
  { at: 4800, run: async () => { R.siestaDespiertaSolo = await evaluate(`${P}.characters.find(c => c.id === 'ratencio').state`); } },
  { at: 6500, run: () => evaluate(`(() => { const r = ${P}.characters.find(c => c.id === 'ratencio'); r.idle(1e9); r.sleep(6000); })()`) },
  { at: 8600, run: () => tapChar('ratencio') },
  { at: 8900, run: async () => { R.frasealDespertar = await evaluate(`${P}.bubbles.active.get('ratencio')?.label.text ?? null`); await screenshot('siesta-despierta.png'); } },
]);
R.siestaFin = await states();

// ---------------- 4. Vuelven a su vida normal: 20 s libres con el director en marcha
await evaluate(`(() => { const sc = ${P}; for (const c of sc.characters) { c.reserved = false; c.idle(300 + Math.random() * 1000); } sc.director.start(); })()`);
const seen = {};
let stuckReserved = 0;
for (let i = 0; i < 40; i++) {
  await wait(500);
  const s = await evaluate(`${P}.characters.map(c => ({ id: c.id, st: c.state, r: c.reserved, a: ${P}.director.active?.def.id ?? null }))`);
  for (const c of s) (seen[c.id] ??= new Set()).add(c.st);
  if (s.some((c) => c.r) && !s[0].a) stuckReserved++;
}
R.vidaNormal = Object.fromEntries(Object.entries(seen).map(([k, v]) => [k, [...v].sort().join(',')]));
R.reservadosSinEncuentro = stuckReserved;

// ---------------- 5. Clics y sonido siguen funcionando
await stage({ miguel: { x: 100, y: 150 }, lia: { x: 160, y: 150 }, miguelito: { x: 220, y: 150 }, ratencio: { x: 260, y: 110 } });
await tapChar('miguel');
await wait(150);
R.clic = await evaluate(`(() => { const sc = ${P}; return { miguelReacciona: sc.characters[0].sprite.anims.currentAnim.key, globo: sc.bubbles.active.get('miguel')?.label.text ?? null }; })()`);
await press(await toScreen(310, 10));
await wait(200);
R.sonidoSilenciado = await evaluate(`window.game.sound.mute`);
await press(await toScreen(310, 10));
await wait(300);
R.musica = await evaluate(`(() => { const all = window.game.sound.getAll('music'); return { reproductores: all.length, sonando: !!all[0]?.isPlaying, volumen: all[0]?.volume, silenciado: window.game.sound.mute }; })()`);

// ---------------- 6. Reiniciar la escena en pleno abrazo: sin bloqueos
await stage({ miguel: { x: 120, y: 150 }, lia: { x: 170, y: 150 }, miguelito: { x: 40, y: 80 }, ratencio: { x: 280, y: 80 } });
await evaluate(`(() => { const d = ${P}.director; d.run(d.definitions.find(x => x.id === 'miguel-busca-lia')); })()`);
await wait(2500);
R.antesDeReiniciar = await states();
await evaluate(`${P}.scene.restart()`);
await wait(1500);
R.trasReiniciar = await evaluate(`(() => { const sc = ${P}; return { personajes: sc.characters.map(c => c.id + ':' + c.state + (c.reserved ? '*' : '')).join(' '),
  abrazos: sc.children.list.filter(o => o.texture?.key === 'hug').length, encuentro: sc.director.active?.def.id ?? null, musica: window.game.sound.getAll('music').length }; })()`);

console.log(JSON.stringify(R, null, 1));
console.log('consola:', logs.length ? '\n' + logs.join('\n') : 'sin errores ni avisos');
ws.close();
chrome.kill();
await wait(500);
for (const f of [join(OUT, '_f.png'), PROFILE]) rmSync(f, { recursive: true, force: true });
process.exit(0);
