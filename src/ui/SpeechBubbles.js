import { BEHAVIOR } from '../config/behavior.js';
import { GAME } from '../config/game.js';

const COLORS = {
  fill: 0xfffaf2,
  outline: 0x3b2a3a,
  text: '#3b2a3a',
};
/** Tamaño de letra en píxeles de arte (se dibuja a resolución completa). */
const FONT_SIZE = 8;
const PAD_X = 4;
const PAD_Y = 2;
const SCREEN_MARGIN = 2;

/**
 * Globos de diálogo que siguen a su personaje.
 *
 * El globo se dibuja en píxeles de arte (bordes pixelados) y el texto se crea
 * a `pixelScale` veces el tamaño y se reduce con setScale(1/pixelScale): con el
 * zoom de cámara queda 1:1 con los píxeles reales, nítido y legible.
 */
export class SpeechBubbles {
  constructor(scene, pixelScale) {
    this.scene = scene;
    this.scale = pixelScale;
    this.active = new Map(); // id de personaje -> globo
  }

  say(character, text) {
    this.dismiss(character.id, true);

    const s = this.scale;
    const label = this.scene.add
      .text(0, 0, text, {
        fontFamily: `"${GAME.fontFamily}"`,
        fontSize: `${FONT_SIZE * s}px`,
        color: COLORS.text,
        align: 'center',
        wordWrap: { width: (BEHAVIOR.bubble.maxWidth - PAD_X * 2) * s, useAdvancedWrap: true },
      })
      .setScale(1 / s);

    const textW = Math.ceil(label.width / s);
    const textH = Math.ceil(label.height / s);
    const w = textW + PAD_X * 2;
    const h = textH + PAD_Y * 2;

    const graphics = this.scene.add.graphics();
    const container = this.scene.add.container(0, 0, [graphics, label]).setDepth(10000);

    const bubble = { character, container, graphics, label, w, h, boxX: null, closing: false };
    bubble.expireEvent = this.scene.time.delayedCall(this.durationFor(text), () => this.dismiss(character.id));

    this.active.set(character.id, bubble);
    this.layout(bubble);
    this.dismissOverlapping(bubble);

    container.setScale(0.6);
    this.scene.tweens.add({ targets: container, scale: 1, duration: 160, ease: 'Back.easeOut' });
  }

  durationFor(text) {
    const b = BEHAVIOR.bubble;
    return Math.min(b.maxMs, Math.max(b.minMs, b.baseMs + text.length * b.perCharMs));
  }

  /** Cierra el globo de un personaje (con un fundido, o al instante). */
  dismiss(characterId, immediate = false) {
    const bubble = this.active.get(characterId);
    if (!bubble) return;
    this.active.delete(characterId);
    bubble.expireEvent?.remove();

    if (immediate) {
      bubble.container.destroy();
      return;
    }
    bubble.closing = true;
    this.scene.tweens.add({
      targets: bubble.container,
      alpha: 0,
      duration: 180,
      onComplete: () => bubble.container.destroy(),
    });
  }

  /** Si un globo nuevo tapa a otro, el anterior se retira: parece una conversación. */
  dismissOverlapping(fresh) {
    const a = this.bounds(fresh);
    for (const [id, other] of this.active) {
      if (other === fresh) continue;
      const b = this.bounds(other);
      const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
      if (overlap) this.dismiss(id);
    }
  }

  bounds(bubble) {
    return {
      x: bubble.container.x + bubble.boxX,
      y: bubble.container.y - bubble.h - 2,
      w: bubble.w,
      h: bubble.h,
    };
  }

  update() {
    for (const bubble of this.active.values()) this.layout(bubble);
  }

  /** Coloca el globo sobre la cabeza y lo mantiene dentro de la pantalla. */
  layout(bubble) {
    const cx = Math.round(bubble.character.x);
    const cy = Math.round(bubble.character.top) - 1;
    bubble.container.setPosition(cx, cy);

    const minX = SCREEN_MARGIN - cx;
    const maxX = GAME.width - SCREEN_MARGIN - bubble.w - cx;
    const boxX = Math.min(Math.max(-Math.floor(bubble.w / 2), minX), maxX);
    if (boxX !== bubble.boxX) {
      bubble.boxX = boxX;
      this.draw(bubble);
    }
  }

  /** Dibuja el globo con esquinas pixeladas y un piquito apuntando al personaje (0,0). */
  draw(bubble) {
    const { graphics: g, w, h, boxX: bx, label } = bubble;
    const by = -(h + 2);
    g.clear();

    // Borde con esquinas recortadas
    g.fillStyle(COLORS.outline);
    g.fillRect(bx + 1, by, w - 2, h);
    g.fillRect(bx, by + 1, w, h - 2);
    // Relleno
    g.fillStyle(COLORS.fill);
    g.fillRect(bx + 2, by + 1, w - 4, h - 2);
    g.fillRect(bx + 1, by + 2, w - 2, h - 4);

    // Piquito (la punta queda en y = 0, justo encima de la cabeza)
    const tx = Math.min(Math.max(0, bx + 4), bx + w - 5);
    g.fillStyle(COLORS.outline);
    g.fillRect(tx - 2, -2, 5, 1);
    g.fillRect(tx - 1, -1, 3, 1);
    g.fillRect(tx, 0, 1, 1);
    g.fillStyle(COLORS.fill);
    g.fillRect(tx - 1, -3, 3, 1);
    g.fillRect(tx - 1, -2, 3, 1);
    g.fillRect(tx, -1, 1, 1);

    label.setPosition(bx + PAD_X + Math.floor((w - PAD_X * 2 - Math.ceil(label.width / this.scale)) / 2), by + PAD_Y);
  }
}
