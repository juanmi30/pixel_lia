/**
 * Parámetros de comportamiento comunes (los específicos de cada personaje
 * están en characters.js). Tiempos en milisegundos, distancias en píxeles de arte.
 */
export const BEHAVIOR = {
  /** Si un paseo dura más que esto, se cancela (evita quedarse "atascado"). */
  walkTimeoutMs: 10000,
  /** Distancia mínima de un paseo, para que no den pasitos ridículos. */
  minWanderDistance: 14,

  tap: {
    /** Cuánto se queda quieto un personaje tras tocarlo. */
    pauseMs: 2200,
    /** Tiempo mínimo entre dos toques al mismo personaje. */
    cooldownMs: 450,
    /** Altura del saltito de reacción. */
    hopHeight: 5,
  },

  spontaneous: {
    /** Espera antes de la primera interacción espontánea. */
    firstDelayMs: [4000, 7000],
    /** Espera entre interacciones espontáneas. */
    intervalMs: [7000, 14000],
    /** Si nadie está libre, se vuelve a intentar tras este tiempo. */
    retryMs: 2000,
    /** Retraso entre la frase del actor y la respuesta del target. */
    replyDelayMs: 1000,
  },

  bubble: {
    /** Duración de un globo de diálogo: base + ms por carácter, acotado. */
    baseMs: 1600,
    perCharMs: 55,
    minMs: 2000,
    maxMs: 4500,
    /** Ancho máximo del globo en píxeles de arte. */
    maxWidth: 104,
  },

  /** Coreografías especiales de los encuentros (src/systems/specials.js). */
  specials: {
    hug: {
      /** Espera tras encontrarse antes de abrazarse (se miran y saludan). */
      startDelayMs: 350,
      /** Cuánto dura el abrazo. */
      holdMs: 2100,
      /** Cada cuánto sale un corazoncito durante el abrazo. */
      heartEveryMs: 420,
    },
    play: {
      /** Saltitos de Miguelito y separación entre ellos. */
      hops: 2,
      hopGapMs: 380,
      /** Cuánto se bambolea Ratencio en respuesta. */
      wiggleMs: 1600,
    },
  },

  nap: {
    /** Cada cuánto sale una "z" mientras duerme. */
    zzzEveryMs: 900,
  },

  emote: {
    riseDistance: 16,
    durationMs: 1300,
    staggerMs: 260,
  },
};
