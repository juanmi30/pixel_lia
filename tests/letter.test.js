import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { LETTER } from '../src/config/letter.js';
import { WORLD } from '../src/config/world.js';
import { pickTapTarget } from '../src/systems/pointer.js';
import { SecretLetter } from '../src/systems/SecretLetter.js';
import { createPark } from './helpers/fakeScene.js';

const realRandom = Math.random;
beforeEach(() => {
  Math.random = () => 0.99; // nadie se duerme por azar
});
afterEach(() => {
  Math.random = realRandom;
});

/**
 * Carta conectada a un parque de prueba, como en ParkScene: la pausa detiene
 * el reloj del parque y la carta tarda `fadeMs` en ocultarse.
 */
function setup({ fadeMs = 0 } = {}) {
  const park = createPark();
  const log = [];
  let paused = false;
  let letterVisible = false;
  let pendingHide = null;
  const letter = new SecretLetter({
    pausePark: () => { paused = true; log.push('pause'); },
    resumePark: () => { paused = false; log.push('resume'); },
    showLetter: () => { letterVisible = true; log.push('show'); },
    hideLetter: (done, { immediate } = {}) => {
      log.push(immediate ? 'hide-now' : 'hide');
      const finish = () => { letterVisible = false; done(); };
      if (immediate || fadeMs === 0) finish();
      else pendingHide = finish;
    },
  });
  /** Avanza el parque solo si no está en pausa (como Phaser con una escena pausada). */
  const advance = (ms) => { if (!paused) park.advance(ms); };
  const finishFade = () => { const f = pendingHide; pendingHide = null; f?.(); };
  /** Toque como en ParkScene.handlePointerDown. */
  const tapAt = (objects) => {
    const target = pickTapTarget(objects, 0, 0, { blocked: letter.isActive });
    if (target?.type === 'character') target.character.tap();
    else if (target?.type === 'secret') letter.open();
    return target;
  };
  return { park, letter, log, advance, finishFade, tapAt, isPaused: () => paused, isVisible: () => letterVisible };
}

const flowerObject = { getData: (k) => (k === 'secret' ? true : undefined) };
const objectOf = (character) => ({ getData: (k) => (k === 'character' ? character : undefined) });

test('la carta tiene su texto en un archivo de configuración', () => {
  assert.equal(LETTER.greeting, 'Para mi Lía');
  assert.ok(LETTER.body.join(' ').includes('mil veces te encontraría a ti'));
  assert.ok(LETTER.signature.includes('Miguel'));
  assert.ok(LETTER.closeLabel);
});

test('la flor está fuera de la zona caminable, así que no estorba a los personajes', () => {
  const { x, y } = WORLD.secretFlower;
  const b = WORLD.walkBounds;
  assert.ok(y < b.y, 'por encima de la zona caminable');
  assert.ok(x >= 0 && x < 320);
});

test('tocar la flor abre la carta y pausa el parque', () => {
  const t = setup();
  assert.deepEqual(t.tapAt([flowerObject]), { type: 'secret' });
  assert.equal(t.letter.isOpen, true);
  assert.ok(t.isPaused() && t.isVisible());
  assert.deepEqual(t.log, ['pause', 'show']);
});

test('con la carta abierta los toques no llegan a personajes ni a la flor', () => {
  const t = setup();
  const lia = t.park.get('lia');
  t.letter.open();
  assert.equal(t.tapAt([objectOf(lia), flowerObject]), null);
  assert.equal(t.park.bubbles.said.length, 0, 'Lía no dijo nada');
  assert.equal(t.letter.open(), false, 'abrir otra vez no hace nada');
  assert.deepEqual(t.log, ['pause', 'show']);
});

test('los personajes tienen prioridad sobre la flor', () => {
  const t = setup();
  const miguel = t.park.get('miguel');
  const target = t.tapAt([flowerObject, objectOf(miguel)]);
  assert.equal(target.type, 'character');
  assert.equal(t.letter.isOpen, false);
});

test('cerrar con el botón (o Escape) oculta la carta y reanuda el parque', () => {
  const t = setup({ fadeMs: 260 });
  t.letter.open();
  assert.equal(t.letter.close(), true);
  // Mientras se desvanece, el parque sigue en pausa y no acepta toques ni reaperturas
  assert.ok(t.isPaused());
  assert.equal(t.tapAt([flowerObject]), null);
  assert.equal(t.letter.open(), false);
  t.finishFade();
  assert.ok(!t.isPaused() && !t.isVisible() && !t.letter.isOpen);
  assert.equal(t.letter.close(), false, 'cerrar dos veces no hace nada');
  assert.deepEqual(t.log, ['pause', 'show', 'hide', 'resume']);
});

test('se puede abrir y cerrar muchas veces', () => {
  const t = setup();
  for (let i = 0; i < 5; i++) {
    assert.equal(t.letter.open(), true);
    assert.equal(t.letter.close(), true);
  }
  assert.equal(t.log.filter((e) => e === 'pause').length, 5);
  assert.equal(t.log.filter((e) => e === 'resume').length, 5);
  assert.ok(!t.isPaused());
});

test('al cerrar avisa para los corazoncitos sobre Miguel y Lía', () => {
  const t = setup();
  let closed = 0;
  t.letter.on('closed', () => closed++);
  t.letter.open();
  t.letter.close();
  assert.equal(closed, 1);
});

test('el parque se recupera: el encuentro en curso termina y no se duplican temporizadores', () => {
  const t = setup();
  const { park } = t;
  park.place({ miguel: { x: 80, y: 150 }, lia: { x: 200, y: 150 }, miguelito: { x: 90, y: 90 }, ratencio: { x: 230, y: 90 } });
  park.director.run(park.def('miguel-busca-lia'));
  t.advance(1500);
  const miguelX = park.get('miguel').x;
  const timersBefore = park.scene.pendingTimers();

  t.letter.open();
  t.advance(10000); // en pausa: nada se mueve
  assert.equal(park.get('miguel').x, miguelX);
  t.letter.close();
  assert.equal(park.scene.pendingTimers(), timersBefore, 'abrir y cerrar no crea temporizadores');

  // Vuelve a la normalidad: el encuentro sigue, termina y todos quedan libres
  let ok = false;
  for (let i = 0; i < 1500 && !ok; i++) {
    t.advance(16);
    ok = park.director.active === null;
  }
  assert.ok(ok, 'el encuentro termina');
  assert.ok(park.characters.every((c) => !c.reserved));
});

test('cerrar la escena con la carta abierta la oculta sin reanudar nada y no se puede reabrir', () => {
  const t = setup({ fadeMs: 260 });
  t.letter.open();
  t.letter.destroy();
  assert.ok(!t.isVisible());
  assert.deepEqual(t.log, ['pause', 'show', 'hide-now']);
  assert.equal(t.letter.isOpen, false);
  assert.equal(t.letter.open(), false);
  assert.equal(t.letter.close(), false);
});

test('cerrar la escena mientras la carta se desvanece no reanuda una escena que ya no existe', () => {
  const t = setup({ fadeMs: 260 });
  t.letter.open();
  t.letter.close();
  t.letter.destroy();
  t.finishFade(); // la transición termina después
  assert.ok(!t.log.includes('resume'));
});
