/** Utilidades de azar compartidas. */

export const randomBetween = (min, max) => min + Math.random() * (max - min);

/** Recibe [min, max] y devuelve un número aleatorio en ese rango. */
export const randomInRange = ([min, max]) => randomBetween(min, max);

export const pick = (list) => list[Math.floor(Math.random() * list.length)];

/** Elige un elemento distinto de `previous` cuando hay más de una opción. */
export function pickDifferent(list, previous) {
  if (!list?.length) return undefined;
  if (list.length === 1) return list[0];
  let choice;
  do choice = pick(list);
  while (choice === previous);
  return choice;
}

/** Elige un elemento según su campo `weight` (por defecto 1). */
export function pickWeighted(list) {
  const total = list.reduce((sum, item) => sum + (item.weight ?? 1), 0);
  let roll = Math.random() * total;
  for (const item of list) {
    roll -= item.weight ?? 1;
    if (roll <= 0) return item;
  }
  return list[list.length - 1];
}
