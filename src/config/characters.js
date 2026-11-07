/**
 * Definición de los personajes. Todo lo que diferencia a uno de otro vive aquí:
 * textura, animaciones, velocidad, tiempos de espera y reacción al tocarlo.
 * Los diálogos están aparte, en dialogues.js.
 */

/**
 * Animaciones por defecto: índices de frame dentro de la hoja de 9 frames.
 * Un personaje puede sobrescribir cualquiera con su propia clave `animations`.
 */
export const DEFAULT_ANIMATIONS = {
  idle: { frames: [0, 1, 0, 1, 0, 8], frameRate: 3, repeat: -1 },
  walk: { frames: [2, 3, 4, 5], frameRate: 8, repeat: -1 },
  react: { frames: [6, 7], frameRate: 6, repeat: -1 },
};

export const CHARACTERS = [
  {
    id: 'miguel',
    name: 'Miguel',
    texture: 'miguel',
    start: { x: 112, y: 150 },
    speed: 24, // píxeles de arte por segundo
    idleMs: [1500, 4200], // espera aleatoria entre paseos
    wanderRadius: 110, // distancia máxima de cada paseo
    height: 19, // alto visible (para colocar diálogos y emotes encima)
    tapEmote: 'miniHeart',
  },
  {
    id: 'lia',
    name: 'Lía',
    texture: 'lia',
    start: { x: 186, y: 146 },
    speed: 23,
    idleMs: [1800, 4800],
    wanderRadius: 110,
    height: 19,
    tapEmote: 'heart',
  },
  {
    id: 'miguelito',
    name: 'Miguelito',
    texture: 'miguelito',
    start: { x: 72, y: 96 },
    speed: 20,
    idleMs: [1200, 3600],
    wanderRadius: 80,
    height: 14,
    tapEmote: 'note',
    animations: { walk: { frames: [2, 3, 4, 5], frameRate: 10, repeat: -1 } },
  },
  {
    id: 'ratencio',
    name: 'Ratencio',
    texture: 'ratencio',
    start: { x: 236, y: 92 },
    speed: 13, // gordito: va despacito
    idleMs: [2500, 6000],
    wanderRadius: 60,
    height: 15,
    tapEmote: 'sparkle',
    animations: { walk: { frames: [2, 3, 4, 5], frameRate: 6, repeat: -1 } },
  },
];
