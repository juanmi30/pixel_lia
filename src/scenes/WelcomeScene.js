import Phaser from 'phaser';
import { EMOTE_FRAMES } from '../config/assets.js';
import { CHARACTERS } from '../config/characters.js';
import { GAME } from '../config/game.js';
import { Music } from '../systems/Music.js';
import { animKey, pixelCenterX } from '../utils/anims.js';

const COLORS = {
  overlay: 0x2b2235,
  buttonFill: 0xfffaf2,
  buttonHover: 0xffe3ec,
  outline: 0x3b2a3a,
  text: '#3b2a3a',
};
const BUTTON_FONT = 9; // píxeles de arte

/**
 * Pantalla de bienvenida: título y botón "Entrar a nuestro lugarcito".
 * El toque en el botón es el gesto del usuario que permite iniciar la música
 * (los navegadores bloquean el audio que empieza solo).
 */
export class WelcomeScene extends Phaser.Scene {
  constructor() {
    super('Welcome');
  }

  create() {
    const s = this.registry.get('pixelScale');
    this.pixelScale = s;
    this.entering = false;
    this.cameras.main.setZoom(s).centerOn(GAME.width / 2, GAME.height / 2);

    this.add.image(0, 0, 'park').setOrigin(0);
    this.add.rectangle(0, 0, GAME.width, GAME.height, COLORS.overlay, 0.5).setOrigin(0);

    this.addText(GAME.width / 2, 34, GAME.title, 20, '#fff4e6', true);

    // Los cuatro habitantes, quietos y respirando
    const spacing = 26;
    const startX = GAME.width / 2 - (spacing * (CHARACTERS.length - 1)) / 2;
    CHARACTERS.forEach((def, i) => {
      const x = Math.round(startX + i * spacing);
      this.add.image(x, 112, 'shadow');
      const sprite = this.add.sprite(x, 113, def.texture, 0);
      sprite.setOrigin(pixelCenterX(sprite.width), 1).play(animKey(def.texture, 'idle'));
    });

    this.createButton(GAME.width / 2, 140);
    this.input.keyboard?.on('keydown-ENTER', () => this.enter());
    this.input.keyboard?.on('keydown-SPACE', () => this.enter());
  }

  addText(x, y, text, size, color, stroke = false) {
    const s = this.pixelScale;
    return this.add
      .text(x, y, text, {
        fontFamily: `"${GAME.fontFamily}"`,
        fontSize: `${size * s}px`,
        color,
        ...(stroke ? { stroke: '#3b2a3a', strokeThickness: 2 * s } : {}),
      })
      .setOrigin(0.5, 0.5)
      .setScale(1 / s);
  }

  createButton(cx, cy) {
    const s = this.pixelScale;
    const label = this.add
      .text(0, 0, GAME.welcome.button, {
        fontFamily: `"${GAME.fontFamily}"`,
        fontSize: `${BUTTON_FONT * s}px`,
        color: COLORS.text,
      })
      .setScale(1 / s);
    const heart = this.add.image(0, 0, 'emotes', EMOTE_FRAMES.heart).setOrigin(0);

    const textW = Math.ceil(label.width / s);
    const textH = Math.ceil(label.height / s);
    const w = 8 + textW + 3 + heart.width + 8;
    const h = Math.max(textH, heart.height) + 8;
    const x = Math.round(cx - w / 2);
    const y = Math.round(cy - h / 2);

    label.setPosition(x + 8, y + Math.floor((h - textH) / 2));
    heart.setPosition(x + 8 + textW + 3, y + Math.floor((h - heart.height) / 2));

    const g = this.add.graphics();
    const draw = (fill, offset = 0) => {
      g.clear();
      // sombra
      g.fillStyle(COLORS.outline, 0.35);
      g.fillRect(x + 2, y + h, w - 2, 2);
      g.fillStyle(COLORS.outline);
      g.fillRect(x + 1, y + offset, w - 2, h);
      g.fillRect(x, y + 1 + offset, w, h - 2);
      g.fillStyle(fill);
      g.fillRect(x + 2, y + 1 + offset, w - 4, h - 2);
      g.fillRect(x + 1, y + 2 + offset, w - 2, h - 4);
      label.setY(y + Math.floor((h - textH) / 2) + offset);
      heart.setY(y + Math.floor((h - heart.height) / 2) + offset);
    };
    draw(COLORS.buttonFill);
    g.setDepth(1);
    label.setDepth(2);
    heart.setDepth(2);

    // Zona táctil un poco más grande que el botón
    const zone = this.add.zone(cx, cy, w + 8, h + 8).setInteractive({ useHandCursor: true });
    let pressed = false;
    zone.on('pointerover', () => draw(COLORS.buttonHover));
    zone.on('pointerout', () => {
      pressed = false;
      draw(COLORS.buttonFill);
    });
    zone.on('pointerdown', () => {
      pressed = true;
      draw(COLORS.buttonHover, 1);
    });
    zone.on('pointerup', () => {
      if (pressed) this.enter();
      pressed = false;
    });
  }

  enter() {
    if (this.entering) return;
    this.entering = true;
    Music.start(this); // dentro del gesto del usuario
    this.cameras.main.fadeOut(350, 43, 34, 53);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Park'));
  }
}
