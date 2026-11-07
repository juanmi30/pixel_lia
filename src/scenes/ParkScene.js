import Phaser from 'phaser';
import { CHARACTERS } from '../config/characters.js';
import { GAME } from '../config/game.js';
import { WORLD } from '../config/world.js';
import { Character } from '../entities/Character.js';
import { Emotes } from '../fx/Emotes.js';
import { InteractionDirector } from '../systems/InteractionDirector.js';
import { World } from '../systems/World.js';
import { SpeechBubbles } from '../ui/SpeechBubbles.js';
import { animKey, pixelCenterX } from '../utils/anims.js';
import { randomBetween } from '../utils/random.js';

/** Escena principal: el parque con sus cuatro habitantes. */
export class ParkScene extends Phaser.Scene {
  constructor() {
    super('Park');
  }

  create() {
    this.pixelScale = this.registry.get('pixelScale');

    // La cámara amplía el mundo de 320x180 con un zoom entero.
    this.cameras.main.setZoom(this.pixelScale).centerOn(GAME.width / 2, GAME.height / 2);

    this.buildScenery();

    this.world = new World(WORLD.walkBounds, WORLD.props);
    this.characters = CHARACTERS.map((def) => new Character(this, def, this.world));
    this.bubbles = new SpeechBubbles(this, this.pixelScale);
    this.emotes = new Emotes(this);
    this.director = new InteractionDirector({
      scene: this,
      characters: this.characters,
      world: this.world,
      bubbles: this.bubbles,
      emotes: this.emotes,
    });
    this.director.start();

    // Recibe todos los objetos bajo el puntero, no solo el de encima.
    this.input.topOnly = false;
    this.input.on('pointerdown', this.handlePointerDown, this);

    this.showIntro();
  }

  /**
   * Cuando dos personajes están juntos sus zonas táctiles se solapan; se elige
   * el que tenga el centro más cerca del punto tocado.
   */
  handlePointerDown(pointer, objectsUnderPointer) {
    let nearest = null;
    let best = Infinity;
    for (const object of objectsUnderPointer) {
      const character = object.getData?.('character');
      if (!character) continue;
      const d = character.distanceSqTo(pointer.worldX, pointer.worldY);
      if (d < best) {
        best = d;
        nearest = character;
      }
    }
    nearest?.tap();
  }

  update(_time, delta) {
    // Si la pestaña estuvo en segundo plano, evita "saltos" enormes.
    const dt = Math.min(delta, 100);
    for (const character of this.characters) character.update(dt);
    this.bubbles.update();
  }

  buildScenery() {
    this.add.image(0, 0, 'park').setOrigin(0).setDepth(0);

    for (const prop of WORLD.props) {
      const image = this.add.image(prop.x, prop.y, prop.texture, prop.frame);
      image.setOrigin(pixelCenterX(image.width), 1).setDepth(prop.y);
    }

    for (const flower of WORLD.flowers) {
      const sprite = this.add.sprite(flower.x, flower.y, 'flowers', flower.v * 2);
      sprite.setOrigin(pixelCenterX(sprite.width), 1).setDepth(flower.y - 2);
      sprite.play({ key: animKey('flowers', flower.v), delay: randomBetween(0, 1400) });
      sprite.anims.timeScale = randomBetween(0.75, 1.25);
    }
  }

  /** Título suave que aparece al inicio y se desvanece. */
  showIntro() {
    const s = this.pixelScale;
    const style = (size, color) => ({
      fontFamily: `"${GAME.fontFamily}"`,
      fontSize: `${size * s}px`,
      color,
      stroke: '#3b2a3a',
      strokeThickness: 2 * s,
      align: 'center',
    });

    const title = this.add.text(GAME.width / 2, 16, GAME.title, style(16, '#fff4e6')).setOrigin(0.5, 0);
    const subtitle = this.add
      .text(GAME.width / 2, 36, GAME.intro.subtitle, style(8, '#ffd6e2'))
      .setOrigin(0.5, 0);

    const texts = [title, subtitle];
    const tweens = texts.map((text) => {
      text.setScale(1 / s).setDepth(20000).setAlpha(0);
      return this.tweens.add({
        targets: text,
        alpha: 1,
        duration: 900,
        hold: GAME.intro.holdMs,
        yoyo: true,
        onComplete: () => text.destroy(),
      });
    });

    // Al primer toque el título se retira para no tapar los diálogos.
    this.input.once('pointerdown', () => {
      tweens.forEach((tween) => tween.remove());
      this.tweens.add({
        targets: texts.filter((t) => t.active),
        alpha: 0,
        duration: 300,
        onComplete: () => texts.forEach((t) => t.destroy()),
      });
    });
  }
}
