/**
 * Emisor de eventos mínimo (on / once / off / emit) con contexto opcional.
 * Permite que la lógica de los personajes no dependa de Phaser y pueda
 * probarse con `npm test`.
 */
export class Emitter {
  #listeners = new Map();

  on(event, fn, context) {
    if (!this.#listeners.has(event)) this.#listeners.set(event, []);
    this.#listeners.get(event).push({ fn, context, once: false });
    return this;
  }

  once(event, fn, context) {
    this.on(event, fn, context);
    this.#listeners.get(event).at(-1).once = true;
    return this;
  }

  off(event, fn) {
    const list = this.#listeners.get(event);
    if (list) this.#listeners.set(event, fn ? list.filter((l) => l.fn !== fn) : []);
    return this;
  }

  emit(event, ...args) {
    const list = this.#listeners.get(event);
    if (!list?.length) return false;
    this.#listeners.set(event, list.filter((l) => !l.once));
    for (const l of list) l.fn.apply(l.context, args);
    return true;
  }

  removeAllListeners() {
    this.#listeners.clear();
    return this;
  }
}
