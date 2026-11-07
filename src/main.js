import Phaser from 'phaser';
import './style.css';
import { GAME } from './config/game.js';
import { BootScene } from './scenes/BootScene.js';
import { ParkScene } from './scenes/ParkScene.js';
import { LetterScene } from './scenes/LetterScene.js';
import { WelcomeScene } from './scenes/WelcomeScene.js';

/**
 * Elige un factor de ampliación entero según el tamaño de la pantalla y la
 * densidad de píxeles, para que el canvas tenga aproximadamente la resolución
 * real del dispositivo y el arte se vea nítido.
 */
function choosePixelScale() {
  const fit = Math.min(window.innerWidth / GAME.width, window.innerHeight / GAME.height);
  const scale = Math.round(fit * (window.devicePixelRatio || 1));
  return Math.min(GAME.maxPixelScale, Math.max(GAME.minPixelScale, scale));
}

const pixelScale = choosePixelScale();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  title: GAME.title,
  width: GAME.width * pixelScale,
  height: GAME.height * pixelScale,
  backgroundColor: GAME.backgroundColor,
  render: { pixelArt: true },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: { activePointers: 2 },
  callbacks: {
    preBoot: (game) => game.registry.set('pixelScale', pixelScale),
  },
  scene: [BootScene, WelcomeScene, ParkScene, LetterScene],
});

// Solo en desarrollo: acceso desde la consola del navegador para depurar.
if (import.meta.env.DEV) window.game = game;
