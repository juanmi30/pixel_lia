import { BEHAVIOR } from '../config/behavior.js';
import { EMOTE_FRAMES } from '../config/assets.js';
import { pixelCenterX } from '../utils/anims.js';

/** Pequeños iconos (corazones, notas, brillos) que suben y se desvanecen. */
export class Emotes {
  constructor(scene) {
    this.scene = scene;
  }

  /** Lanza `count` emotes escalonados alrededor de (x, y). */
  burst(name, x, y, count = 1) {
    if (!(name in EMOTE_FRAMES)) {
      console.warn(`[emotes] emote desconocido: "${name}"`);
      return;
    }
    for (let i = 0; i < count; i++) {
      const jitter = count > 1 ? Math.round((i - (count - 1) / 2) * 6) : 0;
      this.scene.time.delayedCall(i * BEHAVIOR.emote.staggerMs, () => this.spawn(name, x + jitter, y));
    }
  }

  spawn(name, x, y) {
    const { riseDistance, durationMs } = BEHAVIOR.emote;
    const icon = this.scene.add.image(x, y, 'emotes', EMOTE_FRAMES[name]).setDepth(9000);
    icon.setOrigin(pixelCenterX(icon.width), 1);

    const sway = Math.random() < 0.5 ? -1 : 1;
    const progress = { t: 0 };
    const apply = () => {
      const t = progress.t;
      icon.setPosition(Math.round(x + Math.sin(t * Math.PI * 2) * 2 * sway), Math.round(y - riseDistance * t));
      icon.setAlpha(t < 0.12 ? t / 0.12 : t > 0.7 ? (1 - t) / 0.3 : 1);
    };
    apply();

    this.scene.tweens.add({
      targets: progress,
      t: 1,
      duration: durationMs,
      ease: 'Sine.easeOut',
      onUpdate: apply,
      onComplete: () => icon.destroy(),
    });
  }
}
