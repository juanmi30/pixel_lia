import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { BEHAVIOR } from '../src/config/behavior.js';
import { DIALOGUES } from '../src/config/dialogues.js';
import { STATE } from '../src/entities/Character.js';
import { World } from '../src/systems/World.js';
import { createPark } from './helpers/fakeScene.js';

// Azar controlado: por defecto nadie se duerme (0.99 > probabilidad de siesta).
let randomValue = 0.99;
const realRandom = Math.random;
beforeEach(() => {
  randomValue = 0.99;
  Math.random = () => randomValue;
});
afterEach(() => {
  Math.random = realRandom;
});

const FAR = {
  miguel: { x: 80, y: 150 },
  lia: { x: 200, y: 150 },
  miguelito: { x: 90, y: 90 },
  ratencio: { x: 230, y: 90 },
};

/** Avanza hasta que se cumpla `cond` (o hasta `maxMs`). Devuelve si se cumplió. */
function advanceUntil(park, cond, maxMs = 15000) {
  let ok = false;
  const start = park.scene.time.now;
  while (!ok && park.scene.time.now - start < maxMs) {
    park.advance(16);
    ok = cond();
  }
  return ok;
}

const hugSprites = (park) => park.scene.sprites.filter((s) => s.texture === 'hug');

// ------------------------------------------------------------------ abrazo

test('abrazo: se encuentran, se abrazan a 14 px y luego quedan libres', () => {
  const park = createPark();
  park.place(FAR);
  const miguel = park.get('miguel');
  const lia = park.get('lia');

  assert.equal(park.director.run(park.def('miguel-busca-lia')), true);
  assert.ok(advanceUntil(park, () => hugSprites(park).length === 1), 'debería aparecer el abrazo');

  const hug = hugSprites(park)[0];
  assert.equal(hug.anim, 'hug:hold');
  assert.equal(hug.flipX, false, 'Miguel está a la izquierda: sin voltear');
  assert.equal(Math.abs(lia.x - miguel.x), 14);
  assert.equal(hug.x, (miguel.x + lia.x) / 2, 'el abrazo queda centrado entre los dos');
  assert.ok(miguel.posing && lia.posing);
  assert.equal(miguel.sprite.visible, false, 'el sprite individual se oculta mientras se abrazan');
  assert.equal(miguel.sprite.input.alwaysEnabled, true, 'pero sigue recibiendo toques');

  // Corazoncitos durante el abrazo
  park.advance(BEHAVIOR.specials.hug.holdMs);
  assert.ok(park.emotes.bursts.filter((b) => b.name === 'miniHeart').length >= 3);
  assert.equal(hug.destroyed, true, 'el abrazo termina tras holdMs');
  assert.ok(!miguel.posing && !lia.posing && miguel.sprite.visible && lia.sprite.visible);
  assert.equal(Math.abs(lia.x - miguel.x), park.def('miguel-busca-lia').distance, 'al soltarse vuelven a la distancia normal');

  // Fin del encuentro: libres y con un único temporizador pendiente (el próximo encuentro)
  assert.ok(advanceUntil(park, () => park.director.active === null, 5000));
  assert.ok(!miguel.reserved && !lia.reserved);
  assert.ok(miguel.isFree() && lia.isFree());
  assert.equal(park.scene.pendingTimers(), 1);
});

test('abrazo: si Miguel queda a la derecha, la imagen se voltea', () => {
  const park = createPark();
  park.place({ ...FAR, lia: { x: 80, y: 150 }, miguel: { x: 200, y: 150 } });
  park.director.run(park.def('lia-busca-miguel'));
  assert.ok(advanceUntil(park, () => hugSprites(park).length === 1));
  assert.equal(hugSprites(park)[0].flipX, true);
  assert.ok(park.get('miguel').x > park.get('lia').x);
});

test('abrazo: tocar a Lía durante el abrazo muestra su frase sin romperlo', () => {
  const park = createPark();
  park.place(FAR);
  const lia = park.get('lia');
  park.director.run(park.def('miguel-busca-lia'));
  assert.ok(advanceUntil(park, () => hugSprites(park).length === 1));

  const tweensBefore = park.scene.tweenLog.length;
  lia.tap();
  const said = park.bubbles.said.at(-1);
  assert.equal(said.id, 'lia');
  assert.ok(DIALOGUES.tap.lia.includes(said.text));
  assert.equal(park.scene.tweenLog.length, tweensBefore, 'sin saltito mientras posa');
  assert.ok(lia.posing && lia.reserved, 'sigue abrazada');
  assert.equal(hugSprites(park)[0].destroyed, false);

  assert.ok(advanceUntil(park, () => park.director.active === null, 6000));
  assert.ok(!lia.reserved && !lia.posing);
});

test('abrazo: si el camino falla no hay abrazo y ambos quedan libres', () => {
  const park = createPark();
  park.place(FAR);
  const miguel = park.get('miguel');
  park.director.run(park.def('miguel-busca-lia'));
  park.advance(500);
  miguel.finishWalk(false); // como si se agotara el tiempo de paseo
  assert.equal(park.director.active, null);
  assert.equal(hugSprites(park).length, 0);
  assert.ok(!miguel.reserved && !park.get('lia').reserved);
});

test('cerrar la escena en pleno abrazo cancela temporizadores y libera a todos', () => {
  const park = createPark();
  park.place(FAR);
  park.director.run(park.def('miguel-busca-lia'));
  assert.ok(advanceUntil(park, () => hugSprites(park).length === 1));

  // Como en Phaser: al cerrar la escena los sprites ya están destruidos y no pueden animarse
  for (const c of park.characters) {
    c.sprite.play = () => {
      throw new Error('sprite destruido');
    };
  }
  assert.doesNotThrow(() => park.scene.events.emit('shutdown'));
  assert.equal(park.scene.pendingTimers(), 0);
  assert.equal(hugSprites(park)[0].destroyed, true);
  for (const id of ['miguel', 'lia']) {
    const c = park.get(id);
    assert.ok(!c.reserved && !c.posing, id);
  }
  assert.equal(park.director.run(park.def('peluches-juegan')), false, 'un director cerrado no inicia más encuentros');
});

test('solo hay un encuentro a la vez', () => {
  const park = createPark();
  park.place(FAR);
  assert.equal(park.director.run(park.def('miguel-busca-lia')), true);
  assert.equal(park.director.run(park.def('peluches-juegan')), false);
  assert.ok(!park.get('miguelito').reserved && !park.get('ratencio').reserved);
});

// ------------------------------------------------------------------ juego de peluches

test('juego: Miguelito da dos saltitos con notas y Ratencio se bambolea', () => {
  const park = createPark();
  park.place(FAR);
  const monkey = park.get('miguelito');
  const rat = park.get('ratencio');
  park.director.run(park.def('peluches-juegan'));
  assert.ok(advanceUntil(park, () => monkey.state === STATE.INTERACTING && park.director.active !== null && rat.sprite.anim === 'ratencio:wiggle'));

  park.advance(BEHAVIOR.specials.play.wiggleMs);
  const hops = park.scene.tweenLog.filter((t) => t.targets === monkey);
  assert.equal(hops.length, BEHAVIOR.specials.play.hops);
  const names = park.emotes.bursts.map((b) => b.name);
  assert.equal(names.filter((n) => n === 'note').length, 2);
  assert.ok(names.includes('sparkle'));
  assert.ok(rat.sprite.animHistory.includes('ratencio:wiggle'));
  assert.equal(rat.sprite.anim, 'ratencio:react', 'tras bambolearse, reacciona contento');

  assert.ok(advanceUntil(park, () => park.director.active === null, 5000));
  assert.ok(monkey.isFree() && rat.isFree());
});

// ------------------------------------------------------------------ siesta

test('siesta: Ratencio se duerme, salen "z", no se le elige para encuentros y despierta solo', () => {
  const park = createPark();
  park.place(FAR);
  const rat = park.get('ratencio');
  randomValue = 0; // siempre quiere dormir; duración mínima (4000 ms)
  rat.idle(100);
  park.advance(150);
  assert.equal(rat.state, STATE.SLEEPING);
  assert.equal(rat.sprite.anim, 'ratencio:sleep');
  assert.equal(rat.isFree(), false);
  assert.equal(rat.reserved, false, 'dormir no lo reserva');

  // El director no lo elige mientras duerme
  for (const c of park.characters) if (c !== rat) c.idle(1e9);
  park.director.trySpontaneous();
  const active = park.director.active;
  assert.ok(!active || (active.actor !== rat && active.target !== rat));

  park.advance(2000);
  const zzz = park.emotes.bursts.filter((b) => b.name === 'zzz').length;
  assert.ok(zzz >= 2, 'salen "z" mientras duerme');

  assert.ok(advanceUntil(park, () => rat.state !== STATE.SLEEPING, 3000), 'despierta solo (4-7 s)');
  const zzzAfterWake = park.emotes.bursts.filter((b) => b.name === 'zzz').length;
  park.advance(3000);
  assert.equal(park.emotes.bursts.filter((b) => b.name === 'zzz').length, zzzAfterWake, 'las "z" paran al despertar');
});

test('siesta: tocar a Ratencio dormido lo despierta con su frase', () => {
  const park = createPark();
  park.place(FAR);
  const rat = park.get('ratencio');
  rat.sleep(6000);
  park.advance(500);
  rat.tap();
  assert.notEqual(rat.state, STATE.SLEEPING);
  assert.equal(rat.state, STATE.INTERACTING, 'se queda un momento quieto tras despertar');
  assert.ok(DIALOGUES.wake.ratencio.includes(park.bubbles.said.at(-1).text));
  assert.equal(rat.reserved, false);
  park.advance(BEHAVIOR.tap.pauseMs + 50);
  assert.ok(rat.isFree(), 'luego vuelve a su vida normal');
});

test('siesta: nunca empieza durante un encuentro y respeta la pausa entre siestas', () => {
  const park = createPark();
  park.place(FAR);
  const rat = park.get('ratencio');
  randomValue = 0;

  // Reservado (en un encuentro): no se duerme aunque toque
  rat.reserve();
  rat.idle(10);
  park.advance(100);
  assert.notEqual(rat.state, STATE.SLEEPING);
  rat.release();

  // Duerme una vez...
  rat.idle(10);
  park.advance(50);
  assert.equal(rat.state, STATE.SLEEPING);
  rat.wake();
  // ...y justo después no vuelve a dormirse (pausa de cooldownMs)
  rat.idle(10);
  park.advance(100);
  assert.notEqual(rat.state, STATE.SLEEPING);
});

test('siesta: otros personajes sin `nap` nunca se duermen', () => {
  const park = createPark();
  park.place(FAR);
  randomValue = 0;
  const miguel = park.get('miguel');
  miguel.idle(10);
  park.advance(100);
  assert.notEqual(miguel.state, STATE.SLEEPING);
});

// ------------------------------------------------------------------ punto de encuentro

test('meetingPoint evita puntos ocupados por otros personajes', () => {
  const world = new World({ x: 0, y: 0, width: 200, height: 100 });
  const target = { x: 100, y: 50 };
  const from = { x: 20, y: 50 };
  // El lado preferido (izquierda, x=84) está ocupado: usa el otro lado
  assert.deepEqual(world.meetingPoint(target, from, 16, [{ x: 86, y: 50 }], 14), { x: 116, y: 50 });
  // Ambos lados ocupados: se cancela
  assert.equal(world.meetingPoint(target, from, 16, [{ x: 84, y: 50 }, { x: 116, y: 50 }], 14), null);
});
