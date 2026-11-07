import { BEHAVIOR } from '../config/behavior.js';
import { DIALOGUES } from '../config/dialogues.js';
import { INTERACTIONS } from '../config/interactions.js';
import { pick, pickDifferent, pickWeighted, randomInRange } from '../utils/random.js';
import { greet, SPECIALS } from './specials.js';

/** Separación mínima entre el punto de encuentro y cualquier otro personaje. */
const MEETING_CLEARANCE = 14;

/**
 * Motor de interacciones: decide QUÉ pasa (toques del jugador, encuentros
 * espontáneos y la siesta). No conoce texturas ni dibuja nada: delega en los
 * personajes (Character), los globos (SpeechBubbles), los emotes (Emotes) y las
 * coreografías especiales (specials.js).
 *
 * - Solo hay un encuentro a la vez, para que la escena se lea con calma.
 * - Todos sus temporizadores pasan por `after()`: se cancelan al terminar el
 *   encuentro (los de la coreografía) y al cerrar la escena (todos), así que no
 *   quedan llamadas pendientes ni personajes reservados para siempre.
 */
export class InteractionDirector {
  constructor({ scene, characters, world, bubbles, emotes }) {
    this.scene = scene;
    this.world = world;
    this.bubbles = bubbles;
    this.emotes = emotes;
    this.characters = characters;
    this.byId = new Map(characters.map((c) => [c.id, c]));

    this.definitions = INTERACTIONS.filter((def) => {
      const ok = def.actor !== def.target && this.byId.has(def.actor) && this.byId.has(def.target);
      if (!ok) console.warn(`[interacciones] "${def.id}" ignorada: personajes inválidos`);
      if (def.special && !SPECIALS[def.special]) console.warn(`[interacciones] "${def.id}": special desconocido "${def.special}"`);
      return ok;
    });

    this.cooldownUntil = new Map(); // id de interacción -> instante permitido
    this.lastTapAt = new Map(); // id de personaje -> instante del último toque
    this.lastLine = new Map(); // id de personaje -> última frase dicha al tocarlo
    this.pending = new Set(); // temporizadores vivos
    this.timer = null; // próximo intento de encuentro espontáneo
    this.active = null; // encuentro en curso: { def, actor, target, cleanup, timers }
    this.destroyed = false;

    for (const character of characters) {
      character.on('tap', this.handleTap, this);
      character.on('sleep', this.handleSleep, this);
    }
    scene.events?.once('shutdown', () => this.destroy());
  }

  start() {
    this.schedule(randomInRange(BEHAVIOR.spontaneous.firstDelayMs));
  }

  // ------------------------------------------------------------ temporizadores

  /** Temporizador registrado. `group` (un Set) permite cancelar un subconjunto. */
  after(ms, fn, group = null) {
    const event = this.scene.time.delayedCall(ms, () => {
      this.pending.delete(event);
      group?.delete(event);
      fn();
    });
    this.pending.add(event);
    group?.add(event);
    return event;
  }

  cancel(event) {
    if (!event) return;
    event.remove(false);
    this.pending.delete(event);
  }

  /**
   * Cancela todo y suelta a los personajes. Se llama al cerrar la escena: en
   * ese momento sus sprites ya pueden estar destruidos, así que solo se limpia
   * el estado (sin reproducir animaciones).
   */
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    for (const event of this.pending) event.remove(false);
    this.pending.clear();
    this.timer = null;
    if (this.active) {
      const { actor, target, cleanup } = this.active;
      this.active = null;
      cleanup?.();
      for (const c of [actor, target]) {
        c.reserved = false;
        c.posing = false;
      }
    }
    for (const character of this.characters) {
      character.off('tap', this.handleTap);
      character.off('sleep', this.handleSleep);
    }
  }

  // ------------------------------------------------------------ toques

  handleTap(character) {
    const now = this.scene.time.now;
    if (now - (this.lastTapAt.get(character.id) ?? -Infinity) < BEHAVIOR.tap.cooldownMs) return;
    this.lastTapAt.set(character.id, now);

    // Despertar de la siesta
    if (character.isSleeping()) {
      character.wake(true);
      character.reactToTap();
      const line = pick(DIALOGUES.wake?.[character.id] ?? DIALOGUES.tap[character.id] ?? []);
      if (line) this.bubbles.say(character, line);
      return;
    }

    character.reactToTap();

    const line = pickDifferent(DIALOGUES.tap[character.id] ?? [], this.lastLine.get(character.id));
    if (line) {
      this.lastLine.set(character.id, line);
      this.bubbles.say(character, line);
    }
    if (character.def.tapEmote) {
      this.emotes.burst(character.def.tapEmote, character.x, character.top - 2, 1);
    }
  }

  // ------------------------------------------------------------ siesta

  /** Mientras duerme, salen "z" de vez en cuando. Se detiene sola al despertar. */
  handleSleep(character) {
    const tick = () => {
      if (!character.isSleeping()) return;
      this.emotes.burst('zzz', character.x + 5, character.top - 1, 1);
      this.after(BEHAVIOR.nap.zzzEveryMs, tick);
    };
    tick();
  }

  // ------------------------------------------------------------ espontáneas

  schedule(delayMs) {
    this.cancel(this.timer);
    this.timer = this.after(delayMs, () => {
      this.timer = null;
      this.trySpontaneous();
    });
  }

  trySpontaneous() {
    if (this.active) return; // al terminar el encuentro actual se programa el siguiente
    const now = this.scene.time.now;
    const options = this.definitions.filter(
      (def) =>
        (this.cooldownUntil.get(def.id) ?? 0) <= now &&
        this.byId.get(def.actor).isFree() &&
        this.byId.get(def.target).isFree(),
    );

    if (!options.length || !this.run(pickWeighted(options))) {
      this.schedule(BEHAVIOR.spontaneous.retryMs);
    }
  }

  /**
   * Inicia una interacción. Devuelve false (sin reservar a nadie) si ya hay
   * otra en curso o si no hay un punto de encuentro alcanzable y despejado.
   */
  run(def) {
    if (this.active || this.destroyed) return false;
    const actor = this.byId.get(def.actor);
    const target = this.byId.get(def.target);
    const others = this.characters.filter((c) => c !== actor && c !== target);
    const spot = this.world.meetingPoint(target, actor, def.distance, others, MEETING_CLEARANCE);
    if (!spot) return false;

    this.cooldownUntil.set(def.id, this.scene.time.now + def.cooldownMs);
    this.active = { def, actor, target, cleanup: null, timers: new Set() };
    actor.reserve();
    target.reserve();
    target.hold();
    target.face(actor.x);

    actor.walkTo(spot.x, spot.y, (arrived) => {
      if (arrived) this.meet(def, actor, target);
      else this.finish();
    });
    return true;
  }

  meet(def, actor, target) {
    if (this.active?.def !== def) return;
    const timers = this.active.timers;
    const after = (ms, fn) => this.after(ms, fn, timers);

    actor.face(target.x);
    target.face(actor.x);

    const special = SPECIALS[def.special];
    const ctx = { scene: this.scene, def, actor, target, emotes: this.emotes, after };
    this.active.cleanup = special ? special(ctx) : greet(ctx);

    const lines = DIALOGUES.interactions[def.id] ?? {};
    const actorLine = pick(lines.actor ?? []);
    const targetLine = pick(lines.target ?? []);
    if (actorLine) this.bubbles.say(actor, actorLine);
    if (targetLine) {
      after(actorLine ? BEHAVIOR.spontaneous.replyDelayMs : 0, () => this.bubbles.say(target, targetLine));
    }

    after(def.durationMs, () => this.finish());
  }

  /** Termina el encuentro en curso: limpia la coreografía y libera a ambos. */
  finish() {
    if (!this.active) return;
    const { actor, target, cleanup, timers } = this.active;
    this.active = null;
    for (const event of timers) this.cancel(event);
    cleanup?.();
    actor.release();
    target.release();
    this.schedule(randomInRange(BEHAVIOR.spontaneous.intervalMs));
  }
}
