/**
 * Decide qué recibe un toque en el parque, a partir de los objetos bajo el
 * puntero (Phaser los entrega todos porque la escena usa `topOnly = false`).
 *
 * - Si `blocked` (p. ej. la carta está abierta), nada.
 * - Los personajes tienen prioridad: si hay varios, el más cercano al punto.
 * - Si no hay personajes, la flor secreta.
 *
 * @returns {{type:'character', character:object} | {type:'secret'} | null}
 */
export function pickTapTarget(objects, x, y, { blocked = false } = {}) {
  if (blocked) return null;
  let nearest = null;
  let best = Infinity;
  for (const object of objects) {
    const character = object.getData?.('character');
    if (!character) continue;
    const d = character.distanceSqTo(x, y);
    if (d < best) {
      best = d;
      nearest = character;
    }
  }
  if (nearest) return { type: 'character', character: nearest };
  if (objects.some((o) => o.getData?.('secret'))) return { type: 'secret' };
  return null;
}
