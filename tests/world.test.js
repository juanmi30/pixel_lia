import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/systems/World.js';
import { WORLD } from '../src/config/world.js';

const bounds = { x: 0, y: 0, width: 100, height: 100 };

test('meetingPoint prefiere el lado desde el que llega el actor', () => {
  const world = new World(bounds);
  assert.deepEqual(world.meetingPoint({ x: 50, y: 50 }, { x: 10, y: 50 }, 10), { x: 40, y: 50 });
  assert.deepEqual(world.meetingPoint({ x: 50, y: 50 }, { x: 90, y: 50 }, 10), { x: 60, y: 50 });
});

test('meetingPoint usa el otro lado si el preferido queda fuera de los límites', () => {
  const world = new World(bounds);
  // El target está pegado al borde izquierdo: el lado izquierdo no es caminable.
  assert.deepEqual(world.meetingPoint({ x: 5, y: 50 }, { x: -20, y: 50 }, 10), { x: 15, y: 50 });
});

test('meetingPoint no devuelve un punto caminable pero sin camino despejado', () => {
  // Un muro vertical separa al actor (izquierda) de ambos lados del target.
  const world = new World(bounds, [{ x: 30, y: 100, blocker: { w: 4, h: 100 } }]);
  assert.equal(world.meetingPoint({ x: 70, y: 50 }, { x: 10, y: 50 }, 10), null);
});

test('meetingPoint devuelve null si ningún lado es caminable', () => {
  const world = new World({ x: 0, y: 0, width: 10, height: 10 });
  assert.equal(world.meetingPoint({ x: 5, y: 5 }, { x: 0, y: 5 }, 20), null);
});

test('randomDestination siempre queda dentro de los límites y sin obstáculos', () => {
  const world = new World(WORLD.walkBounds, WORLD.props);
  const from = { x: 160, y: 120 };
  for (let i = 0; i < 500; i++) {
    const p = world.randomDestination(from, 110, 14);
    if (!p) continue;
    assert.ok(world.isWalkable(p.x, p.y), `destino no caminable: ${p.x},${p.y}`);
    assert.ok(world.isPathClear(from, p), `camino bloqueado hacia ${p.x},${p.y}`);
  }
});

test('las posiciones iniciales de los personajes son caminables', async () => {
  const { CHARACTERS } = await import('../src/config/characters.js');
  const world = new World(WORLD.walkBounds, WORLD.props);
  for (const c of CHARACTERS) assert.ok(world.isWalkable(c.start.x, c.start.y), c.id);
});
