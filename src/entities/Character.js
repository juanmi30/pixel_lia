import Phaser from 'phaser';
import { BEHAVIOR } from '../config/behavior.js';
import { randomInRange } from '../utils/random.js';
import { animKey, pixelCenterX } from '../utils/anims.js';

export const STATE = Object.freeze({
  IDLE: 'idle',
  WALKING: 'walking',
  INTERACTING: 'interacting',
});

/**
 * Un habitante del parque.
 *
 * La lógica (posición, estado, temporizadores) se guarda en el propio objeto;
 * el sprite solo refleja ese estado en syncView(). Por eso cambiar el arte no
 * afecta al comportamiento.
 *
 * Estados:
 *   idle        quieto; tras un tiempo aleatorio elige un destino y pasea.
 *   walking     camina en línea recta hacia un destino.
 *   interacting reacciona (al tocarlo o en un encuentro) y no se mueve.
 *
 * `reserved` indica que el director de interacciones lo está usando: mientras
 * esté reservado no pasea por su cuenta.
 *
 * Emite: 'tap' (character) cuando lo tocan o hacen clic.
 */
export class Character extends Phaser.Events.EventEmitter {
  constructor(scene, def, world) {
    super();
    this.scene = scene;
    this.def = def;
    this.world = world;
    this.id = def.id;
    this.name = def.name;

    const start = world.clamp(def.start.x, def.start.y);
    this.x = start.x;
    this.y = start.y;
    this.hopOffset = 0;
    this.reserved = false;

    this.state = null;
    this.stateTime = 0;
    this.waitMs = 0;
    this.destination = null;
    this.onArrive = null;

    this.shadow = scene.add.image(0, 0, 'shadow').setDepth(1);
    this.sprite = scene.add.sprite(0, 0, def.texture, 0);
    this.sprite.setOrigin(pixelCenterX(this.sprite.width), 1);

    // Zona táctil algo mayor que el sprite: más fácil de tocar en el celular.
    const pad = 4;
    this.sprite.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(-pad, -pad, this.sprite.width + pad * 2, this.sprite.height + pad * 2),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    });
    this.sprite.on('pointerdown', () => this.emit('tap', this));

    this.idle(randomInRange([300, 2500]));
    this.syncView();
  }

  /** Coordenada y de la parte superior visible (para globos y emotes). */
  get top() {
    return this.y + this.hopOffset - this.def.height;
  }

  /** Libre = puede participar en una interacción espontánea. */
  isFree() {
    return !this.reserved && this.state !== STATE.INTERACTING;
  }

  reserve() {
    this.reserved = true;
  }

  release() {
    this.reserved = false;
    if (this.state !== STATE.WALKING) this.idle();
  }

  // ---------------------------------------------------------------- estados

  idle(waitMs = randomInRange(this.def.idleMs)) {
    this.setState(STATE.IDLE, waitMs);
    this.play('idle');
  }

  walkTo(x, y, onArrive = null) {
    const dest = this.world.clamp(x, y);
    this.setState(STATE.WALKING, BEHAVIOR.walkTimeoutMs);
    this.destination = dest;
    this.onArrive = onArrive;
    this.face(dest.x);
    this.play('walk');
  }

  /** Reacción durante `durationMs` (animación "react"); luego vuelve a idle. */
  interact(durationMs) {
    this.setState(STATE.INTERACTING, durationMs);
    this.play('react');
  }

  /** Se queda quieto indefinidamente (hasta release()). */
  hold() {
    this.setState(STATE.INTERACTING, Infinity);
    this.play('idle');
  }

  /** Reacción al toque: saltito y, si no está ocupado, se detiene un momento. */
  reactToTap() {
    this.hop();
    if (!this.reserved) this.interact(BEHAVIOR.tap.pauseMs);
  }

  face(targetX) {
    if (Math.abs(targetX - this.x) > 0.5) this.sprite.setFlipX(targetX < this.x);
  }

  hop() {
    if (this.hopTween?.isPlaying()) return;
    this.hopTween = this.scene.tweens.add({
      targets: this,
      hopOffset: -BEHAVIOR.tap.hopHeight,
      duration: 130,
      ease: 'Quad.easeOut',
      yoyo: true,
      onComplete: () => {
        this.hopOffset = 0;
      },
    });
  }

  // ---------------------------------------------------------------- ciclo

  update(delta) {
    this.stateTime += delta;

    switch (this.state) {
      case STATE.IDLE:
        if (!this.reserved && this.stateTime >= this.waitMs) this.wander();
        break;
      case STATE.WALKING:
        this.step(delta);
        break;
      case STATE.INTERACTING:
        if (this.stateTime >= this.waitMs) this.idle();
        break;
    }

    this.syncView();
  }

  wander() {
    const dest = this.world.randomDestination(this, this.def.wanderRadius, BEHAVIOR.minWanderDistance);
    if (dest) this.walkTo(dest.x, dest.y);
    else this.idle();
  }

  step(delta) {
    const dx = this.destination.x - this.x;
    const dy = this.destination.y - this.y;
    const dist = Math.hypot(dx, dy);
    const stepLen = (this.def.speed * delta) / 1000;

    if (dist <= stepLen) {
      this.x = this.destination.x;
      this.y = this.destination.y;
      this.finishWalk(true);
    } else if (this.stateTime >= this.waitMs) {
      this.finishWalk(false);
    } else {
      const p = this.world.clamp(this.x + (dx / dist) * stepLen, this.y + (dy / dist) * stepLen);
      this.x = p.x;
      this.y = p.y;
    }
  }

  finishWalk(arrived) {
    const callback = this.onArrive;
    this.onArrive = null;
    this.destination = null;
    this.idle();
    callback?.(arrived);
  }

  // ---------------------------------------------------------------- vista

  setState(state, waitMs) {
    this.state = state;
    this.stateTime = 0;
    this.waitMs = waitMs;
  }

  play(name) {
    this.sprite.play(animKey(this.def.texture, name), true);
  }

  /** Copia la posición lógica al sprite, redondeando a píxeles enteros. */
  syncView() {
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    this.sprite.setPosition(x, Math.round(this.y + this.hopOffset));
    this.sprite.setDepth(this.y);
    this.shadow.setPosition(x, y - 1);
  }
}
