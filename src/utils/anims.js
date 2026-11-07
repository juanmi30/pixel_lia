/** Nombre único de una animación: "<textura>:<nombre>", p. ej. "lia:walk". */
export const animKey = (texture, name) => `${texture}:${name}`;

/**
 * Origen horizontal que deja el centro en un píxel entero aunque el ancho sea
 * impar (evita medios píxeles borrosos o irregulares).
 */
export const pixelCenterX = (width) => Math.floor(width / 2) / width;
