import Phaser from 'phaser';
import { EMOTE_FRAMES } from '../config/assets.js';
import { GAME } from '../config/game.js';
import { LETTER } from '../config/letter.js';
import { Emotes } from '../fx/Emotes.js';

const COLORS = {
  overlay: 0x2b2235,
  burgundy: 0x7a2141,
  cream: 0xfff4e6,
  pink: 0xf3b3c3,
  pinkSoft: 0xffe3ec,
  shadow: 0x3b2a3a,
  title: '#7a2141',
  body: '#3b2a3a',
  signature: '#b84a6a',
  button: '#7a2141',
};
/** Tamaños en píxeles de arte (el texto se dibuja a resolución completa). */
const CARD_WIDTH = 216;
const PAD_X = 16;
const PAD_Y = 12;
const FONT = { greeting: 12, body: 9, signature: 9, button: 9 };
const OVERLAY_ALPHA = 0.62;

/**
 * Carta secreta: escena de interfaz que se muestra encima del parque (que queda
 * en pausa). La abre y la cierra el controlador SecretLetter; esta escena solo
 * dibuja, anima y avisa cuando se pulsa "Cerrar" o Escape.
 */
export class LetterScene extends Phaser.Scene {
  constructor() {
    super('Letter');
  }

  init(data) {
    this.controller = data.controller;
    this.closing = false;
  }

  create() {
    const s = this.registry.get('pixelScale');
    this.pixelScale = s;
    this.cameras.main.setZoom(s).centerOn(GAME.width / 2, GAME.height / 2);

    // Fondo oscurecido. Es interactivo para que ningún toque "atraviese" la carta.
    this.overlay = this.add
      .rectangle(0, 0, GAME.width, GAME.height, COLORS.overlay, 1)
      .setOrigin(0)
      .setAlpha(0)
      .setInteractive();

    this.buildCard();

    // Entrada suave: el fondo se oscurece y la carta sube un poquito mientras aparece
    this.tweens.add({ targets: this.overlay, alpha: OVERLAY_ALPHA, duration: 320 });
    const appear = { t: 0 };
    this.card.setAlpha(0);
    this.tweens.add({
      targets: appear,
      t: 1,
      duration: 420,
      ease: 'Sine.easeOut',
      onUpdate: () => this.placeCard(appear.t),
    });

    this.input.keyboard?.on('keydown-ESC', () => this.controller.close());
    // Si alguien detiene esta escena directamente, el parque no debe quedar en pausa.
    this.events.once('shutdown', () => {
      if (this.controller?.isOpen) this.controller.close();
    });
  }

  text(content, size, color, extra = {}) {
    const s = this.pixelScale;
    return this.add
      .text(0, 0, content, {
        fontFamily: `"${GAME.fontFamily}"`,
        fontSize: `${size * s}px`,
        color,
        ...extra,
      })
      .setScale(1 / s);
  }

  buildCard() {
    const s = this.pixelScale;
    const innerW = CARD_WIDTH - PAD_X * 2;
    const size = (t) => ({ w: Math.ceil(t.width / s), h: Math.ceil(t.height / s) });

    const greeting = this.text(LETTER.greeting, FONT.greeting, COLORS.title);
    const body = this.text(LETTER.body.join('\n\n'), FONT.body, COLORS.body, {
      align: 'center',
      wordWrap: { width: innerW * s, useAdvancedWrap: true },
      lineSpacing: 2 * s,
    });
    const signature = this.text(LETTER.signature, FONT.signature, COLORS.signature);
    const label = this.text(LETTER.closeLabel, FONT.button, COLORS.button);
    const heart = this.add.image(0, 0, 'emotes', EMOTE_FRAMES.heart).setOrigin(0);

    const g = size(greeting);
    const b = size(body);
    const sig = size(signature);
    const l = size(label);
    const button = { w: l.w + 16, h: l.h + 6 };

    const H = PAD_Y + g.h + 7 + b.h + 8 + sig.h + 9 + button.h + PAD_Y;
    const W = CARD_WIDTH;
    this.cardX = Math.round((GAME.width - W) / 2);
    this.cardY = Math.round((GAME.height - H) / 2);

    // ---- Tarjeta (coordenadas locales: 0,0 = esquina superior izquierda)
    const gr = this.add.graphics();
    gr.fillStyle(COLORS.shadow, 0.4);
    gr.fillRect(2, H, W - 2, 2);
    gr.fillRect(W, 2, 2, H - 1);
    gr.fillStyle(COLORS.burgundy);
    gr.fillRect(2, 0, W - 4, H);
    gr.fillRect(0, 2, W, H - 4);
    gr.fillRect(1, 1, W - 2, H - 2);
    gr.fillStyle(COLORS.cream);
    gr.fillRect(2, 1, W - 4, H - 2);
    gr.fillRect(1, 2, W - 2, H - 4);
    // Marco interior rosa
    gr.fillStyle(COLORS.pink);
    gr.fillRect(4, 4, W - 8, 1);
    gr.fillRect(4, H - 5, W - 8, 1);
    gr.fillRect(4, 4, 1, H - 8);
    gr.fillRect(W - 5, 4, 1, H - 8);
    // Corazoncitos en las esquinas
    const corners = [
      [7, 6],
      [W - 16, 6],
    ].map(([x, y]) => this.add.image(x, y, 'emotes', EMOTE_FRAMES.miniHeart).setOrigin(0));

    // ---- Texto
    let y = PAD_Y;
    const groupW = g.w + 3 + heart.width;
    const gx = Math.round((W - groupW) / 2);
    greeting.setPosition(gx, y);
    this.heartBaseY = y + Math.round((g.h - heart.height) / 2);
    heart.setPosition(gx + g.w + 3, this.heartBaseY);
    y += g.h + 7;
    body.setPosition(Math.round((W - b.w) / 2), y);
    y += b.h + 8;
    signature.setPosition(Math.round((W - sig.w) / 2), y);
    y += sig.h + 9;

    // ---- Botón "Cerrar"
    const bx = Math.round((W - button.w) / 2);
    const by = y;
    const btn = this.add.graphics();
    const drawButton = (fill, offset = 0) => {
      btn.clear();
      btn.fillStyle(COLORS.burgundy);
      btn.fillRect(bx + 1, by + offset, button.w - 2, button.h);
      btn.fillRect(bx, by + 1 + offset, button.w, button.h - 2);
      btn.fillStyle(fill);
      btn.fillRect(bx + 2, by + 1 + offset, button.w - 4, button.h - 2);
      btn.fillRect(bx + 1, by + 2 + offset, button.w - 2, button.h - 4);
      label.setPosition(bx + 8, by + 3 + offset);
    };
    drawButton(COLORS.pinkSoft);

    this.card = this.add.container(this.cardX, this.cardY, [gr, ...corners, greeting, heart, body, signature, btn, label]);
    this.heart = heart;

    // Zona táctil generosa para el botón (en coordenadas del mundo)
    const zone = this.add
      .zone(this.cardX + bx + button.w / 2, this.cardY + by + button.h / 2, button.w + 12, button.h + 10)
      .setInteractive({ useHandCursor: true });
    let pressed = false;
    zone.on('pointerover', () => drawButton(COLORS.pink));
    zone.on('pointerout', () => {
      pressed = false;
      drawButton(COLORS.pinkSoft);
    });
    zone.on('pointerdown', () => {
      pressed = true;
      drawButton(COLORS.pink, 1);
    });
    zone.on('pointerup', () => {
      if (pressed) this.controller.close();
      pressed = false;
    });

    // Corazón animado: late subiendo 1 px y suelta corazoncitos de vez en cuando
    this.emotes = new Emotes(this);
    let up = false;
    this.time.addEvent({
      delay: 380,
      loop: true,
      callback: () => {
        up = !up;
        heart.setY(this.heartBaseY - (up ? 1 : 0));
      },
    });
    this.time.addEvent({
      delay: 1500,
      loop: true,
      callback: () => {
        if (this.closing) return;
        this.emotes.burst('miniHeart', this.card.x + heart.x + 4, this.card.y + heart.y, 1, { rise: 10, durationMs: 1100 });
      },
    });
  }

  /** Coloca la carta según el progreso de la transición (0 = oculta, 1 = en su sitio). */
  placeCard(t) {
    this.card.setAlpha(t);
    this.card.setY(Math.round(this.cardY + (1 - t) * 8));
  }

  /** Oculta la carta (con transición, o al instante) y detiene la escena. */
  dismiss(done, { immediate = false } = {}) {
    if (immediate) {
      this.scene.stop();
      done();
      return;
    }
    if (this.closing) return;
    this.closing = true;
    this.tweens.add({ targets: this.overlay, alpha: 0, duration: 260 });
    const hide = { t: 1 };
    this.tweens.add({
      targets: hide,
      t: 0,
      duration: 260,
      ease: 'Sine.easeIn',
      onUpdate: () => this.placeCard(hide.t),
      onComplete: () => {
        this.scene.stop();
        done();
      },
    });
  }
}
