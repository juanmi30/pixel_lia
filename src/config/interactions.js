/**
 * Interacciones espontáneas: de vez en cuando un personaje (actor) camina hasta
 * otro (target), se miran, aparece un emote y dicen sus frases (dialogues.js).
 *
 * Campos:
 *   id        identificador; también es la clave de sus diálogos.
 *   actor     id del personaje que se acerca.
 *   target    id del personaje que espera.
 *   weight    probabilidad relativa frente a las demás.
 *   distance  separación final entre ambos (píxeles de arte).
 *   emote     'heart' | 'note' | 'sparkle' | 'miniHeart' (ver assets.js).
 *   emoteCount cuántos emotes salen.
 *   durationMs cuánto dura el encuentro una vez juntos.
 *   cooldownMs tiempo mínimo antes de repetir esta misma interacción.
 */
export const INTERACTIONS = [
  {
    id: 'miguel-busca-lia',
    actor: 'miguel',
    target: 'lia',
    weight: 3,
    distance: 11,
    emote: 'heart',
    emoteCount: 3,
    durationMs: 3200,
    cooldownMs: 20000,
  },
  {
    id: 'lia-busca-miguel',
    actor: 'lia',
    target: 'miguel',
    weight: 3,
    distance: 11,
    emote: 'heart',
    emoteCount: 3,
    durationMs: 3200,
    cooldownMs: 20000,
  },
  {
    id: 'peluches-juegan',
    actor: 'miguelito',
    target: 'ratencio',
    weight: 3,
    distance: 13,
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
    distance: 13,
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
    distance: 12,
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
    distance: 12,
    emote: 'sparkle',
    emoteCount: 1,
    durationMs: 2600,
    cooldownMs: 25000,
  },
];
