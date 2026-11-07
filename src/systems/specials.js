import { BEHAVIOR } from '../config/behavior.js';
import { animKey, pixelCenterX } from '../utils/anims.js';

/**
 * Coreografías especiales de los encuentros (campo `special` en interactions.js).
 *
 * No son un motor aparte: el InteractionDirector las llama cuando la pareja ya
 * se encontró, y se encarga de los diálogos, de terminar el encuentro tras
 * `durationMs` y de liberar a los personajes. Cada coreografía:
 *   - recibe { scene, def, actor, target, emotes, after },
 *     donde `after(ms, fn)` es un temporizador que el director cancela si el
 *     encuentro termina antes o la escena se cierra;
 *   - devuelve una función de limpieza (o null) que el director llama siempre
 *     al terminar, pase lo que pase.
 */

/** Separación entre Miguel y Lía dentro de la imagen del abrazo (hug.png). */
const HUG_SPACING = 14;

/** Encuentro genérico: los dos reaccionan contentos y sale el emote configurado. */
export function greet({ def, actor, target, emotes }) {
  actor.interact(def.durationMs);
  target.interact(def.durationMs);
  const x = Math.round((actor.x + target.x) / 2);
  const y = Math.round(Math.min(actor.top, target.top)) - 2;
  emotes.burst(def.emote, x, y, def.emoteCount ?? 1);
  return null;
}

const pickPair = (actor, target, a, b) => {
  const pair = [actor, target];
  const first = pair.find((c) => c.id === a);
  const second = pair.find((c) => c.id === b);
  return first && second ? [first, second] : null;
};

export const SPECIALS = {
  /**
   * Abrazo de Miguel y Lía: se miran y sonríen, dan un pasito el uno hacia el
   * otro y se abrazan (una sola imagen con los dos, para que cada uno rodee al
   * otro sin que se tapen raro). Salen corazoncitos y luego vuelven a la normalidad.
   */
  hug(ctx) {
    const pair = pickPair(ctx.actor, ctx.target, 'miguel', 'lia');
    if (!pair) return greet(ctx);
    const [miguel, lia] = pair;
    const { scene, def, emotes, after } = ctx;
    const cfg = BEHAVIOR.specials.hug;
    let sprite = null;

    miguel.perform('react', Infinity);
    lia.perform('react', Infinity);

    after(cfg.startDelayMs, () => {
      // Pasito final: quedan a la distancia exacta de la imagen del abrazo.
      const dir = Math.sign(lia.x - miguel.x) || 1;
      const mid = Math.round((miguel.x + lia.x) / 2);
      const y = Math.round(lia.y);
      miguel.x = mid - (HUG_SPACING / 2) * dir;
      lia.x = mid + (HUG_SPACING / 2) * dir;
      miguel.y = lia.y = y;
      for (const c of pair) {
        c.hold();
        c.setPosing(true);
        c.syncView();
      }

      // hug.png tiene a Miguel a la izquierda; si está a la derecha, se voltea.
      sprite = scene.add.sprite(mid, y, 'hug', 0);
      sprite.setOrigin(pixelCenterX(sprite.width), 1).setFlipX(dir < 0).setDepth(y + 0.5);
      sprite.play(animKey('hug', 'hold'));

      const top = y - Math.max(miguel.def.height, lia.def.height) - 1;
      const hearts = Math.max(1, Math.floor(cfg.holdMs / cfg.heartEveryMs));
      for (let i = 0; i < hearts; i++) {
        after(i * cfg.heartEveryMs, () => emotes.burst('miniHeart', mid + (i % 2 ? 3 : -3), top, 1));
      }

      after(cfg.holdMs, () => {
        sprite?.destroy();
        sprite = null;
        // Al soltarse dan el pasito de vuelta (distancia de un encuentro normal)
        miguel.x = mid - (def.distance / 2) * dir;
        lia.x = mid + (def.distance / 2) * dir;
        const rest = Math.max(0, def.durationMs - cfg.startDelayMs - cfg.holdMs);
        for (const c of pair) {
          c.setPosing(false);
          c.face(c === miguel ? lia.x : miguel.x);
          c.perform('react', rest);
        }
      });
    });

    return () => {
      sprite?.destroy();
      sprite = null;
      for (const c of pair) c.setPosing(false);
    };
  },

  /**
   * Miguelito juega con Ratencio: Miguelito, juguetón, da dos saltitos con
   * notas musicales; Ratencio, tranquilito, responde bamboleándose sobre sus
   * patitas y suelta un brillito.
   */
  play(ctx) {
    const pair = pickPair(ctx.actor, ctx.target, 'miguelito', 'ratencio');
    if (!pair) return greet(ctx);
    const [monkey, rat] = pair;
    const { def, emotes, after } = ctx;
    const cfg = BEHAVIOR.specials.play;

    monkey.perform('react', def.durationMs);
    for (let i = 0; i < cfg.hops; i++) {
      after(i * cfg.hopGapMs, () => {
        monkey.hop();
        emotes.burst('note', monkey.x, monkey.top - 2, 1);
      });
    }

    rat.perform('wiggle', cfg.wiggleMs);
    after(cfg.hopGapMs + 150, () => emotes.burst('sparkle', rat.x, rat.top - 2, 1));
    after(cfg.wiggleMs, () => rat.perform('react', Math.max(0, def.durationMs - cfg.wiggleMs)));
    return null;
  },
};
