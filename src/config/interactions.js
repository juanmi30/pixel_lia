/**
 * Interacciones espontáneas: de vez en cuando un personaje (actor) camina hasta
 * otro (target), se miran, aparece un emote y dicen sus frases (dialogues.js).
 *
 * Campos:
 *   id        identificador; también es la clave de sus diálogos.
 *   actor     id del personaje que se acerca.
 *   target    id del personaje que espera.
 *   weight    probabilidad relativa frente a las demás.
 *   distance  separación final entre los centros de ambos (píxeles de arte).
 *             Con sprites de 18–22 px de ancho, 16–18 deja a la pareja
 *             hombro con hombro sin que se monten.
 *   emote     'heart' | 'note' | 'sparkle' | 'miniHeart' (ver assets.js).
 *   emoteCount cuántos emotes salen.
 *   durationMs cuánto dura el encuentro una vez juntos.
 *   cooldownMs tiempo mínimo antes de repetir esta misma interacción.
 *   special   (opcional) coreografía especial al encontrarse, en lugar del
 *             saludo genérico: 'hug' (abrazo de Miguel y Lía) o 'play'
 *             (juego de Miguelito y Ratencio). Ver src/systems/specials.js.
 */
export const INTERACTIONS = [
  {
    id: 'miguel-busca-lia',
    actor: 'miguel',
    target: 'lia',
    weight: 3,
    distance: 16,
    special: 'hug',
    emote: 'miniHeart',
    emoteCount: 1,
    durationMs: 3600,
    cooldownMs: 20000,
  },
  {
    id: 'lia-busca-miguel',
    actor: 'lia',
    target: 'miguel',
    weight: 3,
    distance: 16,
    special: 'hug',
    emote: 'miniHeart',
    emoteCount: 1,
    durationMs: 3600,
    cooldownMs: 20000,
  },
  {
    id: 'peluches-juegan',
    actor: 'miguelito',
    target: 'ratencio',
    weight: 3,
    distance: 18,
    special: 'play',
    emote: 'note',
    emoteCount: 2,
    durationMs: 2800,
    cooldownMs: 15000,
  },
  {
    id: 'ratencio-visita-miguelito',
    actor: 'ratencio',
    target: 'miguelito',
    weight: 2,
    distance: 18,
    special: 'play',
    emote: 'sparkle',
    emoteCount: 2,
    durationMs: 2800,
    cooldownMs: 18000,
  },
  {
    id: 'lia-abraza-ratencio',
    actor: 'lia',
    target: 'ratencio',
    weight: 2,
    distance: 17,
    emote: 'heart',
    emoteCount: 2,
    durationMs: 3000,
    cooldownMs: 25000,
  },
  {
    id: 'miguel-y-miguelito',
    actor: 'miguel',
    target: 'miguelito',
    weight: 2,
    distance: 17,
    emote: 'sparkle',
    emoteCount: 1,
    durationMs: 2600,
    cooldownMs: 25000,
  },
];
