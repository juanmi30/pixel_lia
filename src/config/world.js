/**
 * Disposición del parque (coordenadas en píxeles de arte, 320x180).
 *
 * - `walkBounds`: rectángulo donde los personajes pueden estar. Nadie sale de aquí.
 * - `props`: objetos del escenario. `x,y` es el punto de apoyo (la base).
 *   `blocker` (opcional) es la huella que los personajes evitan al elegir destino,
 *   centrada en x y apoyada en y: { w, h }.
 * - `flowers`: flores decorativas que se balancean. `v` es la variante de color.
 */
export const WORLD = {
  walkBounds: { x: 10, y: 60, width: 300, height: 114 },

  props: [
    // Fila de árboles y arbustos del fondo (siempre detrás de los personajes)
    { texture: 'tree', frame: 0, x: 18, y: 50 },
    { texture: 'tree', frame: 1, x: 54, y: 42 },
    { texture: 'bush', x: 84, y: 56 },
    { texture: 'tree', frame: 0, x: 108, y: 50 },
    { texture: 'bush', x: 196, y: 56 },
    { texture: 'tree', frame: 1, x: 222, y: 52 },
    { texture: 'bush', x: 312, y: 58 },

    // Elementos dentro de la zona caminable
    { texture: 'bench', x: 158, y: 74, blocker: { w: 30, h: 8 } },
    { texture: 'tree', frame: 1, x: 298, y: 176, blocker: { w: 10, h: 6 } },
    { texture: 'tree', frame: 0, x: 24, y: 104, blocker: { w: 10, h: 6 } },
  ],

  flowers: [
    { x: 34, y: 70, v: 0 }, { x: 46, y: 86, v: 1 }, { x: 72, y: 66, v: 2 },
    { x: 96, y: 92, v: 3 }, { x: 124, y: 70, v: 0 }, { x: 112, y: 100, v: 1 },
    { x: 192, y: 88, v: 2 }, { x: 210, y: 70, v: 3 }, { x: 234, y: 96, v: 0 },
    { x: 258, y: 74, v: 1 }, { x: 282, y: 90, v: 2 }, { x: 302, y: 68, v: 3 },
    { x: 140, y: 96, v: 3 }, { x: 176, y: 100, v: 1 },
    { x: 40, y: 162, v: 1 }, { x: 56, y: 174, v: 0 }, { x: 82, y: 158, v: 3 },
    { x: 108, y: 170, v: 2 }, { x: 140, y: 160, v: 0 }, { x: 170, y: 172, v: 1 },
    { x: 202, y: 158, v: 2 }, { x: 230, y: 170, v: 3 }, { x: 258, y: 160, v: 0 },
    { x: 272, y: 176, v: 1 }, { x: 12, y: 176, v: 3 },
  ],
};
