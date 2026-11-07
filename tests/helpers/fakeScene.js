/**
 * Escena falsa para probar la lógica real (Character + InteractionDirector)
 * sin Phaser ni navegador: reloj manual, temporizadores, sprites de mentira,
 * tweens que terminan al instante y evento de cierre ("shutdown").
 */
import { Character } from '../../src/entities/Character.js';
import { CHARACTERS } from '../../src/config/characters.js';
import { WORLD } from '../../src/config/world.js';
import { World } from '../../src/systems/World.js';
import { InteractionDirector } from '../../src/systems/InteractionDirector.js';

function stub(props = {}) {
  const o = {
    x: 0, y: 0, width: 20, height: 28, visible: true, flipX: false, depth: 0,
    anim: null, input: null, destroyed: false, data: {}, animHistory: [],
    ...props,
    setOrigin() { return o; },
    setDepth(d) { o.depth = d; return o; },
    setPosition(x, y) { o.x = x; o.y = y; return o; },
    setFlipX(f) { o.flipX = f; return o; },
    setInteractive(cfg) { o.input = { ...cfg }; return o; },
    setData(k, v) { o.data[k] = v; return o; },
    getData(k) { return o.data[k]; },
    setVisible(v) { o.visible = v; return o; },
    play(key) { if (o.anim !== key) o.animHistory.push(key); o.anim = key; return o; },
    destroy() { o.destroyed = true; },
  };
  return o;
}

export function createFakeScene() {
  const timers = [];
  const handlers = {};
  const time = {
    now: 0,
    delayedCall(ms, cb) {
      const e = { at: time.now + ms, cb, removed: false, fired: false, remove() { e.removed = true; } };
      timers.push(e);
      return e;
    },
  };
  const scene = {
    time,
    sprites: [],
    tweenLog: [],
    add: {
      image: () => stub(),
      sprite: (x, y, texture) => {
        const s = stub({ x, y, texture, width: texture === 'hug' ? 34 : 20 });
        scene.sprites.push(s);
        return s;
      },
    },
    tweens: {
      add(cfg) {
        scene.tweenLog.push(cfg);
        cfg.onComplete?.();
        return { isPlaying: () => false };
      },
    },
    events: {
      once(ev, fn) { (handlers[ev] ??= []).push(fn); },
      emit(ev) { const list = handlers[ev] ?? []; handlers[ev] = []; for (const fn of list) fn(); },
    },
    /** Dispara, en orden, los temporizadores vencidos (incluidos los que se creen mientras tanto). */
    runDueTimers() {
      for (;;) {
        const due = timers.filter((e) => !e.removed && !e.fired && e.at <= time.now).sort((a, b) => a.at - b.at)[0];
        if (!due) return;
        due.fired = true;
        due.cb();
      }
    },
    /** Temporizadores aún pendientes. */
    pendingTimers: () => timers.filter((e) => !e.removed && !e.fired).length,
  };
  return scene;
}

/** Parque de prueba: los cuatro personajes reales, el mundo real y un director real. */
export function createPark() {
  const scene = createFakeScene();
  const world = new World(WORLD.walkBounds, WORLD.props);
  const characters = CHARACTERS.map((def) => new Character(scene, def, world));
  const bubbles = { said: [], say(c, text) { this.said.push({ id: c.id, text, at: scene.time.now }); } };
  const emotes = { bursts: [], burst(name, x, y, n) { this.bursts.push({ name, x, y, n, at: scene.time.now }); } };
  const director = new InteractionDirector({ scene, characters, world, bubbles, emotes });
  const get = (id) => characters.find((c) => c.id === id);
  const def = (id) => director.definitions.find((d) => d.id === id);

  /** Avanza el reloj en pasos de 16 ms, actualizando personajes y disparando temporizadores. */
  const advance = (ms, onTick) => {
    const end = scene.time.now + ms;
    while (scene.time.now < end) {
      const dt = Math.min(16, end - scene.time.now);
      scene.time.now += dt;
      for (const c of characters) c.update(dt);
      scene.runDueTimers();
      onTick?.();
    }
  };

  /** Coloca a todos en las posiciones dadas, quietos (sin pasear ni dormirse). */
  const place = (positions) => {
    for (const c of characters) {
      const p = positions[c.id];
      if (p) { c.x = p.x; c.y = p.y; }
      c.idle(1e9);
      c.syncView();
    }
  };

  return { scene, world, characters, director, bubbles, emotes, get, def, advance, place };
}
