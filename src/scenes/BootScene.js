import Phaser from 'phaser';
import { ASSETS, FLOWER_VARIANTS } from '../config/assets.js';
import { CHARACTERS, DEFAULT_ANIMATIONS } from '../config/characters.js';
import { MUSIC_KEY } from '../systems/Music.js';
import { animKey } from '../utils/anims.js';

/** Carga todos los recursos del manifiesto y registra las animaciones. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    const { font, audio, images, spritesheets } = ASSETS;
    this.load.font(font.key, font.url, font.format);
    this.load.audio(MUSIC_KEY, audio.music);
    for (const [key, url] of Object.entries(images)) this.load.image(key, url);
    for (const [key, { url, frameWidth, frameHeight }] of Object.entries(spritesheets)) {
      this.load.spritesheet(key, url, { frameWidth, frameHeight });
    }
    this.load.on('loaderror', (file) => console.error(`[carga] No se pudo cargar "${file.key}" (${file.url})`));
  }

  create() {
    for (const def of CHARACTERS) {
      const animations = { ...DEFAULT_ANIMATIONS, ...def.animations };
      for (const [name, anim] of Object.entries(animations)) {
        this.anims.create({
          key: animKey(def.texture, name),
          frames: anim.frames.map((frame) => ({ key: def.texture, frame })),
          frameRate: anim.frameRate,
          repeat: anim.repeat ?? -1,
        });
      }
    }

    for (let v = 0; v < FLOWER_VARIANTS; v++) {
      this.anims.create({
        key: animKey('flowers', v),
        frames: this.anims.generateFrameNumbers('flowers', { start: v * 2, end: v * 2 + 1 }),
        frameRate: 1.5,
        repeat: -1,
      });
    }

    // Abrazo de Miguel y Lía: abrazados (0) y apretándose un poquito (1)
    this.anims.create({
      key: animKey('hug', 'hold'),
      frames: this.anims.generateFrameNumbers('hug', { start: 0, end: 1 }),
      frameRate: 2.5,
      repeat: -1,
    });

    this.scene.start('Welcome');
  }
}
