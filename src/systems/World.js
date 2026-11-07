import { randomBetween } from '../utils/random.js';

/**
 * Geometría del parque: límites caminables y obstáculos.
 * Es lógica pura (no dibuja nada): los personajes le preguntan dónde pueden ir.
 */
export class World {
  /**
   * @param {{x:number,y:number,width:number,height:number}} walkBounds
   * @param {Array<{x:number,y:number,blocker?:{w:number,h:number}}>} props
   */
  constructor(walkBounds, props = []) {
    this.bounds = { ...walkBounds };
    this.obstacles = props
      .filter((p) => p.blocker)
      .map((p) => ({
        x: p.x - p.blocker.w / 2,
        y: p.y - p.blocker.h,
        width: p.blocker.w,
        height: p.blocker.h,
      }));
  }

  /** Ajusta un punto para que quede dentro de los límites caminables. */
  clamp(x, y) {
    const b = this.bounds;
    return {
      x: Math.min(Math.max(x, b.x), b.x + b.width),
      y: Math.min(Math.max(y, b.y), b.y + b.height),
    };
  }

  isInside(x, y) {
    const b = this.bounds;
    return x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height;
  }

  isBlocked(x, y) {
    return this.obstacles.some(
      (o) => x >= o.x && x <= o.x + o.width && y >= o.y && y <= o.y + o.height,
    );
  }

  isWalkable(x, y) {
    return this.isInside(x, y) && !this.isBlocked(x, y);
  }

  /** Comprueba (muestreando) que la línea recta entre dos puntos no cruza obstáculos. */
  isPathClear(from, to) {
    const steps = Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / 3);
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      if (this.isBlocked(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t)) return false;
    }
    return true;
  }

  /**
   * Busca un destino aleatorio alcanzable en línea recta.
   * Devuelve null si no encuentra ninguno tras varios intentos.
   */
  randomDestination(from, radius, minDistance = 0, tries = 14) {
    for (let i = 0; i < tries; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = randomBetween(minDistance, Math.max(radius, minDistance + 1));
      const p = this.clamp(from.x + Math.cos(angle) * dist, from.y + Math.sin(angle) * dist * 0.75);
      if (Math.hypot(p.x - from.x, p.y - from.y) < minDistance) continue;
      if (this.isWalkable(p.x, p.y) && this.isPathClear(from, p)) return p;
    }
    return null;
  }

  /**
   * Punto junto a `target` (a izquierda o derecha, a `distance` px) para que
   * alguien que viene desde `from` se coloque a su lado.
   *
   * Solo devuelve puntos caminables Y alcanzables en línea recta desde `from`,
   * y (si se indica) a más de `clearance` px de cada punto de `avoid` (otros
   * personajes), para que el encuentro no quede encima de un tercero.
   * Si ningún lado cumple las condiciones devuelve null y el encuentro se cancela.
   */
  meetingPoint(target, from, distance, avoid = [], clearance = 0) {
    const preferred = Math.sign(from.x - target.x) || 1;
    for (const side of [preferred, -preferred]) {
      const p = { x: target.x + side * distance, y: target.y };
      const crowded = avoid.some((o) => Math.hypot(o.x - p.x, o.y - p.y) < clearance);
      if (!crowded && this.isWalkable(p.x, p.y) && this.isPathClear(from, p)) return p;
    }
    return null;
  }
}
