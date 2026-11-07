import Phaser from 'phaser';
import { CHARACTERS } from '../config/characters.js';
import { GAME } from '../config/game.js';
import { WORLD } from '../config/world.js';
import { Character } from '../entities/Character.js';
import { Emotes } from '../fx/Emotes.js';
import { InteractionDirector } from '../systems/InteractionDirector.js';
import { Music } from '../systems/Music.js';
import { pickTapTarget } from '../systems/pointer.js';
import { SecretLetter } from '../systems/SecretLetter.js';
import { World } from '../systems/World.js';
import { SoundToggle } from '../ui/SoundToggle.js';
import { SpeechBubbles } from '../ui/SpeechBubbles.js';
import { animKey, pixelCenterX } from '../utils/anims.js';
import { randomBetween, randomInRange } from '../utils/random.js';

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

    this.createSecret();

    // Recibe todos los objetos bajo el puntero, no solo el de encima.
    this.input.topOnly = false;
    this.input.on('pointerdown', this.handlePointerDown, this);

    this.showIntro();

    // Botón discreto de sonido, arriba a la derecha (fuera de la zona caminable)
    if (Music.isAvailable(this)) this.soundToggle = new SoundToggle(this, GAME.width - 19, 4);
  }

  /** Personajes primero (el más cercano al dedo); si no hay ninguno, la flor secreta. */
  handlePointerDown(pointer, objectsUnderPointer) {
    const target = pickTapTarget(objectsUnderPointer, pointer.worldX, pointer.worldY, {
      blocked: this.letter.isActive,
    });
    if (target?.type === 'character') target.character.tap();
    else if (target?.type === 'secret') this.letter.open();
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

  /** La flor escondida junto al estanque y la carta que abre. */
  createSecret() {
    const cfg = WORLD.secretFlower;
    const flower = this.add.sprite(cfg.x, cfg.y, 'secretFlower', 0);
    flower.setOrigin(pixelCenterX(flower.width), 1).setDepth(cfg.y - 2);
    flower.play(animKey('secretFlower', 'sway'));

    // Zona táctil cómoda, centrada en la flor. No es un obstáculo: está fuera de
    // la zona caminable y los personajes tienen prioridad al tocar.
    const zone = this.add
      .zone(cfg.x, Math.round(cfg.y - flower.height / 2), cfg.hitSize, cfg.hitSize)
      .setInteractive({ useHandCursor: true });
    zone.setData('secret', true);

    // Brillo discreto y ocasional (el reloj de la escena se pausa con la carta)
    const sparkle = () => {
      this.emotes.burst('sparkle', cfg.x + Math.round(randomBetween(-3, 3)), cfg.y - flower.height + 2, 1, {
        rise: 5,
        durationMs: 900,
      });
      this.time.delayedCall(randomInRange(cfg.sparkleEveryMs), sparkle);
    };
    this.time.delayedCall(randomInRange([1500, 3500]), sparkle);

    this.letter = new SecretLetter({
      pausePark: () => this.scene.pause(),
      resumePark: () => this.scene.resume(),
      showLetter: () => this.scene.launch('Letter', { controller: this.letter }),
      hideLetter: (done, options = {}) => {
        const letterScene = this.scene.get('Letter');
        if (letterScene?.sys.isActive() && letterScene.dismiss) letterScene.dismiss(done, options);
        else done();
      },
    });
    // Al cerrar la carta, dos corazoncitos sobre Miguel y Lía
    this.letter.on('closed', () => {
      for (const id of ['miguel', 'lia']) {
        const c = this.characters.find((ch) => ch.id === id);
        if (c) this.emotes.burst('miniHeart', c.x, c.top - 2, 1);
      }
    });
    this.events.once('shutdown', () => this.letter.destroy());
  }

  /** Mensaje suave al entrar (el título ya se vio en la bienvenida). */
  showIntro() {
    const s = this.pixelScale;
    const subtitle = this.add
      .text(GAME.width / 2, 16, GAME.intro.subtitle, {
        fontFamily: `"${GAME.fontFamily}"`,
        fontSize: `${8 * s}px`,
        color: '#ffd6e2',
        stroke: '#3b2a3a',
        strokeThickness: 2 * s,
        align: 'center',
      })
      .setOrigin(0.5, 0)
      .setScale(1 / s)
      .setDepth(20000)
      .setAlpha(0);

    const tween = this.tweens.add({
      targets: subtitle,
      alpha: 1,
      duration: 900,
      hold: GAME.intro.holdMs,
      yoyo: true,
      onComplete: () => subtitle.destroy(),
    });

    // Al primer toque se retira para no tapar los diálogos.
    this.input.once('pointerdown', () => {
      if (!subtitle.active) return;
      tween.remove();
      this.tweens.add({ targets: subtitle, alpha: 0, duration: 300, onComplete: () => subtitle.destroy() });
    });
  }
}
