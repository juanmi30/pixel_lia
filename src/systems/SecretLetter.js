import { Emitter } from '../utils/Emitter.js';

/**
 * Estado de la carta secreta (abierta / cerrándose / cerrada), sin depender de
 * Phaser. La escena del parque le da cuatro acciones:
 *
 *   pausePark()              pausa el parque (personajes, temporizadores y toques)
 *   resumePark()             lo reanuda tal como estaba
 *   showLetter()             muestra la carta
 *   hideLetter(done, opts)   la oculta y llama a `done` al terminar;
 *                            con { immediate: true } sin transición
 *
 * Reglas:
 * - Abrir con la carta ya abierta (o mientras se cierra) no hace nada.
 * - Al cerrar, el parque se reanuda cuando la carta terminó de ocultarse.
 * - Si la escena se cierra con la carta abierta, `destroy()` la oculta sin
 *   reanudar nada (la escena ya no existe) y no se puede volver a abrir.
 *
 * Emite 'open' y 'closed'.
 */
export class SecretLetter extends Emitter {
  #state = 'closed'; // 'closed' | 'open' | 'closing'
  #destroyed = false;

  constructor({ pausePark, resumePark, showLetter, hideLetter }) {
    super();
    this.actions = { pausePark, resumePark, showLetter, hideLetter };
  }

  get isOpen() {
    return this.#state === 'open';
  }

  /** Abierta o cerrándose: el parque sigue en pausa y no se aceptan toques en él. */
  get isActive() {
    return this.#state !== 'closed';
  }

  open() {
    if (this.#state !== 'closed' || this.#destroyed) return false;
    this.#state = 'open';
    this.actions.pausePark();
    this.actions.showLetter();
    this.emit('open');
    return true;
  }

  close() {
    if (this.#state !== 'open') return false;
    this.#state = 'closing';
    this.actions.hideLetter(() => {
      if (this.#destroyed) return;
      this.#state = 'closed';
      this.actions.resumePark();
      this.emit('closed');
    });
    return true;
  }

  /** Se llama al cerrar la escena del parque. */
  destroy() {
    if (this.#destroyed) return;
    this.#destroyed = true;
    if (this.#state !== 'closed') this.actions.hideLetter(() => {}, { immediate: true });
    this.#state = 'closed';
    this.removeAllListeners();
  }
}
