import { BEHAVIOR } from '../config/behavior.js';
import { DIALOGUES } from '../config/dialogues.js';
import { INTERACTIONS } from '../config/interactions.js';
import { pick, pickDifferent, pickWeighted, randomInRange } from '../utils/random.js';

/**
 * Motor de interacciones: decide QUÉ pasa (toques del jugador y encuentros
 * espontáneos entre personajes). No conoce texturas ni dibuja nada: delega en
 * los personajes (Character), los globos (SpeechBubbles) y los emotes (Emotes).
 *
 * Solo hay un encuentro espontáneo a la vez, para que la escena se lea con calma.
 */
export class InteractionDirector {
  constructor({ scene, characters, world, bubbles, emotes }) {
    this.scene = scene;
    this.world = world;
    this.bubbles = bubbles;
    this.emotes = emotes;
    this.byId = new Map(characters.map((c) => [c.id, c]));

    this.definitions = INTERACTIONS.filter((def) => {
      const ok = def.actor !== def.target && this.byId.has(def.actor) && this.byId.has(def.target);
      if (!ok) console.warn(`[interacciones] "${def.id}" ignorada: personajes inválidos`);
      return ok;
    });

    this.cooldownUntil = new Map(); // id de interacción -> instante permitido
    this.lastTapAt = new Map(); // id de personaje -> instante del último toque
    this.lastLine = new Map(); // id de personaje -> última frase dicha al tocarlo
    this.timer = null;

    for (const character of characters) character.on('tap', this.handleTap, this);
  }

  start() {
    this.schedule(randomInRange(BEHAVIOR.spontaneous.firstDelayMs));
  }

  // ------------------------------------------------------------ toques

  handleTap(character) {
    const now = this.scene.time.now;
    if (now - (this.lastTapAt.get(character.id) ?? -Infinity) < BEHAVIOR.tap.cooldownMs) return;
    this.lastTapAt.set(character.id, now);

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

  // ------------------------------------------------------------ espontáneas

  schedule(delayMs) {
    this.timer?.remove();
    this.timer = this.scene.time.delayedCall(delayMs, () => this.trySpontaneous());
  }

  trySpontaneous() {
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

  /** Inicia una interacción. Devuelve false si no hay sitio para el encuentro. */
  run(def) {
    const actor = this.byId.get(def.actor);
    const target = this.byId.get(def.target);
    const spot = this.world.meetingPoint(target, actor, def.distance);
    if (!spot) return false;

    this.cooldownUntil.set(def.id, this.scene.time.now + def.cooldownMs);
    actor.reserve();
    target.reserve();
    target.hold();
    target.face(actor.x);

    actor.walkTo(spot.x, spot.y, (arrived) => {
      if (arrived) this.meet(def, actor, target);
      else this.finish(actor, target);
    });
    return true;
  }

  meet(def, actor, target) {
    actor.face(target.x);
    target.face(actor.x);
    actor.interact(def.durationMs);
    target.interact(def.durationMs);

    const x = Math.round((actor.x + target.x) / 2);
    const y = Math.round(Math.min(actor.top, target.top)) - 2;
    this.emotes.burst(def.emote, x, y, def.emoteCount ?? 1);

    const lines = DIALOGUES.interactions[def.id] ?? {};
    const actorLine = pick(lines.actor ?? []);
    const targetLine = pick(lines.target ?? []);
    if (actorLine) this.bubbles.say(actor, actorLine);
    if (targetLine) {
      this.scene.time.delayedCall(actorLine ? BEHAVIOR.spontaneous.replyDelayMs : 0, () =>
        this.bubbles.say(target, targetLine),
      );
    }

    this.scene.time.delayedCall(def.durationMs, () => this.finish(actor, target));
  }

  finish(actor, target) {
    actor.release();
    target.release();
    this.schedule(randomInRange(BEHAVIOR.spontaneous.intervalMs));
  }
}
