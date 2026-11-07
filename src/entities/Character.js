import { BEHAVIOR } from '../config/behavior.js';
import { animKey, pixelCenterX } from '../utils/anims.js';
import { Emitter } from '../utils/Emitter.js';
import { randomInRange } from '../utils/random.js';

export const STATE = Object.freeze({
  IDLE: 'idle',
  WALKING: 'walking',
  INTERACTING: 'interacting',
  SLEEPING: 'sleeping',
});

/** Zona táctil rectangular (sin depender de Phaser.Geom). */
const containsPoint = (area, x, y) => x >= area.x && y >= area.y && x < area.x + area.width && y < area.y + area.height;

/**
 * Un habitante del parque.
 *
 * La lógica (posición, estado, temporizadores) se guarda en el propio objeto;
 * el sprite solo refleja ese estado en syncView(). Por eso cambiar el arte no
 * afecta al comportamiento, y la lógica puede probarse sin Phaser (`npm test`).
 *
 * Estados:
 *   idle        quieto; tras un tiempo aleatorio pasea (o, si tiene `nap`, a veces se duerme).
 *   walking     camina en línea recta hacia un destino.
 *   interacting reacciona (al tocarlo o en un encuentro) y no se mueve.
 *   sleeping    siesta: no pasea ni participa en encuentros; se despierta solo o al tocarlo.
 *
 * `reserved` indica que el director de interacciones lo está usando: mientras
 * esté reservado no pasea ni se duerme.
 * `posing` indica que una acción especial (p. ej. el abrazo) controla su
 * imagen: se oculta su sprite y el saltito del toque se omite.
 *
 * Emite: 'tap' (character), 'sleep' (character), 'wake' (character, byTap).
 */
export class Character extends Emitter {
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
    this.posing = false;

    this.state = null;
    this.stateTime = 0;
    this.waitMs = 0;
    this.destination = null;
    this.onArrive = null;

    /** Reloj propio (ms) para las reglas de siesta. */
    this.elapsed = 0;
    this.lastNapEnd = -Infinity;

    this.shadow = scene.add.image(0, 0, 'shadow').setDepth(1);
    this.sprite = scene.add.sprite(0, 0, def.texture, 0);
    this.sprite.setOrigin(pixelCenterX(this.sprite.width), 1);

    // Zona táctil algo mayor que el sprite: más fácil de tocar en el celular.
    const pad = 4;
    this.sprite.setInteractive({
      hitArea: { x: -pad, y: -pad, width: this.sprite.width + pad * 2, height: this.sprite.height + pad * 2 },
      hitAreaCallback: containsPoint,
      useHandCursor: true,
    });
    // El toque lo decide la escena (ParkScene.handlePointerDown): cuando varias
    // zonas táctiles se solapan, elige al personaje más cercano al dedo.
    this.sprite.setData('character', this);

    this.idle(randomInRange([300, 2500]));
    this.syncView();
  }

  /** Coordenada y de la parte superior visible (para globos y emotes). */
  get top() {
    return this.y + this.hopOffset - this.def.height;
  }

  /** Distancia (al cuadrado) entre un punto y el centro visible del personaje. */
  distanceSqTo(x, y) {
    return (x - this.x) ** 2 + (y - (this.y - this.def.height / 2)) ** 2;
  }

  /** Notifica que lo han tocado o le han hecho clic. */
  tap() {
    this.emit('tap', this);
  }

  /** Libre = puede participar en una interacción espontánea. */
  isFree() {
    return !this.reserved && this.state !== STATE.INTERACTING && this.state !== STATE.SLEEPING;
  }

  isSleeping() {
    return this.state === STATE.SLEEPING;
  }

  reserve() {
    this.reserved = true;
  }

  release() {
    this.reserved = false;
    this.setPosing(false);
    if (this.state !== STATE.WALKING) this.idle();
  }

  /**
   * Cede (o recupera) su imagen a una acción especial. Mientras posa, su sprite
   * se oculta pero sigue recibiendo toques.
   */
  setPosing(posing) {
    this.posing = posing;
    this.sprite.setVisible(!posing);
    if (this.sprite.input) this.sprite.input.alwaysEnabled = posing;
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
    this.perform('react', durationMs);
  }

  /** Reproduce una animación propia durante `durationMs` sin moverse; luego vuelve a idle. */
  perform(animName, durationMs) {
    this.setState(STATE.INTERACTING, durationMs);
    this.play(animName);
  }

  /** Se queda quieto indefinidamente (hasta release()). */
  hold() {
    this.setState(STATE.INTERACTING, Infinity);
    this.play('idle');
  }

  /** Siesta durante `durationMs` (solo si el personaje tiene configuración `nap`). */
  sleep(durationMs = randomInRange(this.def.nap.durationMs)) {
    this.setState(STATE.SLEEPING, durationMs);
    this.play('sleep');
    this.emit('sleep', this);
  }

  /** Despierta de la siesta. Devuelve false si no estaba dormido. */
  wake(byTap = false) {
    if (this.state !== STATE.SLEEPING) return false;
    this.lastNapEnd = this.elapsed;
    this.idle();
    this.emit('wake', this, byTap);
    return true;
  }

  /** ¿Toca dormir ahora? Solo libre de encuentros, con su probabilidad y respetando la pausa entre siestas. */
  wantsNap() {
    const nap = this.def.nap;
    if (!nap || this.reserved) return false;
    if (this.elapsed - this.lastNapEnd < nap.cooldownMs) return false;
    return Math.random() < nap.chance;
  }

  /** Reacción al toque: saltito y, si no está ocupado, se detiene un momento. */
  reactToTap() {
    if (!this.posing) this.hop();
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
    this.elapsed += delta;
    this.stateTime += delta;

    switch (this.state) {
      case STATE.IDLE:
        if (!this.reserved && this.stateTime >= this.waitMs) {
          if (this.wantsNap()) this.sleep();
          else this.wander();
        }
        break;
      case STATE.WALKING:
        this.step(delta);
        break;
      case STATE.INTERACTING:
        if (this.stateTime >= this.waitMs) this.idle();
        break;
      case STATE.SLEEPING:
        if (this.stateTime >= this.waitMs) this.wake(false);
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
