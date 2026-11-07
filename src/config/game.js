/**
 * Parámetros generales de presentación.
 *
 * El mundo se diseña a 320x180 "píxeles de arte". En el arranque se elige un
 * factor entero (pixelScale) según la pantalla y el canvas se crea a
 * 320*pixelScale x 180*pixelScale; la cámara hace zoom entero para que cada
 * píxel del arte ocupe exactamente pixelScale x pixelScale píxeles reales.
 * Así el arte queda nítido y los textos pueden dibujarse a resolución completa.
 */
export const GAME = {
  title: 'Nuestro lugarcito',
  width: 320,
  height: 180,
  minPixelScale: 2,
  maxPixelScale: 6,
  backgroundColor: '#2b2235',
  fontFamily: 'Pixelify Sans',
  /** Mensaje que aparece unos segundos al entrar al parque. */
  intro: {
    subtitle: 'Toca a alguien para saludar',
    holdMs: 4500,
  },
  /** Pantalla de bienvenida (necesaria para iniciar el audio tras un gesto del usuario). */
  welcome: {
    button: 'Entrar a nuestro lugarcito',
  },
  audio: {
    /** Volumen de la música (0 a 1). */
    musicVolume: 0.25,
  },
};
