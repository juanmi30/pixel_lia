import { Music } from '../systems/Music.js';

const COLORS = { fill: 0xfffaf2, outline: 0x3b2a3a, icon: 0x3b2a3a };
const BOX = { w: 15, h: 13 };
/** Zona táctil (píxeles de arte): más grande que el dibujo para tocarlo fácil en el celular. */
const HIT = 20;

/**
 * Botón discreto para silenciar o reactivar el sonido (altavoz con ondas o con una X).
 * Se dibuja en píxeles de arte y tiene su propia zona táctil; como no es un
 * personaje, la escena del parque lo ignora al decidir a quién se tocó.
 */
export class SoundToggle {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.graphics = scene.add.graphics().setDepth(20001);

    const cx = x + BOX.w / 2;
    const cy = y + BOX.h / 2;
    this.zone = scene.add
      .zone(Math.round(cx), Math.round(cy), HIT, HIT)
      .setDepth(20001)
      .setInteractive({ useHandCursor: true });
    this.zone.on('pointerdown', (pointer, _x, _y, event) => {
      event?.stopPropagation?.();
      Music.toggleMute(scene);
      this.draw();
    });
    this.draw();
  }

  draw() {
    const g = this.graphics;
    const { x, y } = this;
    const muted = Music.isMuted();
    g.clear();

    // Fondo con esquinas recortadas
    g.fillStyle(COLORS.outline);
    g.fillRect(x + 1, y, BOX.w - 2, BOX.h);
    g.fillRect(x, y + 1, BOX.w, BOX.h - 2);
    g.fillStyle(COLORS.fill);
    g.fillRect(x + 2, y + 1, BOX.w - 4, BOX.h - 2);
    g.fillRect(x + 1, y + 2, BOX.w - 2, BOX.h - 4);

    // Altavoz
    g.fillStyle(COLORS.icon);
    g.fillRect(x + 3, y + 5, 2, 3);
    g.fillRect(x + 5, y + 4, 1, 5);
    g.fillRect(x + 6, y + 3, 1, 7);

    if (muted) {
      // X
      for (let i = 0; i < 4; i++) {
        g.fillRect(x + 8 + i, y + 4 + i, 1, 1);
        g.fillRect(x + 11 - i, y + 4 + i, 1, 1);
      }
    } else {
      // Ondas
      g.fillRect(x + 8, y + 5, 1, 3);
      g.fillRect(x + 10, y + 4, 1, 1);
      g.fillRect(x + 11, y + 5, 1, 3);
      g.fillRect(x + 10, y + 8, 1, 1);
    }
  }
}
