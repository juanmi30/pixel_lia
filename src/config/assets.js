/**
 * Manifiesto de recursos visuales. Es el ÚNICO lugar donde se indican rutas y
 * tamaños de frame. Para reemplazar un sprite basta con sustituir el PNG (con el
 * mismo formato) o cambiar aquí la ruta / tamaño de frame.
 *
 * Las rutas son relativas a /public.
 */
export const ASSETS = {
  font: { key: 'Pixelify Sans', url: 'assets/fonts/pixelify-sans.woff2', format: 'woff2' },

  // Música de fondo. Se pueden listar varios formatos (p. ej. .ogg y .m4a) y
  // Phaser elige el primero que el navegador sepa reproducir.
  // Si el archivo no existe, el juego funciona igual, sin música.
  audio: {
    music: ['assets/audio/nuestro-lugarcito-musica-optimizada.mp3'],
  },

  images: {
    park: 'assets/background/park.png',
    bench: 'assets/props/bench.png',
    bush: 'assets/props/bush.png',
    shadow: 'assets/fx/shadow.png',
  },

  spritesheets: {
    // Personajes: 9 frames en una fila (ver README → "Formato de los personajes").
    miguel: { url: 'assets/sprites/miguel.png', frameWidth: 16, frameHeight: 20 },
    lia: { url: 'assets/sprites/lia.png', frameWidth: 16, frameHeight: 20 },
    miguelito: { url: 'assets/sprites/miguelito.png', frameWidth: 16, frameHeight: 20 },
    ratencio: { url: 'assets/sprites/ratencio.png', frameWidth: 16, frameHeight: 20 },

    // Escenario y efectos
    tree: { url: 'assets/props/tree.png', frameWidth: 32, frameHeight: 44 },
    flowers: { url: 'assets/props/flowers.png', frameWidth: 7, frameHeight: 8 },
    emotes: { url: 'assets/fx/emotes.png', frameWidth: 9, frameHeight: 9 },
  },
};

/** Nombre → frame dentro de assets/fx/emotes.png */
export const EMOTE_FRAMES = {
  heart: 0,
  note: 1,
  sparkle: 2,
  miniHeart: 3,
};

/** Cada variante de flor ocupa 2 frames consecutivos (normal + balanceo). */
export const FLOWER_VARIANTS = 4;
