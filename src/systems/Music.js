import { GAME } from '../config/game.js';

/** Clave de la música en la caché de audio de Phaser (ver ASSETS.audio). */
export const MUSIC_KEY = 'music';
const STORAGE_KEY = 'nuestro-lugarcito:silenciado';

function readMuted() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeMuted(muted) {
  try {
    localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
  } catch {
    // Sin almacenamiento (modo privado, etc.): no pasa nada, solo no se recuerda.
  }
}

/**
 * Estado de silencio propio. No se lee de `sound.mute` porque, con WebAudio,
 * Phaser aplica el cambio con `gain.setValueAtTime()` y la lectura no se
 * actualiza hasta que el hilo de audio lo procesa: justo después de silenciar,
 * `sound.mute` todavía devolvería el valor anterior.
 */
let muted = readMuted();

/**
 * Música de fondo. Usa el gestor de sonido GLOBAL de Phaser (compartido por
 * todas las escenas), así que reiniciar escenas nunca crea un segundo reproductor.
 */
export const Music = {
  /** ¿Se cargó el archivo de música? */
  isAvailable(scene) {
    return scene.cache.audio.exists(MUSIC_KEY);
  },

  /**
   * Inicia la música en bucle. Debe llamarse desde un gesto del usuario
   * (toque, clic o tecla) para respetar las reglas de autoplay. Es idempotente.
   */
  start(scene) {
    const sound = scene.sound;
    sound.mute = muted;
    if (!this.isAvailable(scene)) return null;

    // Reanuda el contexto de audio dentro del gesto (necesario en iOS/Safari).
    sound.context?.resume?.();

    const music = sound.get(MUSIC_KEY) ?? sound.add(MUSIC_KEY, { loop: true, volume: GAME.audio.musicVolume });
    if (!music.isPlaying) music.play();
    return music;
  },

  isMuted() {
    return muted;
  },

  /** Silencia o reactiva todo el sonido y recuerda la preferencia. */
  toggleMute(scene) {
    muted = !muted;
    scene.sound.mute = muted;
    writeMuted(muted);
    return muted;
  },
};
